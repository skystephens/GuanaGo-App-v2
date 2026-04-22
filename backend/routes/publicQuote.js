/**
 * Public Quotation Route — GuanaGO
 * GET /cotizacion/:id → HTML page (no auth required, shareable with clients)
 */

import express from 'express';
import { config } from '../config.js';

const router = express.Router();

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_URL  = 'https://api.airtable.com/v0';

const headers = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

function safeDate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const p = new Date(d + 'T12:00:00');
  return isNaN(p.getTime()) ? null : p;
}

function fmtDate(d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const dt = safeDate(d);
  return dt ? dt.toLocaleDateString('es-CO', opts) : 'Por confirmar';
}

function fmtCOP(n) {
  return Number(n || 0).toLocaleString('es-CO');
}

const FALLBACK_IMGS = {
  hotel:      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  alojamiento:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  tour:       'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  taxi:       'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
  transfer:   'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
  tiquete:    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
  seguro:     'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
  otro:       'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
};

async function fetchCotizacion(id) {
  const res = await fetch(`${AT_URL}/${BASE_ID}/CotizacionesGG/${id}`, { headers: headers() });
  if (!res.ok) return null;
  const r = await res.json();
  const f = r.fields || {};
  return {
    id: r.id,
    nombre:       f.Nombre || '',
    email:        f.Email || '',
    telefono:     f.Telefono || '',
    fechaInicio:  f['Fecha Inicio'] || '',
    fechaFin:     f['Fecha Fin'] || '',
    adultos:      parseInt(f['Adultos 18 - 99 años'] || '0') || 0,
    ninos:        parseInt(f['Niños 4 - 17 años']    || '0') || 0,
    bebes:        parseInt(f['Bebes 0 - 3 años']     || '0') || 0,
    precioTotal:  parseFloat(f['Precio total'] || '0') || 0,
    notasInternas:f['Notas internas'] || '',
    createdTime:  r.createdTime || '',
  };
}

