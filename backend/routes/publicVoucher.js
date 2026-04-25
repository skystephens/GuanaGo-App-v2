/**
 * Public Voucher Route — GuanaGO
 * GET /voucher/:id → HTML page (shareable with clients, no auth required)
 * Shows tour details + meeting point with Google Maps link
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
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function sel(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v?.name) return v.name;
  return String(v);
}

// Coordenadas conocidas de los puntos de encuentro en San Andrés
const PUNTO_COORDS = {
  'MUELLE CASA DE LA CULTURA': '12.5547,-81.7185',
  'MUELLE PORTOFINO':          '12.5410,-81.7238',
  'MUELLE TONY':               '12.5360,-81.7270',
  'AEROPUERTO GUSTAVO ROJAS PINILLA': '12.5836,-81.7112',
};

function mapsUrl(punto) {
  if (!punto) return null;
  const coords = PUNTO_COORDS[punto.toUpperCase()];
  if (coords) return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto + ', San Andrés, Colombia')}`;
}

async function fetchVoucher(id) {
  const res = await fetch(`${AT_URL}/${VOUCHER_BASE}/Generador_vouchers/${id}`, { headers: headers() });
  if (!res.ok) return null;
  const r = await res.json();
  const f = r.fields || {};
  return {
    id:             r.id,
    titular:        f['Nombre del Cliente'] || '',
    reservaNum:     f['Numero de Reserva'] || r.id.slice(-6).toUpperCase(),
    pax:            f['Numero de Personas '] || f['Numero de Personas'] || '',
    fecha:          f['Fecha de Inicio'] || '',
    hora:           f['Hora de Cita'] || '',
    puntoEncuentro: sel(f['Punto de Encuentro']),
    observaciones:  f['Observaciones Especiales'] || '',
    notasAdicionales: f['Notas adicionales'] || '',
    tourName:       f['Nombre del tour texto'] ||
                    (Array.isArray(f['Nombre del Servicio (from Tipo de Tour)'])
                      ? f['Nombre del Servicio (from Tipo de Tour)'][0] : '') || '',
    estado:         sel(f['Estado de la Reserva']) || sel(f['Estado']) || 'Pendiente',
    telefono:       f['Telefono'] || '',
    email:          f['Email'] || '',
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

    const map = mapsUrl(voucher.puntoEncuentro);
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
    body{background:#f1f5f9;font-family:Arial,sans-serif;color:#1a1a1a;padding:20px;min-height:100vh}
    .wrap{max-width:480px;margin:0 auto}
    @media(max-width:520px){body{padding:10px}}
    @media print{body{background:white;padding:0}.no-print{display:none!important}}
  </style>
</head>
<body>
<div class="wrap">

  <!-- Header GuíaSAI -->
  <div style="text-align:center;background:white;border-radius:16px;padding:24px 20px 18px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.07);">
    <div style="font-size:28px;font-weight:900;color:#F5831F;letter-spacing:-1px;">GuíaSAI</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">San Andrés Isla · Especialistas en Turismo</div>
    <div style="margin-top:10px;display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 12px;font-size:11px;color:#64748b;font-weight:600;">
      Reserva #${esc(voucher.reservaNum)}
    </div>
  </div>

  <!-- Tour + estado -->
  <div style="background:linear-gradient(135deg,#F5831F,#e8720f);border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 4px 16px rgba(245,131,31,.3);">
    <div style="font-size:11px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Servicio Reservado</div>
    <div style="font-size:20px;font-weight:800;color:white;line-height:1.2;">${esc(voucher.tourName || 'Servicio turístico')}</div>
    <div style="margin-top:10px;display:inline-block;background:rgba(255,255,255,.25);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:white;">
      ${esc(voucher.estado)}
    </div>
  </div>

  <!-- Datos del servicio -->
  <div style="background:white;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;">Detalles de la Reserva</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">📅 Fecha</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;line-height:1.3;">${esc(fechaFmt || voucher.fecha || 'Por confirmar')}</div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">🕐 Hora</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;">${esc(voucher.hora || 'Por confirmar')}</div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">👤 Titular</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;">${esc(voucher.titular)}</div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">👥 Pasajeros</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;">${esc(voucher.pax)} persona${voucher.pax == '1' ? '' : 's'}</div>
      </div>
    </div>
  </div>

  <!-- Punto de encuentro (bloque principal) -->
  ${voucher.puntoEncuentro ? `
  <div style="background:white;border-radius:16px;padding:20px;margin-bottom:14px;border:2px solid #FED7AA;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-size:20px;">📍</span>
      <div>
        <div style="font-size:10px;color:#F5831F;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">Punto de Encuentro</div>
        <div style="font-size:17px;font-weight:900;color:#92400e;text-transform:uppercase;line-height:1.2;">${esc(voucher.puntoEncuentro)}</div>
      </div>
    </div>
    ${map ? `
    <a href="${map}" target="_blank" rel="noopener noreferrer"
       style="display:block;background:#F5831F;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:.3px;">
      🗺️ Cómo llegar — Abrir en Google Maps
    </a>` : ''}
  </div>` : ''}

  <!-- Observaciones -->
  ${voucher.observaciones ? `
  <div style="background:white;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">📝 Observaciones</div>
    <div style="font-size:13px;color:#475569;line-height:1.6;">${esc(voucher.observaciones)}</div>
  </div>` : ''}

  ${voucher.notasAdicionales ? `
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:14px 16px;margin-bottom:14px;">
    <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">ℹ️ Información importante</div>
    <div style="font-size:13px;color:#78350f;line-height:1.6;">${esc(voucher.notasAdicionales)}</div>
  </div>` : ''}

  <!-- Contacto -->
  <div style="background:white;border-radius:16px;padding:18px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;">¿Necesitas ayuda?</div>
    <a href="https://wa.me/573153836043" target="_blank"
       style="display:flex;align-items:center;gap:10px;background:#25d366;color:white;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:8px;">
      <span style="font-size:18px;">💬</span> WhatsApp: +57 315 383 6043
    </a>
    <a href="mailto:comercial@guiasai.com"
       style="display:flex;align-items:center;gap:10px;background:#f8fafc;color:#0ea5e9;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600;font-size:13px;border:1px solid #e2e8f0;">
      <span>📧</span> comercial@guiasai.com
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px 0 8px;border-top:1px solid #e2e8f0;" class="no-print">
    <button onclick="window.print()"
      style="background:#64748b;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:12px;">
      🖨️ Imprimir / Guardar PDF
    </button>
  </div>
  <p style="text-align:center;color:#cbd5e1;font-size:11px;padding-bottom:20px;">
    GuíaSAI © ${new Date().getFullYear()} · San Andrés Isla, Colombia · RNT 48674
  </p>

</div>
</body>
</html>`);
  } catch (err) {
    console.error('❌ publicVoucher error:', err.message);
    res.status(500).send('<html><body>Error interno</body></html>');
  }
});

export default router;
