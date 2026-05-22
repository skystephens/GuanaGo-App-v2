/**
 * Admin Users API
 * GET  /api/admin/users           — lista todos los usuarios de la tabla Leads
 * GET  /api/admin/users/search    — búsqueda por email o nombre
 * PATCH /api/admin/users/:id/role — cambia el rol en Leads + Firebase Custom Claims
 */

import express from 'express';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const router = express.Router();

const LEADS_TABLE  = 'Leads';
const BASE_ID      = () => process.env.AIRTABLE_BASE_ID;
const AT_HEADERS   = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

const leadsUrl = (suffix = '') =>
  `https://api.airtable.com/v0/${BASE_ID()}/${encodeURIComponent(LEADS_TABLE)}${suffix}`;

function mapRecord(r) {
  const f = r.fields;
  return {
    id: r.id,
    nombre: f.Nombre || '',
    email: f.Email || '',
    role: f.Role || f.Rol || 'Turista',
    estado: (typeof f.Estado_del_Lead === 'object' ? f.Estado_del_Lead?.name : f.Estado_del_Lead) || 'Activo',
    fechaRegistro: f.Fecha_de_Registro || null,
    ultimaInteraccion: f['Última_Interacción'] || null,
    metodoAuth: f.Metodo_de_Auth || 'Legacy',
    firebaseUid: f.ID_Usuario || null,
    saldo: f.Saldo_GUANA || 0,
    telefono: f.Telefono || f.Teléfono || null,
    pais: f.Pais || f.País || null,
    ciudad: f.Ciudad || null,
  };
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { role, search, pageSize = 100, offset } = req.query;

    let formula = '';
    const filters = [];
    if (role) filters.push(`{Role}='${String(role).replace(/'/g, "''")}'`);
    if (search) {
      const s = String(search).replace(/'/g, "''");
      filters.push(`OR(SEARCH('${s}',LOWER({Nombre})),SEARCH('${s}',LOWER({Email})))`);
    }
    if (filters.length) formula = filters.length === 1 ? filters[0] : `AND(${filters.join(',')})`;

    let url = `${leadsUrl()}?maxRecords=${pageSize}`;
    if (formula) url += `&filterByFormula=${encodeURIComponent(formula)}`;
    if (offset)  url += `&offset=${encodeURIComponent(String(offset))}`;

    const response = await fetch(url, { headers: AT_HEADERS() });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Airtable ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      users: (data.records || []).map(mapRecord),
      total: data.records?.length || 0,
      offset: data.offset || null,
    });
  } catch (err) {
    console.error('[admin/users] GET error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────────────────────────
router.patch('/:id/role', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const { role, firebaseUid } = req.body;

  if (!role) return res.status(400).json({ success: false, error: 'role requerido' });

  const ALLOWED_ROLES = ['Turista', 'Raizal_Residente', 'Aliado', 'Operador', 'Socio', 'Artista', 'Asesor', 'Admin', 'Super_Admin'];
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `Rol no válido. Opciones: ${ALLOWED_ROLES.join(', ')}` });
  }

  try {
    // 1. Actualizar Leads en Airtable
    const patchRes = await fetch(leadsUrl(`/${id}`), {
      method: 'PATCH',
      headers: AT_HEADERS(),
      body: JSON.stringify({ fields: { Role: role } }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`Airtable patch error ${patchRes.status}: ${errText}`);
    }

    // 2. Setear Firebase Custom Claims si se conoce el UID
    if (firebaseUid && firebaseInitialized) {
      try {
        await admin.auth().setCustomUserClaims(firebaseUid, { role });
        console.log(`✅ Firebase claims → ${firebaseUid}: role=${role}`);
      } catch (claimErr) {
        console.warn('⚠️ Firebase claims no actualizados:', claimErr.message);
      }
    }

    res.json({ success: true, message: `Rol actualizado a ${role}` });
  } catch (err) {
    console.error('[admin/users] PATCH role error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/admin/users/:id/estado ────────────────────────────────────────
router.patch('/:id/estado', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ success: false, error: 'estado requerido' });

  try {
    const patchRes = await fetch(leadsUrl(`/${id}`), {
      method: 'PATCH',
      headers: AT_HEADERS(),
      body: JSON.stringify({ fields: { Estado_del_Lead: estado } }),
    });
    if (!patchRes.ok) throw new Error(`Airtable error: ${patchRes.status}`);
    res.json({ success: true, message: `Estado actualizado a ${estado}` });
  } catch (err) {
    console.error('[admin/users] PATCH estado error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
