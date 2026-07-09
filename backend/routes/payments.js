/**
 * Wompi — Links de pago
 * GuíaSAI · San Andrés Islas
 *
 * Flujo:
 *   POST /api/payments/create  → genera link de pago Wompi y lo persiste en Airtable (24h)
 *   GET  /pagar/:ref           → página HTML con botón que abre Wompi Web Checkout
 *   POST /api/payments/webhook → evento transaction.updated de Wompi, actualiza Airtable
 *   GET  /pago-resultado       → página de resultado (Wompi redirige con ?id=<tx>&env=)
 *
 * Env vars requeridas (Render → Environment):
 *   WOMPI_PUBLIC_KEY       pub_test_xxx (sandbox) | pub_prod_xxx (producción)
 *   WOMPI_INTEGRITY_SECRET test_integrity_xxx | prod_integrity_xxx
 *   WOMPI_EVENTS_SECRET    test_events_xxx | prod_events_xxx (firma del webhook)
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 *   BACKEND_URL / FRONTEND_URL / BASE_URL — igual que antes
 *
 * El modo test/producción se deduce del prefijo de WOMPI_PUBLIC_KEY.
 * En el dashboard de Wompi configurar URL de eventos:
 *   {BACKEND_URL}/api/payments/webhook
 *
 * Nota Airtable: los campos 'PayU_Reference' y 'PayU_Transaction_ID' de
 * CotizacionesGG se reutilizan para los datos Wompi (renombrarlos en Airtable
 * requiere actualizar este archivo a la vez — los nombres de campo son el API).
 */

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// ─── Wompi endpoints ──────────────────────────────────────────────────────────
const WOMPI_CHECKOUT = 'https://checkout.wompi.co/p/';
const WOMPI_API = {
  test: 'https://sandbox.wompi.co/v1',
  prod: 'https://production.wompi.co/v1',
};

