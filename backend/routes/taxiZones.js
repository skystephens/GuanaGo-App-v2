/**
 * Taxi Zones Route — GuanaGO
 * GET  /api/taxi-zones → devuelve los puntos GPS de las 5 zonas guardadas
 * POST /api/taxi-zones → guarda (admin) los puntos desde el editor
 *
 * Almacenamiento: Firestore  →  config/taxi_zones
 */

import express from 'express';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const router = express.Router();
const DOC    = 'config/taxi_zones';

// ── GET /api/taxi-zones ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ success: false, error: 'Firebase no disponible' });
    }
    const snap = await admin.firestore().doc(DOC).get();
    if (!snap.exists) {
      return res.json({ success: true, data: null }); // aún no hay zonas guardadas
    }
    return res.json({ success: true, data: snap.data() });
  } catch (err) {
    console.error('[taxi-zones GET]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/taxi-zones ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ success: false, error: 'Firebase no disponible' });
    }
    const { zones } = req.body;
    if (!zones || typeof zones !== 'object') {
      return res.status(400).json({ success: false, error: '"zones" requerido' });
    }
    await admin.firestore().doc(DOC).set({
      zones,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[taxi-zones] zonas guardadas — ${Object.keys(zones).length} zonas`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[taxi-zones POST]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