async function fetchItems(cotizacionId) {
  const url = `${AT_URL}/${BASE_ID}/${encodeURIComponent('cotizaciones_Items')}`;
  const params = new URLSearchParams({ maxRecords: '100' });
  const res = await fetch(`${url}?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();
  const items = [];
  for (const record of (data.records || [])) {
    const linked = record.fields['ID CotizacionGG'] || [];
    if (!linked.includes(cotizacionId)) continue;
    const f = record.fields;
    const valorUnitario = parseFloat(f['Valor Unitario'] || '0') || 0;
    const personas      = parseInt(f['Personas'] || '0') || 0;
    const cantidad      = parseInt(f['Cantidad'] || '1') || 1;
    const subtotal      = parseFloat(f['Precio Subtotal'] || '0') || (valorUnitario * personas * cantidad);
    items.push({
      id:             record.id,
      servicioId:     (f.Servicio || [])[0] || null,
      servicioNombre: f.Nombre || '',
      servicioTipo:   (f['Tipo Item'] || 'otro').toLowerCase(),
      valorUnitario,
      personas,
      cantidad,
      subtotal,
    });
  }
  return items;
}

function extractImageUrls(f) {
  const candidates = [
    f['ImagenWP'], f['imagenwp'], f['imagenWP'], f['Imagen_WP'],
    f['Imagenurl'], f['ImagenUrl'], f['imagenurl'], f['imagenUrl'],
    f['Imagen'], f['Imagen Principal'], f['Image'], f['Images'],
    f['Foto'], f['Fotos'], f['Galeria'], f['Gallery'],
    f['Attachments'], f['Attachment'], f['Media'],
    f['Pictures'], f['Photo'], f['Photos'],
  ];
  const urls = [];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      for (const item of c) {
        const u = item?.url || item?.thumbnails?.large?.url || (typeof item === 'string' ? item : null);
        if (u && !urls.includes(u)) urls.push(u);
      }
    } else if (typeof c === 'string') {
      for (const part of c.split(',').map(s => s.trim())) {
        if (part.startsWith('http') && !urls.includes(part)) urls.push(part);
      }
    }
  }
  // Fallback: any array field with .url
  if (urls.length === 0) {
    for (const value of Object.values(f)) {
      if (Array.isArray(value) && value.length > 0 && value[0]?.url) {
        for (const item of value) {
          if (item?.url && !urls.includes(item.url)) urls.push(item.url);
        }
      }
    }
  }
  return urls.slice(0, 4);
}

/** Fetch images + description from ServiciosTuristicos_SAI by record ID */
async function fetchServiceMeta(servicioId) {
  if (!servicioId) return { images: [], description: '' };
  try {
    const res = await fetch(
      `${AT_URL}/${BASE_ID}/${encodeURIComponent('ServiciosTuristicos_SAI')}/${servicioId}`,
      { headers: headers() }
    );
    if (!res.ok) return { images: [], description: '' };
    const r = await res.json();
    const f = r.fields || {};
    return {
      images: extractImageUrls(f),
      description: f['Descripcion'] || f['Itinerario'] || f['descripcion'] || '',
    };
  } catch (_) {}
  return { images: [], description: '' };
}

/** Fetch images + description from AlojamientosTuristicos_SAI by name (field: Servicio) */
async function fetchAlojamientoMeta(nombre) {
  if (!nombre) return { images: [], description: '' };
  try {
    // Field name for the service name is "Servicio" in AlojamientosTuristicos_SAI
    const safe = nombre.replace(/"/g, '\\"');
    const formula = `FIND(LOWER("${safe}"), LOWER({Servicio}))`;
    const params = new URLSearchParams({ filterByFormula: formula, maxRecords: '1' });
    const res = await fetch(
      `${AT_URL}/${BASE_ID}/${encodeURIComponent('AlojamientosTuristicos_SAI')}?${params}`,
      { headers: headers() }
    );
    if (!res.ok) return { images: [], description: '' };
    const data = await res.json();
    const record = (data.records || [])[0];
    if (!record) return { images: [], description: '' };
    const f = record.fields || {};
    return {
      images: extractImageUrls(f),
      description: f['Descripcion'] || f['Itinerario'] || '',
    };
  } catch (_) {}
  return { images: [], description: '' };
}

function renderServiceCard(item, index) {
  const tipo = item.servicioTipo || 'otro';
  const fallback = FALLBACK_IMGS[tipo] || FALLBACK_IMGS['tour'];
  const images = item.images?.length > 0 ? item.images : [fallback];
  const mid = `modal-${index}`;

  const photoGrid = images.map((url, i) => `
    <div style="width:calc(25% - 3px);aspect-ratio:1/1;overflow:hidden;border-radius:6px;cursor:pointer;flex-shrink:0;"
         onclick="openModal('${mid}',${i})">
      <img src="${url}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;display:block;"
           onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'"
           onerror="this.parentElement.style.display='none'">
    </div>`).join('');

  const thumbs = images.map((url, i) => `
    <img src="${url}" id="${mid}-thumb-${i}"
         style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer;opacity:.6;border:2px solid transparent;"
         onclick="setModalImg('${mid}',${i})"
         onerror="this.style.display='none'">`).join('');

  return `
  <div style="background:white;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;">
    <div style="display:flex;gap:4px;padding:10px 10px 0;">${photoGrid}</div>
    <div style="padding:14px 16px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#0ea5e9;color:white;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${index + 1}</span>
            <h4 style="margin:0;color:#1e293b;font-size:15px;font-weight:700;">${item.servicioNombre}</h4>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:#64748b;">
            <span style="text-transform:uppercase;background:#f1f5f9;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;">${tipo}</span>
            <span>👥 ${item.personas} persona${item.personas !== 1 ? 's' : ''}</span>
            ${item.cantidad > 1 ? `<span>× ${item.cantidad} unidades</span>` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:16px;">
          <div style="color:#10b981;font-size:17px;font-weight:700;">$${fmtCOP(item.subtotal)}</div>
          <div style="color:#94a3b8;font-size:11px;">$${fmtCOP(item.valorUnitario)} × ${item.personas}${item.cantidad > 1 ? ` × ${item.cantidad}u` : ''}</div>
        </div>
      </div>
      ${item.description ? `
      <div id="${mid}-short" style="font-size:13px;color:#64748b;line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">
        ${item.description}
      </div>
      <button onclick="openModal('${mid}',0)"
        style="margin-top:6px;background:none;border:none;color:#0ea5e9;font-size:12px;font-weight:600;cursor:pointer;padding:0;">
        Ver más info e imágenes ▼
      </button>` : ''}
    </div>
  </div>

  <div id="${mid}" onclick="if(event.target===this)closeModal('${mid}')"
       style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;padding:20px;">
    <div style="background:white;border-radius:14px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">
      <button onclick="closeModal('${mid}')"
        style="position:sticky;top:10px;float:right;margin:10px 12px 0 0;background:#1e293b;color:white;border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;z-index:10;">✕</button>
      <div style="padding:16px 16px 0;">
        <img id="${mid}-main" src="${images[0]}" alt="${item.servicioNombre}"
          style="width:100%;height:280px;object-fit:cover;border-radius:10px;display:block;"
          onerror="this.style.display='none'">
      </div>
      ${images.length > 1 ? `<div style="display:flex;gap:8px;padding:10px 16px 0;flex-wrap:wrap;">${thumbs}</div>` : ''}
      <div style="padding:14px 16px;">
        <h3 style="margin:0 0 8px;color:#1e293b;font-size:17px;">${item.servicioNombre}</h3>
        ${item.description ? `<p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.65;">${item.description}</p>` : ''}
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#64748b;">Subtotal</span>
          <span style="color:#10b981;font-size:20px;font-weight:700;">$${fmtCOP(item.subtotal)} COP</span>
        </div>
      </div>
    </div>
  </div>`;
}

function buildPage(cotizacion, items, now) {
  const totalPax = cotizacion.adultos + cotizacion.ninos + cotizacion.bebes;
  const cards = items.map((item, i) => renderServiceCard(item, i)).join('');
  const emitida = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Cotización ${cotizacion.nombre} — GuíaSAI</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f1f5f9;font-family:Arial,sans-serif;color:#1a1a1a;padding:20px}
    .wrap{max-width:800px;margin:0 auto;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    @media(max-width:600px){body{padding:8px}.wrap{padding:20px}}
    @media print{body{background:white;padding:0}.wrap{box-shadow:none;border-radius:0}.no-print{display:none!important}}
  </style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:40px;border-bottom:3px solid #FF6600;padding-bottom:20px;">
    <h1 style="color:#FF6600;font-size:36px;margin:0 0 4px;font-weight:800;">GuíaSAI</h1>
    <p style="color:#64748b;font-size:14px;margin:0;">San Andrés Isla · Especialistas en Turismo</p>
  </div>

  <!-- Banner cotización -->
  <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:20px;border-radius:12px;margin-bottom:30px;">
    <h2 style="color:white;margin:0 0 5px;font-size:24px;">Cotización de Viaje</h2>
    <p style="color:rgba(255,255,255,.9);margin:0;font-size:14px;">Emitida el ${emitida}</p>
  </div>

  <!-- Info cliente -->
  <div style="background:#f8fafc;padding:20px;border-radius:8px;margin-bottom:25px;">
    <h3 style="color:#334155;margin:0 0 15px;font-size:16px;font-weight:600;">Información del Cliente</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Nombre:</td>
        <td style="padding:8px 0;color:#1e293b;font-weight:500;font-size:14px;">${cotizacion.nombre}</td>
      </tr>
      ${cotizacion.email ? `<tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Email:</td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${cotizacion.email}</td>
      </tr>` : ''}
      ${cotizacion.telefono ? `<tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Teléfono:</td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${cotizacion.telefono}</td>
      </tr>` : ''}
      ${(cotizacion.fechaInicio || cotizacion.fechaFin) ? `<tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Fechas:</td>
        <td style="padding:8px 0;color:#1e293b;font-weight:500;font-size:14px;">
          ${fmtDate(cotizacion.fechaInicio)} → ${fmtDate(cotizacion.fechaFin)}
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Pasajeros:</td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">
          ${totalPax} personas
          (${cotizacion.adultos} adultos 18+, ${cotizacion.ninos} niños 4-17, ${cotizacion.bebes} bebés 0-3)
        </td>
      </tr>
    </table>
  </div>

  <!-- Servicios -->
  <div style="margin-bottom:30px;">
    <h3 style="color:#334155;margin:0 0 15px;font-size:18px;font-weight:600;">Servicios Incluidos</h3>
    ${cards}
  </div>

  <!-- Total -->
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;border-radius:12px;margin-bottom:30px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="color:rgba(255,255,255,.9);font-size:14px;margin-bottom:5px;">PRECIO TOTAL</div>
        <div style="color:white;font-size:36px;font-weight:700;line-height:1;">$${fmtCOP(cotizacion.precioTotal)}</div>
        <div style="color:rgba(255,255,255,.8);font-size:12px;margin-top:5px;">COP – Pesos Colombianos</div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,.9);font-size:13px;">
        <div>${items.length} servicio${items.length !== 1 ? 's' : ''}</div>
        <div>${totalPax} pasajero${totalPax !== 1 ? 's' : ''}</div>
      </div>
    </div>
  </div>

  <!-- Notas importantes -->
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin-bottom:30px;">
    <h4 style="color:#92400e;margin:0 0 8px;font-size:14px;font-weight:600;">ℹ️ Información Importante</h4>
    <ul style="margin:0;padding-left:20px;color:#78350f;font-size:13px;line-height:1.6;">
      <li>Esta cotización es válida por 7 días desde su emisión</li>
      <li>Los precios están sujetos a disponibilidad al momento de la reserva</li>
      <li>Se requiere confirmación previa para todos los servicios</li>
      <li>Tarifas: Adultos (18+) y Niños (4-17) pagan tarifa completa. Bebés (0-3) gratis.</li>
      <li>Los bebés no cuentan como huésped en alojamientos</li>
    </ul>
  </div>

  ${cotizacion.notasInternas ? `
  <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin-bottom:30px;">
    <h4 style="color:#475569;margin:0 0 8px;font-size:14px;font-weight:600;">📝 Notas Adicionales</h4>
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">${cotizacion.notasInternas}</p>
  </div>` : ''}

  <!-- Footer -->
  <div style="text-align:center;padding-top:30px;border-top:2px solid #e2e8f0;">
    <p style="color:#64748b;font-size:14px;margin:0 0 8px;font-weight:500;">¿Listo para tu aventura en San Andrés? 🌴</p>
    <p style="color:#94a3b8;font-size:12px;margin:0 0 15px;">Contáctanos para confirmar tu reserva o hacer ajustes</p>
    <div style="color:#0ea5e9;font-size:13px;font-weight:600;">
      📱 WhatsApp: <a href="https://wa.me/573153836043" style="color:#0ea5e9;">+57 315 383 6043</a><br>
      📧 Email: <a href="mailto:comercial@guiasai.com" style="color:#0ea5e9;">comercial@guiasai.com</a><br>
      🌐 Web: <a href="https://guiasanandresislas.com" style="color:#0ea5e9;">guiasanandresislas.com</a>
    </div>
    <p style="color:#cbd5e1;font-size:11px;margin:20px 0 0;">GuíaSAI © ${now.getFullYear()} · San Andrés Isla, Colombia</p>
  </div>

  <!-- Botones imprimir (no se imprimen) -->
  <div class="no-print" style="text-align:center;margin-top:30px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
    <button onclick="window.print()"
      style="background:#0ea5e9;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      🖨️ Imprimir / Guardar PDF
    </button>
    <a href="https://wa.me/573153836043?text=Hola%2C+tengo+preguntas+sobre+mi+cotización"
      style="background:#25d366;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      💬 WhatsApp
    </a>
  </div>

</div>

<script>
  function openModal(id, imgIndex) {
    var m = document.getElementById(id);
    if (!m) return;
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setModalImg(id, imgIndex);
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
  }
  function setModalImg(modalId, idx) {
    var main = document.getElementById(modalId + '-main');
    var thumbs = document.querySelectorAll('[id^="' + modalId + '-thumb-"]');
    thumbs.forEach(function(t, i) {
      if (main && i === idx) main.src = t.src;
      t.style.opacity = i === idx ? '1' : '0.5';
      t.style.borderColor = i === idx ? '#0ea5e9' : 'transparent';
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('[id^="modal-"]').forEach(function(m) {
        m.style.display = 'none';
      });
      document.body.style.overflow = '';
    }
  });
</script>
</body>
</html>`;
}

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const cotizacion = await fetchCotizacion(id);
    if (!cotizacion) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
          <h2 style="color:#ef4444;">Cotización no encontrada</h2>
          <p style="color:#64748b;">El enlace puede ser incorrecto o la cotización fue eliminada.</p>
        </body></html>
      `);
    }

    const items = await fetchItems(id);

    // Enrich items with images + description (parallel)
    await Promise.all(items.map(async (item) => {
      if (item.servicioId) {
        // Tours, transfers, etc. linked to ServiciosTuristicos_SAI
        const meta = await fetchServiceMeta(item.servicioId);
        item.images = meta.images;
        item.description = meta.description;
      } else {
        // Alojamientos: servicioId not stored → search AlojamientosTuristicos_SAI by name
        const meta = await fetchAlojamientoMeta(item.servicioNombre);
        item.images = meta.images;
        item.description = meta.description;
      }
    }));

    const html = buildPage(cotizacion, items, new Date());
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('❌ publicQuote error:', err.message);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#ef4444;">Error al cargar la cotización</h2>
        <p style="color:#64748b;">Por favor intenta de nuevo o contacta a soporte.</p>
      </body></html>
    `);
  }
});

export default router;
