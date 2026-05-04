/**
 * PayU Latam — Payment Links
 * GuanaGO · GuíaSAI
 *
 * Flujo:
 *   POST /api/payments/create  → genera link de pago y lo persiste en Airtable (24h)
 *   GET  /pagar/:ref           → página HTML que auto-submite a PayU checkout
 *   POST /api/payments/webhook → confirmación de PayU, actualiza Airtable
 *
 * Env vars requeridas:
 *   PAYU_MERCHANT_ID=508029        ← sandbox
 *   PAYU_ACCOUNT_ID=512321         ← sandbox Colombia
 *   PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA  ← sandbox
 *   PAYU_TEST=1 (sandbox) | PAYU_TEST=0 (producción)
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 *   BACKEND_URL=https://guanago-backend.onrender.com  ← URL del servicio Render
 *   FRONTEND_URL=https://www.guanago.travel            ← URL del frontend (botón "volver")
 *   BASE_URL=https://www.guanago.travel                ← fallback si no se definen los anteriores
 */

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// ─── PayU endpoints ───────────────────────────────────────────────────────────
const PAYU_CHECKOUT = {
  sandbox: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
  prod:    'https://checkout.payulatam.com/ppp-web-gateway-payu/',
};

// ─── Airtable — persistencia de pagos temporales ──────────────────────────────
const PAGOS_TABLE = 'PagosTemporales';

async function savePagoTemporal(referenceCode, fields, payuUrl, meta) {
  const AT_KEY  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!AT_KEY) throw new Error('AIRTABLE_API_KEY no configurado');

  const expiresAt = new Date(Date.now() + 86_400_000).toISOString(); // 24h

  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(PAGOS_TABLE)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [{ fields: { referenceCode, Payload: JSON.stringify({ fields, payuUrl, meta }), ExpiresAt: expiresAt } }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable savePago error ${res.status}: ${err}`);
  }
}

async function getPagoTemporal(referenceCode) {
  const AT_KEY  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!AT_KEY) return null;

  const formula = encodeURIComponent(`{referenceCode}="${referenceCode}"`);
  const res = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(PAGOS_TABLE)}?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${AT_KEY}` } },
  );

  if (!res.ok) return null;
  const data = await res.json();
  const record = data.records?.[0];
  if (!record) return null;

  // Verificar TTL
  const expiresAt = record.fields.ExpiresAt;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    console.warn(`⏱️ Pago expirado: ${referenceCode}`);
    return null;
  }

  try {
    return JSON.parse(record.fields.Payload);
  } catch {
    return null;
  }
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// ─── POST /api/payments/create ────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const {
    cotizacionId, voucherId,
    amount, description,
    buyerName, buyerEmail, buyerPhone,
  } = req.body;

  const MERCHANT_ID  = (process.env.PAYU_MERCHANT_ID  || '').trim();
  const ACCOUNT_ID   = (process.env.PAYU_ACCOUNT_ID   || '').trim();
  const API_KEY      = (process.env.PAYU_API_KEY       || '').trim();
  const IS_TEST      = (process.env.PAYU_TEST          || '').trim() === '0' ? '0' : '1';
  // BACKEND_URL → URL del servicio Render (donde viven /pagar y /api/payments/webhook)
  // FRONTEND_URL → URL del frontend para redirección post-pago (opcional)
  const BACKEND_URL  = (process.env.BACKEND_URL  || process.env.BASE_URL || 'https://www.guanago.travel').trim().replace(/\/$/, '');
  const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.BASE_URL || 'https://www.guanago.travel').trim().replace(/\/$/, '');

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
  // COP requires integer amount (no decimals) for PayU signature and form
  const amountStr     = String(Math.round(parsed));
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
    responseUrl:     `${BACKEND_URL}/pago-resultado`,
    confirmationUrl: `${BACKEND_URL}/api/payments/webhook`,
  };

  try {
    await savePagoTemporal(referenceCode, fields, payuUrl, {
      cotizacionId, voucherId, amount: parsed, description, buyerName, buyerEmail,
    });
    console.log(`💳 Link de pago creado: ${referenceCode} · $${amountStr} COP · test=${IS_TEST}`);
    console.log(`🔑 Firma: MD5("${API_KEY}~${MERCHANT_ID}~${referenceCode}~${amountStr}~${currency}") = ${signature}`);
  } catch (err) {
    console.error('❌ Error guardando pago en Airtable:', err.message);
    return res.status(500).json({ error: 'No se pudo guardar el link de pago. Intenta de nuevo.' });
  }

  res.json({
    success: true,
    pagoUrl: `${BACKEND_URL}/pagar/${referenceCode}`,
    referenceCode,
    test: IS_TEST === '1',
  });
});

