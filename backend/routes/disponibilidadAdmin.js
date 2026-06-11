/**
 * Admin: Directorio de Alojamientos — Gestión de Disponibilidad
 * GET /disponibilidad-admin  → HTML con todos los alojamientos
 * Protegido por ?key= (ADMIN_PANEL_KEY o AIRTABLE_API_KEY como fallback)
 */

import express from 'express';
const router = express.Router();

const BASE_ID  = process.env.AIRTABLE_BASE_ID  || 'appiReH55Qhrbv4Lk';
const ALOJ_TBL = 'tblUNglGMsxDZYZPs';
const AT_URL   = 'https://api.airtable.com/v0';

const atHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function firstImage(f) {
  const candidates = [
    f.ImagenWP, f.imagenwp, f.Imagenurl, f.ImagenUrl, f.imagenUrl,
    f.Imagen, f['Imagen Principal'], f.Foto, f.Fotos,
    f.Attachments, f.Attachment, f.Media,
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c) && c[0]) {
      const u = c[0]?.url || c[0]?.thumbnails?.large?.url;
      if (u) return u;
    }
    if (typeof c === 'string' && c.startsWith('http')) return c.split(',')[0].trim();
  }
  return '';
}

async function fetchAllAlojamientos() {
  let all = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ maxRecords: '100' });
    if (offset) params.set('offset', offset);
    const res = await fetch(`${AT_URL}/${BASE_ID}/${ALOJ_TBL}?${params}`, { headers: atHeaders() });
    if (!res.ok) break;
    const data = await res.json();
    for (const r of (data.records || [])) {
      const f = r.fields || {};
      all.push({
        id: r.id,
        nombre:    f.Servicio || f.Nombre || f.Name || r.id,
        tipo:      f.Tipo || f.Categoria || f.Habitacion || '',
        capacidad: f.Capacidad || f.Personas || f['Personas max'] || '',
        zona:      f.Zona || f.Sector || f.Ubicacion || '',
        precio:    f.Precio || f.Precio_noche || f['Precio noche'] || '',
        imagen:    firstImage(f),
      });
    }
    offset = data.offset || null;
  } while (offset);
  return all;
}

