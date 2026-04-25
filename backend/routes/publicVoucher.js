/**
 * Public Voucher Route — GuanaGO
 * GET /voucher/:id → HTML page (shareable with clients, no auth required)
 * Design matches the admin VoucherCard/VoucherModal style.
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
    telefono:         f['Telefono'] || '',
    email:            f['Email'] || '',
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
    body{background:#111827;font-family:Arial,sans-serif;color:#f1f5f9;padding:20px;min-height:100vh;display:flex;align-items:flex-start;justify-content:center}
    .card{background:#1f2937;border-radius:24px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .cell{border:1px solid #374151;border-radius:14px;padding:10px 12px}
    .cell-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
    .cell-val{font-size:12px;font-weight:700;color:#f9fafb}
    .cell-val.teal{color:#2dd4bf}
    @media(max-width:480px){body{padding:10px;align-items:flex-start}}
    @media print{body{background:white;padding:0}.no-print{display:none!important}.card{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
<div class="card">

  <!-- Header naranja -->
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:22px 18px 18px;position:relative;">
    <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.75);margin-bottom:6px;">Experiencia Reservada</p>
    <h2 style="font-size:22px;font-weight:900;color:white;text-transform:uppercase;line-height:1.15;padding-right:90px;">${esc(voucher.tourName || 'Servicio turístico')}</h2>
    ${voucher.reservaNum ? `<p style="font-size:10px;color:rgba(255,255,255,.65);margin-top:5px;font-family:monospace;"># ${esc(voucher.reservaNum)}</p>` : ''}
    <span style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:4px 10px;font-size:9px;font-weight:700;color:rgba(255,255,255,.9);">
      ${esc(voucher.estado)}
    </span>
  </div>

  <!-- Titular -->
  <div style="padding:14px 18px 8px;">
    <p style="font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">Titular de Reserva</p>
    <p style="font-size:15px;font-weight:800;color:#f9fafb;text-transform:uppercase;">${esc(voucher.titular || '—')}</p>
  </div>

  <!-- Grid datos -->
  <div class="grid2" style="padding:4px 18px 14px;">
    <div class="cell">
      <div class="cell-label">ID Reserva</div>
      <div class="cell-val" style="color:#fb923c;">${esc(voucher.reservaNum || '—')}</div>
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
  <div style="margin:0 18px 14px;border-left:4px solid #f97316;padding:10px 14px;background:rgba(249,115,22,.1);border-radius:0 12px 12px 0;">
    <p style="font-size:8px;color:#fb923c;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">◆ Punto de Encuentro</p>
    <p style="font-size:13px;font-weight:800;color:#fed7aa;text-transform:uppercase;line-height:1.3;">${esc(voucher.puntoEncuentro)}</p>
  </div>
  ${map ? `
  <div style="padding:0 18px 16px;">
    <a href="${map}" target="_blank" rel="noopener noreferrer"
       style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;text-decoration:none;padding:14px;border-radius:14px;font-weight:700;font-size:14px;letter-spacing:.3px;">
      📍 CÓMO LLEGAR AL PUNTO
    </a>
  </div>` : ''}` : ''}

  <!-- Observaciones -->
  ${voucher.observaciones ? `
  <div style="margin:0 18px 14px;border-left:4px solid #f59e0b;padding:10px 14px;background:rgba(245,158,11,.08);border-radius:0 12px 12px 0;">
    <p style="font-size:8px;color:#fbbf24;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">⚠ Nota</p>
    <p style="font-size:12px;color:#fde68a;line-height:1.5;">${esc(voucher.observaciones)}</p>
  </div>` : ''}

  ${voucher.notasAdicionales ? `
  <div style="margin:0 18px 14px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:12px;padding:12px 14px;">
    <p style="font-size:8px;color:#a5b4fc;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">ℹ Información importante</p>
    <p style="font-size:12px;color:#c7d2fe;line-height:1.5;">${esc(voucher.notasAdicionales)}</p>
  </div>` : ''}

  <!-- Footer GuíaSAI -->
  <div style="border-top:1px solid #374151;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-size:10px;color:#6b7280;">
      <span>📞 +57 315 383 6043</span>
    </div>
    <div style="font-size:10px;color:#6b7280;">guiasanandresislas.com</div>
    <div style="font-size:9px;font-weight:700;color:#6b7280;">RNT: 48674</div>
  </div>

  <!-- Imprimir (no se imprime) -->
  <div class="no-print" style="padding:0 18px 18px;">
    <button onclick="window.print()"
      style="width:100%;background:#374151;color:#9ca3af;border:none;padding:10px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;">
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
