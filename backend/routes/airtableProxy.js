/**
 * Proxy seguro de Airtable.
 *
 * El token de Airtable vive SOLO aquí (process.env.AIRTABLE_API_KEY) y nunca
 * llega al navegador. El frontend llama a:
 *
 *   /api/airtable/v0/<BASE_ID>/<TABLA>[/<REC_ID>][?query]
 *
 * que tiene la misma forma que la API de Airtable, así que migrar un cliente
 * es cambiar la URL base y quitar el header Authorization.
 *
 * Qué NO permite (a diferencia del proxy anterior):
 *  - Cualquier ruta fuera de /v0/<base>/<tabla>[/<rec>] (nada de /v0/meta/*,
 *    que lista todas las bases de la cuenta).
 *  - Bases que no estén en la lista permitida.
 *  - Redirigir el token a otro host (SSRF): el destino se reconstruye desde
 *    partes validadas y se verifica que el origen sea api.airtable.com.
 *  - Tablas listadas en AIRTABLE_PROXY_BLOCKED_TABLES.
 *  - Ráfagas: límite de peticiones por IP.
 *
 * Variables de entorno:
 *  - AIRTABLE_API_KEY                 (obligatoria, solo servidor)
 *  - AIRTABLE_BASE_ID                 base principal
 *  - AIRTABLE_ALLOWED_BASES           opcional, lista separada por comas
 *  - AIRTABLE_PROXY_BLOCKED_TABLES    opcional, nombres o IDs separados por comas
 *  - AIRTABLE_PROXY_RATE_LIMIT        opcional, peticiones/min por IP (def. 240)
 *
 * IMPORTANTE: esto evita que el token se filtre y limita el alcance, pero NO es
 * autenticación de usuarios. El siguiente paso es restringir las escrituras a
 * sesiones admin y reducir las lecturas a una lista de tablas públicas.
 */
import express from 'express';

const AIRTABLE_ORIGIN = 'https://api.airtable.com';
const METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);

// /v0/<base>/<tabla>[/<registro>]
const PATH_RE = /^\/v0\/(app[A-Za-z0-9]{14})\/([^/?#]+)(?:\/(rec[A-Za-z0-9]{14}))?$/;

const splitList = (v) =>
  (v || '').split(',').map((s) => s.trim()).filter(Boolean);

const allowedBases = new Set([
  process.env.AIRTABLE_BASE_ID,
  process.env.VITE_AIRTABLE_BASE_ID,
  'appiReH55Qhrbv4Lk',
  'appij4vUx7GZEwf5x',
  ...splitList(process.env.AIRTABLE_ALLOWED_BASES),
].filter(Boolean));

const blockedTables = new Set(splitList(process.env.AIRTABLE_PROXY_BLOCKED_TABLES));

/**
 * Valida "/v0/<base>/<tabla>[/<rec>][?query]" y devuelve la URL destino
 * (o lanza un Error con .status). Reutilizada por el proxy legacy de /agencias.
 */
export function buildAirtableTarget(pathWithQuery, method = 'GET') {
  const fail = (status, msg) => Object.assign(new Error(msg), { status });

  if (typeof pathWithQuery !== 'string' || !pathWithQuery.startsWith('/v0/')) {
    throw fail(400, 'Ruta inválida');
  }
  if (!METHODS.has(method)) throw fail(405, 'Método no permitido');

  const qIndex = pathWithQuery.indexOf('?');
  const pathname = qIndex === -1 ? pathWithQuery : pathWithQuery.slice(0, qIndex);
  const search = qIndex === -1 ? '' : pathWithQuery.slice(qIndex);

  const m = PATH_RE.exec(pathname);
  if (!m) throw fail(400, 'Ruta no permitida');
  const [, baseId, tableSegment, recId] = m;

  if (!allowedBases.has(baseId)) throw fail(403, 'Base no permitida');

  let tableName;
  try { tableName = decodeURIComponent(tableSegment); } catch { throw fail(400, 'Tabla inválida'); }
  if (blockedTables.has(tableName) || blockedTables.has(tableSegment)) {
    throw fail(403, 'Tabla no disponible');
  }
  if (method === 'DELETE' && !recId) throw fail(400, 'DELETE requiere ID de registro');

  const target = new URL(
    `/v0/${baseId}/${tableSegment}${recId ? `/${recId}` : ''}${search}`,
    AIRTABLE_ORIGIN,
  );
  if (target.origin !== AIRTABLE_ORIGIN) throw fail(400, 'Destino inválido');
  return target;
}

/** Reenvía a Airtable con el token del servidor. Compartido con el proxy legacy. */
export async function forwardToAirtable(req, res, pathWithQuery) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Airtable no configurado en el servidor' });
  }

  let target;
  try {
    target = buildAirtableTarget(pathWithQuery, req.method);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  try {
    const init = {
      method: req.method,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
    };
    if (req.method === 'POST' || req.method === 'PATCH') {
      init.body = JSON.stringify(req.body ?? {});
    }
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    res.status(upstream.status);
    res.type('application/json');
    return res.send(text);
  } catch (err) {
    console.error('❌ Airtable proxy:', err.name === 'TimeoutError' ? 'timeout' : err.message);
    return res.status(502).json({ error: 'Error al contactar Airtable' });
  }
}

// ── Límite de peticiones por IP (en memoria, suficiente para una instancia) ──
const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.AIRTABLE_PROXY_RATE_LIMIT) || 240;
const hits = new Map();

export function rateLimit(req, res, next) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ip = fwd.length ? fwd[fwd.length - 1] : req.ip; // última salto = el que añade Render
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
  } else if (++entry.count > LIMIT) {
    res.set('Retry-After', '30');
    return res.status(429).json({ error: 'Demasiadas peticiones' });
  }
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
  }
  next();
}

const router = express.Router();
router.use(rateLimit);

// req.url dentro del router es "/v0/<base>/<tabla>?query" (sin el prefijo /api/airtable)
// (Express 5: no se admite '*'; router.use captura todo lo que cuelga del prefijo)
router.use((req, res) => forwardToAirtable(req, res, req.url));

export default router;
