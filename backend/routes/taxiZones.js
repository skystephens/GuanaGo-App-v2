/**
 * Taxi Zones Route — GuanaGO
 * GET  /api/taxi-zones → devuelve los polígonos GPS de las 5 zonas
 * POST /api/taxi-zones → guarda los polígonos desde el editor
 *
 * Almacenamiento: Firestore  →  colección "config" / documento "taxi_zones"
 * Nada que ver con Airtable — las zonas son config geográfica de la app.
 */

import express from 'express';
import admin, { firebaseInitialized } from '../firebaseAdmin.js';

const router = express.Router();

const db = () => (firebaseInitialized ? admin.firestore() : null);
const DOC  = () => db()?.collection('config').doc('taxi_zones');

// ── GET /api/taxi-zones ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const ref = DOC();
    if (!ref) return res.json({ success: true, data: null });

    const snap = await ref.get();
    if (!snap.exists) return res.json({ success: true, data: null });

    const { zones } = snap.data();
    return res.json({ success: true, data: { zones: zones || null } });
  } catch (err) {
    console.error('[taxi-zones GET]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/taxi-zones ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { zones } = req.body;
    if (!zones || typeof zones !== 'object') {
      return res.status(400).json({ success: false, error: '"zones" requerido' });
    }

    const ref = DOC();
    if (!ref) return res.status(503).json({ success: false, error: 'Firestore no disponible' });

    await ref.set({
      zones,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const total = Object.keys(zones).length;
    console.log(`[taxi-zones] ${total} zonas guardadas en Firestore`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[taxi-zones POST]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
