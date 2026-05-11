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
    { id: 'estrategia', label: '📊 Estrategia Mayo 2026', src: `/hub/${token}/estrategia` },
  ];

  const navButtons = docs.map(d =>
    `<button class="nb${d.id === activeDoc ? ' on' : ''}" onclick="loadDoc('${d.src}','${d.id}',this)">${d.label}</button>`
  ).join('');

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
.topbar{display:flex;align-items:center;gap:0;background:rgba(6,14,24,.97);border-bottom:1px solid rgba(0,229,204,.14);flex-shrink:0;padding:0 12px}
.brand{font-size:15px;font-weight:800;color:#F0F4F8;padding:12px 16px 12px 4px;border-right:1px solid rgba(255,255,255,.08);margin-right:8px;white-space:nowrap}
.brand span{color:#00E5CC}
.nav-scroll{display:flex;gap:0;overflow-x:auto;flex:1;scrollbar-width:none}
.nav-scroll::-webkit-scrollbar{display:none}
.nb{font-size:13px;font-weight:600;color:#6B8A9E;padding:14px 14px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;font-family:'Outfit',sans-serif}
.nb:hover,.nb.on{color:#00E5CC;border-bottom-color:#00E5CC}
.spacer{flex:1}
.ext-btn{font-size:12px;font-weight:600;color:#6B8A9E;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;margin-left:8px;text-decoration:none;display:inline-flex;align-items:center;gap:5px;transition:all .15s}
.ext-btn:hover{color:#00E5CC;border-color:rgba(0,229,204,.3)}
.lock-btn{font-size:12px;font-weight:600;color:#FF6B6B;background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.15);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;margin-left:6px;text-decoration:none;transition:all .15s}
.lock-btn:hover{background:rgba(255,107,107,.12)}
iframe{flex:1;border:none;width:100%}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">Guana<span>Hub</span></div>
  <div class="nav-scroll">
    ${navButtons}
  </div>
  <div class="spacer"></div>
  <a id="ext-link" href="/hub/${token}/estrategia" target="_blank" class="ext-btn">↗ Pantalla completa</a>
  <a href="/hub" class="lock-btn">🔒 Salir</a>
</div>
<iframe id="frame" src="/hub/${token}/estrategia" title="GuanaGO Hub"></iframe>

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
