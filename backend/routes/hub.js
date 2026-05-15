/**
 * GuanaGO Hub — Área de trabajo interna
 * Acceso protegido por PIN. Stateless: el token va en la URL.
 * Ruta raíz: /hub
 */

import express from 'express';
import crypto  from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath }  from 'url';

const router    = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR  = join(__dirname, '..', 'docs');

// ── Auth helpers ─────────────────────────────────────────────────────────────

const HUB_PIN    = process.env.ADMIN_PIN || process.env.HUB_PIN || '0000';
const HUB_SECRET = process.env.SESSION_SECRET || 'guanago-hub-2026';

function makeToken() {
  return crypto
    .createHmac('sha256', HUB_SECRET)
    .update('hub:' + HUB_PIN)
    .digest('hex')
    .slice(0, 28);
}

function validToken(t) {
  return typeof t === 'string' && t === makeToken();
}

// ── GET /hub ─────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const error = req.query.error === '1';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(loginHtml(error));
});

// ── POST /hub/login ──────────────────────────────────────────────────────────

router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  if (req.body?.pin === HUB_PIN) {
    return res.redirect(`/hub/${makeToken()}`);
  }
  res.redirect('/hub?error=1');
});

// ── GET /hub/:token ──────────────────────────────────────────────────────────

router.get('/:token', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(hubHtml(req.params.token, 'estrategia'));
});

// ── GET /hub/:token/estrategia ────────────────────────────────────────────────

router.get('/:token/estrategia', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'estrategia.html'));
});

// ── GET /hub/:token/agentes ───────────────────────────────────────────────────

router.get('/:token/agentes', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'agentes.html'));
});

// ── GET /hub/:token/ecosistema ────────────────────────────────────────────────

router.get('/:token/ecosistema', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'ecosistema.html'));
});

// ── GET /hub/:token/arquitectura ──────────────────────────────────────────────

router.get('/:token/arquitectura', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'arquitectura.html'));
});

// ── GET /hub/:token/aliados ───────────────────────────────────────────────────

router.get('/:token/aliados', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'aliados.html'));
});

// ── GET /hub/:token/contenido ─────────────────────────────────────────────────

router.get('/:token/contenido', (req, res) => {
  if (!validToken(req.params.token)) return res.redirect('/hub?error=1');
  res.sendFile(join(DOCS_DIR, 'contenido.html'));
});

export default router;

// ═══════════════════════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

