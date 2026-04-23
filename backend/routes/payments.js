/**
 * PayU Latam — Payment Links
 * GuanaGO · GuíaSAI
 *
 * Flujo:
 *   POST /api/payments/create  → genera link de pago y lo guarda en memoria (24h)
 *   GET  /pagar/:ref           → página HTML que auto-submite a PayU checkout
 *   POST /api/payments/webhook → confirmación de PayU, actualiza Airtable
 *
 * Env vars requeridas:
 *   PAYU_MERCHANT_ID, PAYU_ACCOUNT_ID, PAYU_API_KEY
 *   PAYU_TEST=1 (sandbox) | PAYU_TEST=0 (producción)
 *   BASE_URL=https://www.guanago.travel
 */

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// ─── PayU endpoints ───────────────────────────────────────────────────────────
// Usa PAYU_GATEWAY_URL del .env si está definido; si no, usa el checkout estándar.
const PAYU_CHECKOUT = {
  sandbox: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
  prod:    process.env.PAYU_GATEWAY_URL || 'https://checkout.payulatam.com/ppp-web-gateway-payu/',
};

// ─── Almacén en memoria (TTL 24h) ─────────────────────────────────────────────
const pendingPayments = new Map();

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function cleanOldPayments() {
  const cutoff = Date.now() - 86_400_000; // 24h
  for (const [key, val] of pendingPayments) {
    if (val.createdAt < cutoff) pendingPayments.delete(key);
  }
}

// ─── POST /api/payments/create ────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const {
    cotizacionId, voucherId,
    amount, description,
    buyerName, buyerEmail, buyerPhone,
  } = req.body;

  const MERCHANT_ID = process.env.PAYU_MERCHANT_ID;
  const ACCOUNT_ID  = process.env.PAYU_ACCOUNT_ID;
  const API_KEY     = process.env.PAYU_API_KEY;
  const IS_TEST     = process.env.PAYU_TEST === '0' ? '0' : '1'; // sandbox por defecto
  const BASE_URL    = process.env.BASE_URL || 'https://www.guanago.travel';

  if (!MERCHANT_ID || !API_KEY || !ACCOUNT_ID) {
    return res.status(503).json({
      error: 'PayU no configurado en el servidor.',
      missing: [
        !MERCHANT_ID && 'PAYU_MERCHANT_ID',
        !ACCOUNT_ID  && 'PAYU_ACCOUNT_ID',
        !API_KEY     && 'PAYU_API_KEY',
      ].filter(Boolean),
    });
  }

  const parsed = parseFloat(amount);
  if (!amount || isNaN(parsed) || parsed <= 0) {
    return res.status(400).json({ error: 'amount requerido y debe ser mayor a 0' });
  }

  const sourceId      = cotizacionId || voucherId || 'VENTA';
  const referenceCode = `GG-${sourceId}-${Date.now()}`;
  const amountStr     = parsed.toFixed(2);
  const currency      = 'COP';
  const payuUrl       = IS_TEST === '1' ? PAYU_CHECKOUT.sandbox : PAYU_CHECKOUT.prod;

  const signature = md5(`${API_KEY}~${MERCHANT_ID}~${referenceCode}~${amountStr}~${currency}`);

  const fields = {
    merchantId:      MERCHANT_ID,
    accountId:       ACCOUNT_ID,
    description:     description || 'Servicios Turísticos GuíaSAI — San Andrés Isla',
    referenceCode,
    amount:          amountStr,
    tax:             '0',
    taxReturnBase:   '0',
    currency,
    signature,
    test:            IS_TEST,
    buyerEmail:      buyerEmail    || '',
    buyerFullName:   buyerName     || '',
    mobilePhone:     (buyerPhone   || '').replace(/\s/g, ''),
    responseUrl:     `${BASE_URL}/pago-resultado`,
    confirmationUrl: `${BASE_URL}/api/payments/webhook`,
  };

  pendingPayments.set(referenceCode, {
    fields,
    payuUrl,
    meta: { cotizacionId, voucherId, amount: parsed, description, buyerName, buyerEmail },
    createdAt: Date.now(),
  });
  cleanOldPayments();

  console.log(`💳 Link de pago creado: ${referenceCode} · $${amountStr} COP`);

  res.json({
    success: true,
    pagoUrl: `${BASE_URL}/pagar/${referenceCode}`,
    referenceCode,
    test: IS_TEST === '1',
  });
});

