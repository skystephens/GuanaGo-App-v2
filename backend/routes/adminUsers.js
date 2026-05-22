/**
 * Admin Users API
 * Reads from Usuarios_Admins (team) — Leads table for full CRM to be set up separately.
 *
 * GET   /api/admin/users           — lista usuarios del equipo
 * PATCH /api/admin/users/:id/role  — cambia rol en Airtable + Firebase Custom Claims
 */

import express from 'express';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const router = express.Router();

const TABLE   = 'Usuarios_Admins';
const BASE_ID = () => process.env.AIRTABLE_BASE_ID;
const AT_HDRS = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});
const tableUrl = (suffix = '') =>
  `https://api.airtable.com/v0/${BASE_ID()}/${encodeURIComponent(TABLE)}${suffix}`;

function mapRecord(r) {
  const f = r.fields;
  return {
    id: r.id,
    nombre: f.Nombre || f.Name || '',
    email: f.Email || f.Correo || '',
    role: f.Rol || f.Role || f.Tipo || 'Admin',
    estado: f.Estado || f.Activo === true ? 'Activo' : (f.Activo === false ? 'Inactivo' : f.Estado || 'Activo'),
    fechaRegistro: f.Fecha || f.Fecha_de_Registro || f.Created || null,
    ultimaInteraccion: f.Ultima_Actividad || f['Último acceso'] || null,
    metodoAuth: f.Origen || 'Sistema',
    firebaseUid: f.Firebase_UID || f.ID_Usuario || null,
    saldo: 0,
    telefono: f.Telefono || f.Teléfono || f.Phone || null,
    pais: null,
    ciudad: null,
    nivel: f.Nivel || null,
    accesos: f.Accesos_Modulos || [],
  };
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { search, pageSize = 200, offset } = req.query;

    let url = `${tableUrl()}?maxRecords=${pageSize}`;
    if (search) {
      const s = String(search).replace(/'/g, "''");
      const formula = `OR(SEARCH('${s}',LOWER({Nombre})),SEARCH('${s}',LOWER({Email})))`;
      url += `&filterByFormula=${encodeURIComponent(formula)}`;
    }
    if (offset) url += `&offset=${encodeURIComponent(String(offset))}`;

    const response = await fetch(url, { headers: AT_HDRS() });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Airtable ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      users: (data.records || []).map(mapRecord),
      total: data.records?.length || 0,
      offset: data.offset || null,
      source: TABLE,
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

  try {
    const patchRes = await fetch(tableUrl(`/${id}`), {
      method: 'PATCH',
      headers: AT_HDRS(),
      body: JSON.stringify({ fields: { Rol: role } }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`Airtable ${patchRes.status}: ${errText.slice(0, 200)}`);
    }

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

export default router;