function loginHtml(error) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GuanaGO Hub · Acceso</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Outfit',sans-serif;background:#060E18;color:#F0F4F8;min-height:100vh;display:flex;align-items:center;justify-content:center}
.wrap{width:100%;max-width:380px;padding:24px}
.logo{text-align:center;margin-bottom:32px}
.logo-eye{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#00E5CC;font-weight:700;margin-bottom:8px}
.logo-title{font-size:28px;font-weight:800}
.logo-title span{color:#00E5CC}
.logo-sub{font-size:13px;color:#6B8A9E;margin-top:4px}
.card{background:#101E2C;border:1px solid rgba(0,229,204,0.14);border-radius:16px;padding:28px}
.label{font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;display:block}
.pin-wrap{position:relative;margin-bottom:18px}
input[type=password]{width:100%;background:#060E18;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:13px 16px;font-size:18px;font-family:'Outfit',sans-serif;color:#F0F4F8;letter-spacing:8px;text-align:center;outline:none;transition:border-color .15s}
input[type=password]:focus{border-color:#00E5CC}
button{width:100%;background:linear-gradient(135deg,#00C9B1,#00E5CC);color:#060E18;font-weight:800;font-size:15px;border:none;border-radius:10px;padding:13px;cursor:pointer;font-family:'Outfit',sans-serif;transition:opacity .15s}
button:hover{opacity:.9}
.err{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:8px;color:#FF6B6B;font-size:13px;padding:10px 14px;margin-bottom:16px;text-align:center}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#3A5468}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">
    <div class="logo-eye">GuanaGO · Área interna</div>
    <div class="logo-title">Guana<span>Hub</span></div>
    <div class="logo-sub">Espacio de trabajo · Sky Stephens</div>
  </div>
  <div class="card">
    ${error ? '<div class="err">PIN incorrecto — intenta de nuevo</div>' : ''}
    <form method="POST" action="/hub/login">
      <label class="label">PIN de acceso</label>
      <div class="pin-wrap">
        <input type="password" name="pin" placeholder="••••" autofocus autocomplete="off" inputmode="numeric" maxlength="8">
      </div>
      <button type="submit">Entrar al Hub →</button>
    </form>
  </div>
  <div class="footer">guanago.travel · GuíaSAI S.A.S. RNT 48674</div>
</div>
</body>
</html>`;
}

function hubHtml(token, activeDoc) {
  const docs = [
    { id: 'estrategia',   label: '📊 Estrategia',       src: `/hub/${token}/estrategia`   },
    { id: 'agentes',      label: '🤖 Agentes & Eventos', src: `/hub/${token}/agentes`      },
    { id: 'ecosistema',   label: '🗺️ Ecosistema',        src: `/hub/${token}/ecosistema`   },
    { id: 'arquitectura', label: '🏗️ Arquitectura',      src: `/hub/${token}/arquitectura` },
    { id: 'aliados',      label: '🤝 Aliados',            src: `/hub/${token}/aliados`      },
    { id: 'contenido',    label: '📱 Contenido',          src: `/hub/${token}/contenido`    },
  ];

  const navButtons = docs.map(d =>
    `<button class="nb${d.id === activeDoc ? ' on' : ''}" onclick="loadDoc('${d.src}','${d.id}',this)">${d.label}</button>`
  ).join('');

  const defaultSrc = docs.find(d => d.id === activeDoc)?.src || docs[0].src;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GuanaGO Hub</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Outfit',sans-serif;background:#060E18;color:#F0F4F8;height:100vh;display:flex;flex-direction:column;overflow:hidden}

/* ── Topbar ── */
.topbar{background:rgba(6,14,24,.97);border-bottom:1px solid rgba(0,229,204,.14);flex-shrink:0;display:flex;align-items:stretch;overflow:hidden}

/* Brand */
.brand{font-size:15px;font-weight:800;color:#F0F4F8;padding:0 16px;display:flex;align-items:center;border-right:1px solid rgba(255,255,255,.07);white-space:nowrap;flex-shrink:0}
.brand span{color:#00E5CC}

/* Section label inside topbar */
.sec-lbl{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(0,229,204,.45);padding:0 10px 0 14px;display:flex;align-items:center;white-space:nowrap;flex-shrink:0}

/* Doc nav tabs */
.nav-scroll{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;flex-shrink:0}
.nav-scroll::-webkit-scrollbar{display:none}
.nb{font-size:13px;font-weight:600;color:#6B8A9E;padding:15px 14px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;font-family:'Outfit',sans-serif}
.nb:hover,.nb.on{color:#00E5CC;border-bottom-color:#00E5CC}

/* Divider */
.vdiv{width:1px;background:rgba(255,255,255,.07);margin:8px 4px;flex-shrink:0}

/* Tool links (open externally) */
.tool-strip{display:flex;gap:4px;align-items:center;padding:0 6px;flex-shrink:0;overflow-x:auto;scrollbar-width:none}
.tool-strip::-webkit-scrollbar{display:none}
.tl{font-size:11px;font-weight:600;color:#4A6880;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:5px 10px;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:all .15s}
.tl:hover{color:#00E5CC;border-color:rgba(0,229,204,.25);background:rgba(0,229,204,.05)}

/* Spacer + action buttons */
.spacer{flex:1}
.action-group{display:flex;align-items:center;gap:6px;padding:0 12px;flex-shrink:0}
.ext-btn{font-size:12px;font-weight:600;color:#6B8A9E;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:5px;transition:all .15s}
.ext-btn:hover{color:#00E5CC;border-color:rgba(0,229,204,.3)}
.lock-btn{font-size:12px;font-weight:600;color:#FF6B6B;background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.15);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;text-decoration:none;transition:all .15s}
.lock-btn:hover{background:rgba(255,107,107,.12)}

iframe{flex:1;border:none;width:100%}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">Guana<span>Hub</span></div>

  <div class="sec-lbl">DOCS</div>
  <div class="nav-scroll">
    ${navButtons}
  </div>

  <div class="vdiv"></div>
  <div class="sec-lbl">ACCESO RÁPIDO</div>
  <div class="tool-strip">
    <a href="https://airtable.com/appiReH55Qhrbv4Lk" target="_blank" class="tl">📋 Tareas ↗</a>
    <a href="https://airtable.com/appiReH55Qhrbv4Lk" target="_blank" class="tl">⚡ Cola Agentes ↗</a>
    <a href="https://airtable.com/appiReH55Qhrbv4Lk" target="_blank" class="tl">🗄️ Airtable ↗</a>
  </div>

  <div class="spacer"></div>
  <div class="action-group">
    <a id="ext-link" href="${defaultSrc}" target="_blank" class="ext-btn">↗ Pantalla completa</a>
    <a href="/hub" class="lock-btn">🔒 Salir</a>
  </div>
</div>

<iframe id="frame" src="${defaultSrc}" title="GuanaGO Hub"></iframe>

<script>
function loadDoc(src, id, btn) {
  document.getElementById('frame').src = src;
  document.getElementById('ext-link').href = src;
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}
</script>
</body>
</html>`;
}
