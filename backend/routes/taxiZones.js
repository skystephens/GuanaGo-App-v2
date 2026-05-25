/**
 * Taxi Zones Route — GuanaGO
 * GET  /api/taxi-zones → devuelve los puntos GPS de las 5 zonas guardadas
 * POST /api/taxi-zones → guarda los puntos desde el editor
 *
 * Almacenamiento: Airtable base appiReH55Qhrbv4Lk
 * Estrategia: un solo registro en la tabla Procedimientos_RAG con
 * campo "Titulo" = "__taxi_zones_config__" y el JSON en "Contenido".
 * Si no existe el registro, GET devuelve null y POST lo crea.
 */

import express from 'express';
import { config } from '../config.js';

const router = express.Router();

const BASE_ID = config.airtable.baseId || 'appiReH55Qhrbv4Lk';
const TABLE   = 'Procedimientos_RAG';
const AT_URL  = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
const KEY     = '__taxi_zones_config__';

const headers = () => ({
  Authorization: `Bearer ${config.airtable.apiKey}`,
  'Content-Type': 'application/json',
});

/** Busca el record de config en Airtable. Devuelve { id, zones } o null */
async function findConfigRecord() {
  const params = new URLSearchParams({
    filterByFormula: `{Título} = "${KEY}"`,
    maxRecords: '1',
  });
  const res = await fetch(`${AT_URL}?${params}`, { headers: headers() });
  if (!res.ok) throw new Error(`Airtable GET error ${res.status}`);
  const data = await res.json();
  const rec = data.records?.[0];
  if (!rec) return null;
  try {
    return { id: rec.id, zones: JSON.parse(rec.fields['Contenido_Markdown'] || 'null') };
  } catch {
    return { id: rec.id, zones: null };
  }
}

// ── GET /api/taxi-zones ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const record = await findConfigRecord();
    if (!record || !record.zones) {
      return res.json({ success: true, data: null });
    }
    return res.json({ success: true, data: { zones: record.zones } });
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

    const jsonString = JSON.stringify(zones);
    const existing   = await findConfigRecord();

    if (existing) {
      // Actualizar registro existente
      const upd = await fetch(`${AT_URL}/${existing.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ fields: { 'Contenido_Markdown': jsonString } }),
      });
      if (!upd.ok) throw new Error(`Airtable PATCH error ${upd.status}`);
    } else {
      // Crear nuevo registro
      const cre = await fetch(AT_URL, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          fields: {
            'Título':             KEY,
            'Tipo':               'SOP',
            'Contenido_Markdown': jsonString,
          },
          typecast: true,
        }),
      });
      if (!cre.ok) throw new Error(`Airtable POST error ${cre.status}`);
    }

    console.log(`[taxi-zones] zonas guardadas — ${Object.keys(zones).length} zonas`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[taxi-zones POST]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