// ─── GET /pagar/:referenceCode — página de pago ───────────────────────────────
router.get('/:referenceCode', (req, res) => {
  const data = pendingPayments.get(req.params.referenceCode);

  if (!data) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link expirado · GuíaSAI</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}.card{background:white;border-radius:16px;padding:40px;max-width:400px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1);}h2{color:#ef4444;margin-bottom:12px;}p{color:#64748b;font-size:14px;line-height:1.6;margin-bottom:16px;}a{color:#0ea5e9;font-weight:600;}</style>
</head><body><div class="card">
  <div style="font-size:40px;margin-bottom:16px;">🔗</div>
  <h2>Link expirado</h2>
  <p>Este link de pago ya no está disponible.<br>Solicita uno nuevo a tu asesor de GuíaSAI.</p>
  <a href="https://wa.me/573153836043">💬 Contactar por WhatsApp</a>
</div></body></html>`);
  }

  const { fields, payuUrl } = data;
  const amountDisplay = parseFloat(fields.amount).toLocaleString('es-CO', { minimumFractionDigits: 0 });

  const formInputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`)
    .join('\n    ');

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pago Seguro · GuíaSAI</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#003D5C,#00A8A0);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
    .card{background:white;border-radius:20px;padding:36px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);}
    .logo{color:#FF6600;font-size:26px;font-weight:800;letter-spacing:-1px;}
    .sub{color:#94a3b8;font-size:12px;margin-bottom:28px;}
    .amount{font-size:42px;font-weight:800;color:#1e293b;margin-bottom:4px;}
    .currency{color:#64748b;font-size:13px;margin-bottom:8px;}
    .desc{color:#475569;font-size:14px;margin-bottom:28px;background:#f8fafc;padding:12px 16px;border-radius:10px;line-height:1.5;}
    .btn{background:linear-gradient(135deg,#FF6600,#e55a00);color:white;border:none;padding:16px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;width:100%;transition:opacity .2s;}
    .btn:hover{opacity:.9}
    .spinner{display:none;margin:16px auto;width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#FF6600;border-radius:50%;animation:spin 1s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg)}}
    .secure{color:#94a3b8;font-size:11px;margin-top:20px;line-height:1.6;}
    .payu-logo{color:#0061b0;font-weight:700;font-size:13px;}
    ${data.meta.cotizacionId || data.meta.voucherId ? '' : ''}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GuíaSAI</div>
    <div class="sub">San Andrés Isla · Especialistas en Turismo</div>

    <div class="amount">$${amountDisplay}</div>
    <div class="currency">COP — Pesos Colombianos</div>

    <div class="desc">${fields.description}</div>

    <form id="payuForm" method="POST" action="${payuUrl}">
      ${formInputs}
    </form>

    <button class="btn" id="payBtn" onclick="pay()">
      🔒 Pagar con Tarjeta
    </button>
    <div class="spinner" id="spinner"></div>

    <div class="secure">
      Pago 100% seguro procesado por<br>
      <span class="payu-logo">PayU Latam</span> · Encriptación SSL<br>
      Visa · Mastercard · PSE · Efecty
    </div>
  </div>
  <script>
    function pay() {
      document.getElementById('payBtn').style.display = 'none';
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('payuForm').submit();
    }
  </script>
</body>
</html>`);
});

// ─── POST /api/payments/webhook — confirmación de PayU ────────────────────────
router.post('/webhook', express.urlencoded({ extended: true }), async (req, res) => {
  const {
    merchant_id, reference_sale, value, currency,
    state_pol, sign, transaction_id,
  } = req.body;

  const API_KEY     = process.env.PAYU_API_KEY;
  const MERCHANT_ID = process.env.PAYU_MERCHANT_ID;

  console.log('💳 PayU webhook:', { reference_sale, state_pol, value });

  // Validar firma: MD5("apiKey~merchantId~referenceCode~newAmount~currency~state_pol")
  const newAmount   = parseFloat(value || '0').toFixed(1);
  const expected    = md5(`${API_KEY}~${MERCHANT_ID}~${reference_sale}~${newAmount}~${currency}~${state_pol}`);

  if (sign !== expected) {
    console.warn('⚠️ PayU webhook firma inválida. Recibida:', sign, '| Esperada:', expected);
    return res.status(400).send('Invalid signature');
  }

  // state_pol: 4=Aprobado 6=Rechazado 7=Pendiente 104=Error
  const ESTADO_MAP = { '4': 'Pagado', '6': 'Rechazado', '7': 'Pendiente pago', '104': 'Error pago' };
  const estadoNuevo = ESTADO_MAP[state_pol] || `Estado ${state_pol}`;
  console.log(`✅ ${reference_sale} → ${estadoNuevo}`);

  // Extraer cotizacionId de referenceCode "GG-{id}-{timestamp}"
  const match = (reference_sale || '').match(/^GG-(.+)-\d+$/);
  const entityId = match?.[1];

  if (entityId && state_pol === '4') {
    try {
      const AT_KEY  = process.env.AIRTABLE_API_KEY;
      const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';

      await fetch(`https://api.airtable.com/v0/${AT_BASE}/CotizacionesGG/${entityId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Estado': 'Pagado',
            'PayU Reference': reference_sale,
            'PayU Transaction':  transaction_id || '',
          }
        }),
      });
      console.log(`✅ Cotización ${entityId} marcada Pagado en Airtable`);
    } catch (err) {
      console.error('❌ Airtable update error:', err.message);
    }
  }

  res.status(200).send('OK');
});

export default router;
