/**
 * Public Voucher Route — GuanaGO
 * GET /voucher/:id → HTML page (shareable with clients, no auth required)
 * Design matches the admin VoucherCard/VoucherModal exactly (white bg).
 */

import express from 'express';

const router = express.Router();

const VOUCHER_BASE = 'appij4vUx7GZEwf5x';
const AT_URL       = 'https://api.airtable.com/v0';

const headers = () => ({
  Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function sel(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v?.name) return v.name;
  return String(v);
}

const PUNTO_COORDS = {
  'MUELLE CASA DE LA CULTURA':        '12.5547,-81.7185',
  'MUELLE PORTOFINO':                  '12.5410,-81.7238',
  'MUELLE TONY':                       '12.5360,-81.7270',
  'AEROPUERTO GUSTAVO ROJAS PINILLA':  '12.5836,-81.7112',
};

function mapsUrl(punto) {
  if (!punto) return null;
  const key = Object.keys(PUNTO_COORDS).find(k => punto.toUpperCase().startsWith(k));
  if (key) return `https://www.google.com/maps/dir/?api=1&destination=${PUNTO_COORDS[key]}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto + ', San Andrés, Colombia')}`;
}

async function fetchVoucher(id) {
  const res = await fetch(`${AT_URL}/${VOUCHER_BASE}/Generador_vouchers/${id}`, { headers: headers() });
  if (!res.ok) return null;
  const r = await res.json();
  const f = r.fields || {};
  return {
    id:               r.id,
    titular:          f['Nombre del Cliente'] || '',
    reservaNum:       f['Numero de Reserva'] || r.id.slice(-6).toUpperCase(),
    pax:              f['Numero de Personas '] || f['Numero de Personas'] || '',
    fecha:            f['Fecha de Inicio'] || '',
    hora:             f['Hora de Cita'] || '',
    puntoEncuentro:   sel(f['Punto de Encuentro']),
    observaciones:    f['Observaciones Especiales'] || '',
    notasAdicionales: f['Notas adicionales'] || '',
    tourName:         f['Nombre del tour texto'] ||
                      (Array.isArray(f['Nombre del Servicio (from Tipo de Tour)'])
                        ? f['Nombre del Servicio (from Tipo de Tour)'][0] : '') || '',
    estado:           sel(f['Estado de la Reserva']) || sel(f['Estado']) || 'Pendiente',
  };
}

router.get('/:id', async (req, res) => {
  try {
    const voucher = await fetchVoucher(req.params.id);

    if (!voucher) {
      return res.status(404).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#ef4444;">Voucher no encontrado</h2>
        <p style="color:#64748b;">El enlace puede ser incorrecto o el voucher fue eliminado.</p>
      </body></html>`);
    }

    const map      = mapsUrl(voucher.puntoEncuentro);
    const fechaFmt = fmtDate(voucher.fecha);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Voucher ${esc(voucher.tourName)} — GuíaSAI</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f1f5f9;font-family:Arial,sans-serif;padding:20px;min-height:100vh;display:flex;align-items:flex-start;justify-content:center}
    .card{background:white;border-radius:24px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.12)}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:6px 18px 16px}
    .cell{border:1px solid #e5e7eb;border-radius:14px;padding:10px 12px}
    .cell-label{font-size:8px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
    .cell-val{font-size:12px;font-weight:700;color:#111827}
    .cell-val.orange{color:#f97316}
    .cell-val.teal{color:#0d9488}
    @media(max-width:480px){body{padding:10px}}
    @media print{body{background:white;padding:0}.no-print{display:none!important}.card{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
<div class="card">

  <!-- Header naranja -->
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:22px 18px 18px;position:relative;">
    <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.8);margin-bottom:6px;">Experiencia Reservada</p>
    <h2 style="font-size:22px;font-weight:900;color:white;text-transform:uppercase;line-height:1.2;padding-right:90px;">${esc(voucher.tourName || 'Servicio turístico')}</h2>
    ${voucher.reservaNum ? `<p style="font-size:10px;color:rgba(255,255,255,.65);margin-top:5px;font-family:monospace;"># ${esc(voucher.reservaNum)}</p>` : ''}
    <span style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 10px;font-size:9px;font-weight:700;color:white;">
      ${esc(voucher.estado)}
    </span>
  </div>

  <!-- Titular -->
  <div style="padding:14px 18px 6px;">
    <p style="font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">Titular de Reserva</p>
    <p style="font-size:16px;font-weight:800;color:#111827;text-transform:uppercase;">${esc(voucher.titular || '—')}</p>
  </div>

  <!-- Grid datos -->
  <div class="grid2">
    <div class="cell">
      <div class="cell-label">ID Reserva</div>
      <div class="cell-val orange">${esc(voucher.reservaNum || '—')}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Pax</div>
      <div class="cell-val">${esc(voucher.pax || '—')}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Fecha</div>
      <div class="cell-val">${esc(fechaFmt || voucher.fecha || '—')}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Hora de Encuentro</div>
      <div class="cell-val teal">${esc(voucher.hora || '—')}</div>
    </div>
  </div>

  <!-- Punto de encuentro -->
  ${voucher.puntoEncuentro ? `
  <div style="margin:0 18px 14px;border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:0 12px 12px 0;">
    <p style="font-size:8px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">◆ Punto de Encuentro</p>
    <p style="font-size:13px;font-weight:800;color:#9a3412;text-transform:uppercase;line-height:1.3;">${esc(voucher.puntoEncuentro)}</p>
  </div>` : ''}

  <!-- Botón Maps -->
  ${map ? `
  <div style="padding:0 18px 16px;">
    <a href="${map}" target="_blank" rel="noopener noreferrer"
       style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;text-decoration:none;padding:15px;border-radius:16px;font-weight:700;font-size:14px;letter-spacing:.3px;">
      📍 CÓMO LLEGAR AL PUNTO
    </a>
  </div>` : ''}

  <!-- Observaciones -->
  ${voucher.observaciones ? `
  <div style="margin:0 18px 14px;border-left:4px solid #f59e0b;padding:10px 14px;background:#fffbeb;border-radius:0 12px 12px 0;">
    <p style="font-size:8px;color:#d97706;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">⚠ Nota</p>
    <p style="font-size:12px;color:#78350f;line-height:1.5;">${esc(voucher.observaciones)}</p>
  </div>` : ''}

  ${voucher.notasAdicionales ? `
  <div style="margin:0 18px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:12px 14px;">
    <p style="font-size:8px;color:#0284c7;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">ℹ Información importante</p>
    <p style="font-size:12px;color:#0c4a6e;line-height:1.5;">${esc(voucher.notasAdicionales)}</p>
  </div>` : ''}

  <!-- Footer -->
  <div style="border-top:1px solid #f3f4f6;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:10px;color:#9ca3af;">📞 +57 315 383 6043</span>
    <span style="font-size:10px;color:#9ca3af;">guiasanandresislas.com</span>
    <span style="font-size:9px;font-weight:700;color:#9ca3af;">RNT: 48674</span>
  </div>

  <!-- Imprimir -->
  <div class="no-print" style="padding:0 18px 18px;">
    <button onclick="window.print()"
      style="width:100%;background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;padding:10px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;">
      🖨️ Imprimir / Guardar PDF
    </button>
  </div>

</div>
</body>
</html>`);
  } catch (err) {
    console.error('❌ publicVoucher error:', err.message);
    res.status(500).send('<html><body>Error interno</body></html>');
  }
});

export default router;