function wompiEnv() {
  const pub = (process.env.WOMPI_PUBLIC_KEY || '').trim();
  return {
    publicKey: pub,
    integritySecret: (process.env.WOMPI_INTEGRITY_SECRET || '').trim(),
    eventsSecret: (process.env.WOMPI_EVENTS_SECRET || '').trim(),
    isTest: pub.startsWith('pub_test_'),
  };
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// ─── Airtable — persistencia de pagos temporales ──────────────────────────────
const PAGOS_TABLE = 'PagosTemporales';

async function savePagoTemporal(referenceCode, payload) {
  const AT_KEY  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!AT_KEY) throw new Error('AIRTABLE_API_KEY no configurado');

  const expiresAt = new Date(Date.now() + 86_400_000).toISOString(); // 24h

  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(PAGOS_TABLE)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [{ fields: { referenceCode, Payload: JSON.stringify(payload), ExpiresAt: expiresAt } }],
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

// ─── POST /api/payments/create ────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const {
    cotizacionId, voucherId,
    amount, description,
    buyerName, buyerEmail, buyerPhone,
  } = req.body;

  const { publicKey, integritySecret, isTest } = wompiEnv();
  const BACKEND_URL = (process.env.BACKEND_URL || process.env.BASE_URL || 'https://www.guanago.travel').trim().replace(/\/$/, '');

  if (!publicKey || !integritySecret) {
    return res.status(503).json({
      error: 'Wompi no configurado en el servidor.',
      missing: [
        !publicKey       && 'WOMPI_PUBLIC_KEY',
        !integritySecret && 'WOMPI_INTEGRITY_SECRET',
      ].filter(Boolean),
    });
  }

  const parsed = parseFloat(amount);
  if (!amount || isNaN(parsed) || parsed <= 0) {
    return res.status(400).json({ error: 'amount requerido y debe ser mayor a 0' });
  }

  const sourceId      = cotizacionId || voucherId || 'VENTA';
  const referenceCode = `GG-${sourceId}-${Date.now()}`;
  // COP entero. 8% agregado para cubrir costo de pasarela (política comercial vigente).
  const subtotal      = Math.round(parsed);
  const fee           = Math.round(parsed * 0.08);
  const total         = subtotal + fee;
  const amountInCents = total * 100;
  const currency      = 'COP';

  // Firma de integridad Wompi: SHA256(referencia + montoEnCentavos + moneda + secreto)
  const integrity = sha256(`${referenceCode}${amountInCents}${currency}${integritySecret}`);

  const params = new URLSearchParams({
    'public-key':          publicKey,
    'currency':            currency,
    'amount-in-cents':     String(amountInCents),
    'reference':           referenceCode,
    'signature:integrity': integrity,
    'redirect-url':        `${BACKEND_URL}/pago-resultado`,
  });
  if (buyerEmail) params.set('customer-data:email', buyerEmail);
  if (buyerName)  params.set('customer-data:full-name', buyerName);
  if (buyerPhone) {
    params.set('customer-data:phone-number', String(buyerPhone).replace(/\D/g, '').replace(/^57/, ''));
    params.set('customer-data:phone-number-prefix', '+57');
  }

  const checkoutUrl = `${WOMPI_CHECKOUT}?${params.toString()}`;

  try {
    await savePagoTemporal(referenceCode, {
      checkoutUrl,
      description: description || 'Servicios Turísticos GuíaSAI — San Andrés Isla',
      amountTotal: total,
      subtotal,
      fee,
      currency,
      buyerName:  buyerName  || '',
      buyerEmail: buyerEmail || '',
      isTest,
      meta: { cotizacionId, voucherId, amount: parsed },
    });
    console.log(`💳 Link Wompi creado: ${referenceCode} · $${subtotal} + $${fee} fee = $${total} COP · test=${isTest}`);
  } catch (err) {
    console.error('❌ Error guardando pago en Airtable:', err.message);
    return res.status(500).json({ error: 'No se pudo guardar el link de pago. Intenta de nuevo.' });
  }

  res.json({
    success: true,
    pagoUrl: `${BACKEND_URL}/pagar/${referenceCode}`,
    referenceCode,
    test: isTest,
    subtotal,
    feeAmount: fee,
    totalAmount: total,
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

  const amountDisplay = (data.amountTotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 });

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
    .btn{display:block;background:linear-gradient(135deg,#FF6600,#e55a00);color:white;text-decoration:none;padding:16px;border-radius:12px;font-size:16px;font-weight:700;width:100%;transition:opacity .2s;}
    .btn:hover{opacity:.9}
    .secure{color:#94a3b8;font-size:11px;margin-top:20px;line-height:1.6;}
    .wompi-logo{color:#1d1d43;font-weight:700;font-size:13px;}
    ${data.isTest ? '.test-banner{background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;margin-bottom:16px;}' : ''}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GuíaSAI</div>
    <div class="sub">RNT 48674 · San Andrés Islas · Turismo Raizal</div>
    ${data.isTest ? '<div class="test-banner">⚠️ MODO PRUEBAS — no se cobrará dinero real</div>' : ''}

    <div class="amount">$${amountDisplay}</div>
    <div class="currency">COP — Pesos Colombianos</div>

    <div class="desc">${data.description}</div>

    <a class="btn" href="${data.checkoutUrl}">🔒 Pagar ahora</a>

    <div class="secure">
      Pago 100% seguro procesado por<br>
      <span class="wompi-logo">Wompi · Bancolombia</span> · Encriptación SSL<br>
      Nequi · Tarjetas · PSE · Botón Bancolombia
    </div>
  </div>
</body>
</html>`);
});

// ─── POST /api/payments/webhook — eventos de Wompi ────────────────────────────
// Configurar en el dashboard Wompi: URL de eventos = {BACKEND_URL}/api/payments/webhook
router.post('/webhook', express.json(), async (req, res) => {
  const evento = req.body || {};
  const tx = evento?.data?.transaction;

  if (evento.event !== 'transaction.updated' || !tx) {
    return res.status(200).send('OK'); // evento no relevante — confirmar recepción
  }

  console.log('💳 Wompi webhook:', { reference: tx.reference, status: tx.status, amount: tx.amount_in_cents });

  // ── Validar firma del evento ──
  // checksum = SHA256(concat(valores de signature.properties en orden) + timestamp + EVENTS_SECRET)
  const { eventsSecret } = wompiEnv();
  if (eventsSecret) {
    const props     = evento?.signature?.properties || [];
    const checksum  = evento?.signature?.checksum || '';
    const timestamp = evento?.timestamp;
    const getPath   = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), evento.data);
    const concat    = props.map(p => String(getPath(evento.data, p) ?? '')).join('');
    const expected  = sha256(`${concat}${timestamp}${eventsSecret}`);
    if (checksum.toLowerCase() !== expected.toLowerCase()) {
      console.warn('⚠️ Wompi webhook firma inválida. Recibida:', checksum, '| Esperada:', expected);
      return res.status(400).send('Invalid signature');
    }
  } else {
    console.warn('⚠️ WOMPI_EVENTS_SECRET no configurado — webhook aceptado SIN validar firma');
  }

  // ── Mapear estado ──
  const ESTADO_MAP = {
    APPROVED: 'Pagado',
    DECLINED: 'Rechazado',
    PENDING:  'Pendiente pago',
    VOIDED:   'Anulado',
    ERROR:    'Error pago',
  };
  const estadoNuevo = ESTADO_MAP[tx.status] || `Estado ${tx.status}`;
  const valorCOP    = (tx.amount_in_cents || 0) / 100;
  console.log(`✅ ${tx.reference} → ${estadoNuevo}`);

  // Extraer cotizacionId de referenceCode "GG-{id}-{timestamp}"
  const match    = (tx.reference || '').match(/^GG-(.+)-\d+$/);
  const entityId = match?.[1];

  if (entityId && tx.status === 'APPROVED') {
    const AT_KEY  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    const AT_HDR  = { 'Authorization': `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' };
    const AT      = (table) => `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`;

    // Número de reserva: GG-{año}-{últimos 4 del transaction id}
    const year       = new Date().getFullYear();
    const txSuffix   = (tx.id || Date.now().toString()).slice(-4).toUpperCase();
    const numReserva = `GG-${year}-${txSuffix}`;

    // 1. Actualizar CotizacionesGG (campos PayU_* reutilizados para Wompi — ver nota arriba)
    try {
      await fetch(`${AT('CotizacionesGG')}/${entityId}`, {
        method: 'PATCH',
        headers: AT_HDR,
        body: JSON.stringify({
          fields: {
            'Estado':              'Pagado',
            'PayU_Reference':      tx.reference,
            'PayU_Transaction_ID': tx.id || '',
            'Valor_Pagado':        valorCOP,
            'Numero_Reserva':      numReserva,
          },
        }),
      });
      console.log(`✅ CotizacionesGG/${entityId} → Pagado · Reserva ${numReserva}`);
    } catch (err) {
      console.error('❌ CotizacionesGG update error:', err.message);
    }

    // 2. Crear registro en tabla Pagos
    try {
      await fetch(AT('Pagos'), {
        method: 'POST',
        headers: AT_HDR,
        body: JSON.stringify({
          fields: {
            'ID':          numReserva,
            'Monto':       valorCOP,
            'Metodo_Pago': tx.payment_method_type || 'Wompi',
            'Estado':      'Completado',
            'Fecha_Pago':  new Date().toISOString(),
            'Referencia':  tx.reference,
          },
        }),
      });
      console.log(`✅ Pago registrado en tabla Pagos: ${numReserva}`);
    } catch (err) {
      console.error('❌ Pagos create error:', err.message);
    }

    // 3. Disparar webhook Make (email + Google Drive) — mismo payload que antes
    const MAKE_WEBHOOK_PAGOS = process.env.MAKE_WEBHOOK_PAGOS;
    if (MAKE_WEBHOOK_PAGOS) {
      fetch(MAKE_WEBHOOK_PAGOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotizacion_id:   entityId,
          reference_sale:  tx.reference,
          transaction_id:  tx.id || '',
          valor:           valorCOP,
          moneda:          tx.currency || 'COP',
          metodo_pago:     tx.payment_method_type || 'Wompi',
          email_comprador: tx.customer_email || '',
          numero_reserva:  numReserva,
          fecha_pago:      new Date().toISOString(),
        }),
      }).catch(e => console.error('⚠️ Make webhook pagos error:', e.message));
    }
  }

  res.status(200).send('OK');
});