router.get('/', async (req, res) => {
  const adminKey    = process.env.ADMIN_PANEL_KEY || '';
  const provided    = req.query.key || '';
  const airtableKey = process.env.AIRTABLE_API_KEY || '';

  // Autenticación simple: acepta ADMIN_PANEL_KEY o AIRTABLE_API_KEY
  const isAuth = !adminKey
    ? !!provided && provided === airtableKey   // sin ADMIN_PANEL_KEY: usar airtable key
    : provided === adminKey || provided === airtableKey;

  if (!isAuth) {
    return res.status(401).send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Acceso restringido</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f1f5f9;">
  <h2 style="color:#ef4444;">Acceso restringido</h2>
  <p style="color:#64748b;margin-top:8px;">Agrega <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">?key=TU_CLAVE</code> a la URL</p>
</body></html>`);
  }

  try {
    const alojamientos = await fetchAllAlojamientos();
    const html = buildPage(alojamientos, airtableKey, provided);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('❌ disponibilidadAdmin:', err.message);
    res.status(500).send(`<html><body style="font-family:Arial;text-align:center;padding:60px;">
      <h2 style="color:#ef4444;">Error al cargar alojamientos</h2>
      <p>${esc(err.message)}</p></body></html>`);
  }
});

function buildCard(a, adminKey) {
  const ownerUrl = `/disponibilidad-propietario?id=${a.id}`;
  const adminUrl = adminKey ? `/disponibilidad-propietario?id=${a.id}&k=${encodeURIComponent(adminKey)}` : ownerUrl;
  const search = [a.nombre, a.tipo, a.zona].filter(Boolean).join(' ').toLowerCase();

  return `
  <div class="card" data-search="${esc(search)}">
    <div class="card-img" ${a.imagen ? `style="background-image:url('${esc(a.imagen)}')"` : ''}>
      ${!a.imagen ? '<span class="img-ph">🏠</span>' : ''}
    </div>
    <div class="card-body">
      <div class="card-name">${esc(a.nombre)}</div>
      <div class="card-tags">
        ${a.tipo      ? `<span class="tag">${esc(a.tipo)}</span>` : ''}
        ${a.capacidad ? `<span class="tag">👥 ${esc(String(a.capacidad))}</span>` : ''}
        ${a.zona      ? `<span class="tag">📍 ${esc(a.zona)}</span>` : ''}
        ${a.precio    ? `<span class="tag green">$${esc(String(a.precio))}/noche</span>` : ''}
      </div>
      <div class="card-id">ID: <code>${esc(a.id)}</code></div>
      <div class="card-actions">
        <a href="${esc(adminUrl)}" target="_blank" class="btn btn-teal">
          📅 Gestionar disponibilidad
        </a>
        <button class="btn btn-outline" onclick="copyLink('${esc(ownerUrl)}')">
          🔗 Link para propietario
        </button>
      </div>
    </div>
  </div>`;
}

function buildPage(alojamientos, adminKey, reqKey) {
  const total = alojamientos.length;
  const cards = alojamientos.length > 0
    ? alojamientos.map(a => buildCard(a, adminKey)).join('')
    : '<div class="empty"><span style="font-size:48px;">🏠</span><p>No se encontraron alojamientos</p></div>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Disponibilidad Alojamientos — GuíaSAI Admin</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}

    .header{background:linear-gradient(135deg,#FF6600,#ff8c38);color:white;padding:20px 24px}
    .header h1{font-size:21px;font-weight:800;margin-bottom:3px}
    .header p{font-size:13px;opacity:.85}
    .header-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:14px}
    .brand{font-size:18px;font-weight:800;letter-spacing:-.5px}
    .brand span{opacity:.6}
    .badge{background:rgba(255,255,255,.22);border-radius:20px;padding:5px 14px;font-size:13px;font-weight:600}

    .toolbar{padding:14px 18px;background:white;border-bottom:1px solid #e2e8f0;display:flex;gap:10px;align-items:center;position:sticky;top:0;z-index:50}
    .toolbar input{flex:1;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;transition:border-color .15s}
    .toolbar input:focus{border-color:#FF6600}

    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;padding:18px}

    .card{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.07);transition:transform .15s,box-shadow .15s}
    .card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)}

    .card-img{height:155px;background:#e2e8f0 center/cover no-repeat;position:relative;display:flex;align-items:center;justify-content:center}
    .img-ph{font-size:42px;color:#94a3b8}

    .card-body{padding:14px 15px}
    .card-name{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px;line-height:1.35}
    .card-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
    .tag{background:#f1f5f9;color:#475569;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px}
    .tag.green{background:#f0fdf4;color:#166534}
    .card-id{font-size:10px;color:#94a3b8;margin-bottom:10px}
    .card-id code{font-size:10px;background:#f8fafc;padding:1px 5px;border-radius:3px}

    .card-actions{display:flex;flex-direction:column;gap:7px}
    .btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 12px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;border:none;transition:opacity .15s;width:100%}
    .btn:active{opacity:.75}
    .btn-teal{background:#0f766e;color:white}
    .btn-outline{background:white;color:#0f766e;border:1.5px solid #0f766e}
    .btn-outline:hover{background:#f0fdf9}

    .empty{text-align:center;padding:60px 20px;color:#94a3b8;width:100%}
    .empty p{font-size:15px;margin-top:10px}

    .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(8px);background:#1e293b;color:white;padding:10px 22px;border-radius:22px;font-size:13px;opacity:0;transition:all .25s;pointer-events:none;z-index:999;white-space:nowrap;max-width:90vw}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

    @media(max-width:600px){.grid{padding:12px;gap:12px}}
  </style>
</head>
<body>

<div class="header">
  <div class="header-row">
    <div class="brand">GuíaSAI<span> Admin</span></div>
    <span class="badge">${total} alojamiento${total !== 1 ? 's' : ''}</span>
  </div>
  <h1>Gestión de Disponibilidad</h1>
  <p>Administra calendarios y genera links para propietarios</p>
</div>

<div class="toolbar">
  <input type="text" placeholder="🔍 Buscar por nombre, tipo o zona…" oninput="filter(this.value)">
</div>

<div class="grid" id="grid">${cards}</div>

<div class="toast" id="toast"></div>

<script>
  function filter(q) {
    q = q.toLowerCase().trim();
    document.querySelectorAll('.card').forEach(function(c) {
      var match = !q || (c.dataset.search || '').toLowerCase().includes(q);
      c.style.display = match ? '' : 'none';
    });
  }

  function copyLink(url) {
    var full = window.location.origin + url;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(function() {
        showToast('✓ Link copiado — comparte con el propietario');
      }).catch(function() { fallbackCopy(full); });
    } else {
      fallbackCopy(full);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('✓ Link copiado'); }
    catch(e) { prompt('Copia este link:', text); }
    document.body.removeChild(ta);
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2600);
  }
</script>
</body>
</html>`;
}

export default router;
