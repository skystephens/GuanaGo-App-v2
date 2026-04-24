/**
 * Admin Service — autenticación de administradores
 *
 * Flujo:
 *   1. Consulta Airtable `Usuarios_Admins` (fuente de verdad).
 *   2. Si Airtable no responde (caída, pago vencido, timeout) → fallback a
 *      ADMIN_EMERGENCY_PIN en variables de entorno de Render.
 *
 * Variables de entorno requeridas (Render):
 *   AIRTABLE_API_KEY
 *   AIRTABLE_BASE_ID        (appiReH55Qhrbv4Lk)
 *   ADMIN_EMERGENCY_PIN     PIN de emergencia — solo Super Admin
 */

import crypto from 'crypto';

const AT_TABLE   = 'Usuarios_Admins';
const AT_TIMEOUT = 5000; // ms — si Airtable tarda más de 5s, usamos fallback

// ─── helpers ──────────────────────────────────────────────────────────────────

function atUrl() {
  const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  return `https://api.airtable.com/v0/${base}/${encodeURIComponent(AT_TABLE)}`;
}

function atHeaders() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Comparación segura (evita timing attacks) */
function safeCompare(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Fetch con timeout */
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── query Airtable ───────────────────────────────────────────────────────────

async function findUserByPin(pin) {
  const filter = encodeURIComponent(`AND({Pin}="${pin}",{Activo}=1)`);
  const url = `${atUrl()}?filterByFormula=${filter}&maxRecords=1`;

  const res = await fetchWithTimeout(url, { headers: atHeaders() }, AT_TIMEOUT);

  if (!res.ok) {
    throw new Error(`Airtable ${res.status}`);
  }

  const data = await res.json();
  const record = data.records?.[0];
  if (!record) return null;

  const f = record.fields;
  return {
    id:       record.id,
    nombre:   f.Nombre || 'Admin',
    email:    f.Email  || '',
    rol:      f.Rol?.name || f.Rol || 'Admin',
    activo:   f.Activo === true,
    permisos: f.Permisos_especificos || [],
    _recordId: record.id,
  };
}

/** Actualiza "Ultimo acceso" en Airtable de forma async (no bloquea el login) */
function updateUltimoAcceso(recordId) {
  const url = `${atUrl()}/${recordId}`;
  fetch(url, {
    method:  'PATCH',
    headers: atHeaders(),
    body:    JSON.stringify({ fields: { 'Ultimo acceso': new Date().toISOString() } }),
  }).catch(() => {}); // silencioso — no crítico
}

// ─── fallback de emergencia ───────────────────────────────────────────────────

function checkEmergencyPin(pin) {
  const emergency = process.env.ADMIN_EMERGENCY_PIN;
  if (!emergency) return null;
  if (!safeCompare(pin, emergency)) return null;

  console.warn('⚠️  Login con ADMIN_EMERGENCY_PIN (Airtable no disponible)');
  return {
    id:       'emergency-superadmin',
    nombre:   'Administrador Principal',
    email:    'info@guiasai.com',
    rol:      'Super Admin',
    activo:   true,
    permisos: ['*'],
    _fallback: true,
  };
}

// ─── función principal ────────────────────────────────────────────────────────

export async function validateAdminPin(pin) {
  if (!pin) return null;

  // 1. Intentar Airtable
  try {
    const user = await findUserByPin(pin);

    if (!user) {
      console.warn('❌ PIN no encontrado en Airtable');
      return null;
    }

    if (!user.activo) {
      console.warn(`⛔ Admin inactivo: ${user.nombre}`);
      return null;
    }

    console.log(`✅ Admin validado (Airtable): ${user.nombre} [${user.rol}]`);
    updateUltimoAcceso(user._recordId);

    const { _recordId, ...publicUser } = user;
    return publicUser;

  } catch (err) {
    // Airtable caído, timeout, 402 pago, etc.
    console.error(`⚠️  Airtable no disponible (${err.message}) — intentando fallback`);

    const fallback = checkEmergencyPin(pin);
    if (fallback) return fallback;

    console.warn('❌ Fallback también falló — acceso denegado');
    return null;
  }
}

export default { validateAdminPin };