// ─── GET /pagar/:referenceCode — página de pago ───────────────────────────────
router.get('/:referenceCode', async (req, res) => {
  let data;
  try {
    data = await getPagoTemporal(req.params.referenceCode);
  } catch (err) {
    console.error('❌ Error leyendo pago de Airtable:', err.message);
  }

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
  const newAmount = parseFloat(value || '0').toFixed(1);
  const expected  = md5(`${API_KEY}~${MERCHANT_ID}~${reference_sale}~${newAmount}~${currency}~${state_pol}`);

  if (sign !== expected) {
    console.warn('⚠️ PayU webhook firma inválida. Recibida:', sign, '| Esperada:', expected);
    return res.status(400).send('Invalid signature');
  }

  // state_pol: 4=Aprobado 6=Rechazado 7=Pendiente 104=Error
  const ESTADO_MAP = { '4': 'Pagado', '6': 'Rechazado', '7': 'Pendiente pago', '104': 'Error pago' };
  const estadoNuevo = ESTADO_MAP[state_pol] || `Estado ${state_pol}`;
  console.log(`✅ ${reference_sale} → ${estadoNuevo}`);

  // Extraer cotizacionId de referenceCode "GG-{id}-{timestamp}"
  const match    = (reference_sale || '').match(/^GG-(.+)-\d+$/);
  const entityId = match?.[1];

  if (entityId && state_pol === '4') {
    try {
      const AT_KEY  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
      const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';

      await fetch(`https://api.airtable.com/v0/${AT_BASE}/CotizacionesGG/${entityId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Estado': 'Pagado',
            'PayU Reference':    reference_sale,
            'PayU Transaction':  transaction_id || '',
          },
        }),
      });
      console.log(`✅ Cotización ${entityId} marcada Pagado en Airtable`);
    } catch (err) {
      console.error('❌ Airtable update error:', err.message);
    }
  }

  res.status(200).send('OK');
});

// ─── GET /pago-resultado — página de resultado post-pago ──────────────────────
// PayU redirige aquí con query params después de que el usuario paga (o falla)
// Exportado como named export para montarlo en server.js en /pago-resultado
export function resultadoPago(req, res) {
  const {
    transactionState, referenceCode, TX_VALUE, currency,
    description, buyerFullName, message, sign,
    transactionId, authorizationCode,
  } = req.query;

  const API_KEY     = (process.env.PAYU_API_KEY     || '').trim();
  const MERCHANT_ID = (process.env.PAYU_MERCHANT_ID || '').trim();

  // Validar firma
  let firmaValida = true;
  if (API_KEY && MERCHANT_ID && sign && referenceCode && TX_VALUE && currency && transactionState) {
    const expected = md5(`${API_KEY}~${MERCHANT_ID}~${referenceCode}~${parseFloat(TX_VALUE).toFixed(1)}~${currency}~${transactionState}`);
    firmaValida = sign === expected;
    if (!firmaValida) console.warn('⚠️ /pago-resultado firma inválida:', { sign, expected });
  }

  const STATE_MAP = {
    '4':   { emoji: '✅', titulo: '¡Pago aprobado!',  color: '#16a34a', bg: '#dcfce7', msg: 'Tu pago fue procesado exitosamente.' },
    '6':   { emoji: '❌', titulo: 'Pago rechazado',    color: '#dc2626', bg: '#fee2e2', msg: message || 'El pago no pudo procesarse. Intenta con otro método.' },
    '7':   { emoji: '⏳', titulo: 'Pago pendiente',    color: '#d97706', bg: '#fef3c7', msg: 'Tu pago está siendo validado. Te notificaremos pronto.' },
    '104': { emoji: '⚠️', titulo: 'Error en el pago', color: '#7c3aed', bg: '#ede9fe', msg: message || 'Ocurrió un error. Contacta a tu asesor.' },
  };

  const estado   = STATE_MAP[transactionState] || STATE_MAP['104'];
  const monto    = TX_VALUE ? parseFloat(TX_VALUE).toLocaleString('es-CO', { minimumFractionDigits: 0 }) : '—';
  const aprobado = transactionState === '4';
  const homeUrl  = (process.env.FRONTEND_URL || process.env.BASE_URL || 'https://www.guanago.travel');
  const whatsapp = 'https://wa.me/573153836043';

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${estado.titulo} · GuíaSAI</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#003D5C,#00A8A0);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
    .card{background:white;border-radius:20px;padding:36px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);}
    .badge{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-weight:700;font-size:15px;margin-bottom:20px;background:${estado.bg};color:${estado.color};}
    h2{font-size:22px;color:#1e293b;margin-bottom:8px;}
    .msg{color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;}
    .details{background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;}
    .details dt{font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:2px;}
    .details dd{font-size:13px;color:#334155;margin-bottom:10px;font-weight:600;}
    .details dd:last-child{margin-bottom:0;}
    .btn{display:block;padding:14px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:10px;transition:opacity .2s;}
    .btn:hover{opacity:.85}
    .btn-primary{background:linear-gradient(135deg,#003D5C,#00A8A0);color:white;}
    .btn-wa{background:#25D366;color:white;}
    .logo{color:#FF6600;font-size:22px;font-weight:800;margin-bottom:4px;}
    .sub{color:#94a3b8;font-size:11px;margin-bottom:28px;}
    .ref{font-size:10px;color:#cbd5e1;margin-top:16px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GuíaSAI</div>
    <div class="sub">San Andrés Isla · Especialistas en Turismo</div>
    <div class="badge">${estado.emoji} ${estado.titulo}</div>
    <h2>${buyerFullName ? `Hola, ${String(buyerFullName).split(' ')[0]}` : 'Resultado de tu pago'}</h2>
    <p class="msg">${estado.msg}</p>
    <dl class="details">
      ${description ? `<dt>Servicio</dt><dd>${description}</dd>` : ''}
      ${TX_VALUE    ? `<dt>Monto</dt><dd>$${monto} ${currency || 'COP'}</dd>` : ''}
      ${authorizationCode && aprobado ? `<dt>Autorización</dt><dd>${authorizationCode}</dd>` : ''}
      ${referenceCode ? `<dt>Referencia</dt><dd>${referenceCode}</dd>` : ''}
    </dl>
    ${aprobado
      ? `<a class="btn btn-primary" href="${homeUrl}">🌴 Volver a GuanaGO</a>`
      : `<a class="btn btn-wa" href="${whatsapp}" target="_blank">💬 Hablar con un asesor</a>
         <a class="btn btn-primary" href="${homeUrl}">← Volver al inicio</a>`
    }
    <p class="ref">${transactionId ? `TX: ${transactionId}` : ''}${!firmaValida ? ' · ⚠️ Firma no verificada' : ''}</p>
  </div>
</body>
</html>`);
}

export default router;
