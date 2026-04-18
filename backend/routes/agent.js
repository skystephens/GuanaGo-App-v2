/**
 * routes/agent.js — GuanaGO Agent API
 *
 * POST /api/agent/chat           → Conversacion multi-modo con el agente IA
 * GET  /api/agent/cotizaciones/:userId → Historial de cotizaciones del usuario
 * GET  /api/agent/reservas/:userId     → Historial de reservas del usuario
 * GET  /api/agent/analytics           → Resumen de analiticas del dia
 * POST /api/agent/sync-catalog        → Sincronizar Airtable -> Firestore
 */
import express from 'express';
import { agentChat } from '../services/agentService.js';
import {
  getCotizaciones,
  getReservations,
  getAnalyticsSummary,
  upsertCatalogItem,
  updateCotizacionStatus,
  updateReservationStatus,
} from '../services/firestoreService.js';
import { config } from '../config.js';

const router = express.Router();

// ─── POST /api/agent/chat ─────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, mode, history, userId, conversationId, context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
    }

    const validModes = ['turista', 'cotizador', 'admin', 'b2b'];
    const safeMode = validModes.includes(mode) ? mode : 'turista';

    const result = await agentChat({
      message: message.trim(),
      mode: safeMode,
      history: Array.isArray(history) ? history : [],
      userId,
      conversationId,
      context: context || {},
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Agent chat error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      response: 'Estoy teniendo problemas tecnicos. Intenta de nuevo en un momento.',
    });
  }
});

// ─── GET /api/agent/cotizaciones/:userId ──────────────────────────────────────
router.get('/cotizaciones/:userId', async (req, res) => {
  try {
    const cotizaciones = await getCotizaciones(req.params.userId);
    res.json({ success: true, data: cotizaciones, count: cotizaciones.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PATCH /api/agent/cotizaciones/:id/status ─────────────────────────────────
router.patch('/cotizaciones/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['draft', 'pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado invalido' });
    }
    await updateCotizacionStatus(req.params.id, status, notes || '');
    res.json({ success: true, id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/agent/reservas/:userId ─────────────────────────────────────────
router.get('/reservas/:userId', async (req, res) => {
  try {
    const reservas = await getReservations(req.params.userId);
    res.json({ success: true, data: reservas, count: reservas.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PATCH /api/agent/reservas/:id/status ────────────────────────────────────
router.patch('/reservas/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await updateReservationStatus(req.params.id, status);
    res.json({ success: true, id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/agent/analytics ─────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const { date } = req.query;
    const summary = await getAnalyticsSummary(date);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/agent/sync-catalog ─────────────────────────────────────────────
// Sincroniza ServiciosTuristicos_SAI de Airtable hacia Firestore
router.post('/sync-catalog', async (req, res) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const url = `https://api.airtable.com/v0/${baseId}/ServiciosTuristicos_SAI?maxRecords=100`;
    const airtableRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!airtableRes.ok) {
      return res.status(502).json({ success: false, error: `Airtable error: ${airtableRes.status}` });
    }

    const data = await airtableRes.json();
    const records = data.records || [];

    // Upsert cada servicio en Firestore
    await Promise.all(records.map(r =>
      upsertCatalogItem('servicios', r.id, {
        nombre: r.fields?.Nombre || '',
        tipo: r.fields?.Tipo || '',
        precio: r.fields?.Precio || 0,
        capacidad: r.fields?.Capacidad || 0,
        descripcion: r.fields?.Descripcion || '',
        imagenurl: r.fields?.Imagenurl || '',
        disponible: r.fields?.Disponible !== false,
        airtableId: r.id,
      })
    ));

    res.json({
      success: true,
      synced: records.length,
      message: `${records.length} servicios sincronizados a Firestore`,
    });
  } catch (error) {
    console.error('Sync catalog error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