// ─── GET /api/payments/debug-sign — diagnóstico de firma (solo sandbox) ───────
router.get('/debug-sign', (req, res) => {
  const { publicKey, integritySecret, isTest } = wompiEnv();
  if (!isTest) return res.status(403).json({ error: 'Solo disponible en sandbox (pub_test_)' });

  const { amount = '100000', ref = 'TEST-REF' } = req.query;
  const amountInCents = Math.round(parseFloat(amount)) * 100;
  const input = `${ref}${amountInCents}COP${integritySecret}`;

  res.json({
    vars: {
      WOMPI_PUBLIC_KEY:       publicKey ? `${publicKey.slice(0, 12)}...` : '❌ NO CONFIGURADO',
      WOMPI_INTEGRITY_SECRET: integritySecret ? `${integritySecret.slice(0, 10)}...` : '❌ NO CONFIGURADO',
      WOMPI_EVENTS_SECRET:    wompiEnv().eventsSecret ? 'configurado' : '❌ NO CONFIGURADO',
      modo:                   isTest ? 'test' : 'producción',
    },
    formula: `SHA256("${ref}" + "${amountInCents}" + "COP" + INTEGRITY_SECRET)`,
    signature: sha256(input),
  });
});

// ─── GET /pago-resultado — página de resultado post-pago ──────────────────────
// Wompi redirige aquí con ?id=<transaction_id>&env=test|prod
export async function resultadoPago(req, res) {
  const txId = req.query.id;
  const { isTest } = wompiEnv();
  const apiBase = (req.query.env === 'test' || isTest) ? WOMPI_API.test : WOMPI_API.prod;

  let tx = null;
  if (txId) {
    try {
      const r = await fetch(`${apiBase}/transactions/${txId}`);
      if (r.ok) tx = (await r.json())?.data || null;
    } catch (err) {
      console.error('⚠️ /pago-resultado consulta Wompi error:', err.message);
    }
  }

  const STATE_MAP = {
    APPROVED: { emoji: '✅', titulo: '¡Pago aprobado!',  color: '#16a34a', bg: '#dcfce7', msg: 'Tu pago fue procesado exitosamente. Recibirás la confirmación de tu reserva.' },
    DECLINED: { emoji: '❌', titulo: 'Pago rechazado',   color: '#dc2626', bg: '#fee2e2', msg: 'El pago no pudo procesarse. Intenta con otro método de pago.' },
    PENDING:  { emoji: '⏳', titulo: 'Pago pendiente',   color: '#d97706', bg: '#fef3c7', msg: 'Tu pago está siendo validado. Te notificaremos pronto.' },
    VOIDED:   { emoji: '↩️', titulo: 'Pago anulado',     color: '#64748b', bg: '#f1f5f9', msg: 'La transacción fue anulada.' },
    ERROR:    { emoji: '⚠️', titulo: 'Error en el pago', color: '#7c3aed', bg: '#ede9fe', msg: 'Ocurrió un error. Contacta a tu asesor.' },
  };

  const estado   = STATE_MAP[tx?.status] || STATE_MAP['ERROR'];
  const monto    = tx?.amount_in_cents ? (tx.amount_in_cents / 100).toLocaleString('es-CO', { minimumFractionDigits: 0 }) : '—';
  const aprobado = tx?.status === 'APPROVED';
  const nombre   = tx?.customer_data?.full_name || '';
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
    <div class="sub">RNT 48674 · San Andrés Islas · Turismo Raizal</div>
    <div class="badge">${estado.emoji} ${estado.titulo}</div>
    <h2>${nombre ? `Hola, ${String(nombre).split(' ')[0]}` : 'Resultado de tu pago'}</h2>
    <p class="msg">${estado.msg}</p>
    <dl class="details">
      ${tx?.amount_in_cents ? `<dt>Monto</dt><dd>$${monto} ${tx?.currency || 'COP'}</dd>` : ''}
      ${tx?.payment_method_type ? `<dt>Método</dt><dd>${tx.payment_method_type}</dd>` : ''}
      ${tx?.reference ? `<dt>Referencia</dt><dd>${tx.reference}</dd>` : ''}
    </dl>
    ${aprobado
      ? `<a class="btn btn-primary" href="${homeUrl}">🌴 Volver a GuíaSAI</a>`
      : `<a class="btn btn-wa" href="${whatsapp}" target="_blank">💬 Hablar con un asesor</a>
         <a class="btn btn-primary" href="${homeUrl}">← Volver al inicio</a>`
    }
    <p class="ref">${txId ? `TX: ${txId}` : ''}</p>
  </div>
</body>
</html>`);
}

export default router;
