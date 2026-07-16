/**
 * Traslados Aeropuerto ↔ Hotel — GuíaSAI
 *
 * Herramienta independiente (no atada a Copa/Delegaciones). Lee la tabla
 * Taxis_Traslados: Hotel_Destino, Color_Zona, Precio_DiurnoPub, Precio_NocturnoPub.
 * Vehículo tipo sedán, 1-4 pax por trayecto (según equipaje), tarifa por
 * vehículo (no por persona). Diurno 6:00–20:59 · Nocturno 21:00–5:59.
 */

import express from 'express';

const router = express.Router();

const AT = () => {
  const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  return { key, base, headers: { Authorization: `Bearer ${key}` } };
};

// Diurno: 6:00am a 8:59pm · Nocturno: 9:00pm a 5:59am
export function turnoDeHora(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return 'diurno';
  const [h] = hhmm.split(':').map(Number);
  return (h >= 6 && h < 21) ? 'diurno' : 'nocturno';
}

let cache = { data: null, ts: 0 };

async function leerHoteles() {
  if (cache.data && Date.now() - cache.ts < 60_000) return cache.data;
  const { headers, base } = AT();
  const CAMPOS = ['Hotel_Destino', 'Color_Zona', 'Capacidad_Sedan', 'Precio_DiurnoPub', 'Precio_NocturnoPub'];
  const fieldsQs = CAMPOS.map(c => `fields[]=${encodeURIComponent(c)}`).join('&');
  const r = await fetch(`https://api.airtable.com/v0/${base}/Taxis_Traslados?${fieldsQs}&maxRecords=100`, { headers });
  if (!r.ok) { console.warn(`[traslados] ${r.status}: ${await r.text()}`); return []; }
  const d = await r.json();
  const hoteles = (d.records || [])
    .map(rec => {
      const f = rec.fields;
      const nombre = f['Hotel_Destino'] || '';
      if (!nombre) return null;
      return {
        id: rec.id,
        nombre,
        colorZona: f['Color_Zona'] || '',
        precioDiurno: Number(f['Precio_DiurnoPub'] || 0),
        precioNocturno: Number(f['Precio_NocturnoPub'] || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  cache = { data: hoteles, ts: Date.now() };
  return hoteles;
}

// GET /api/traslados/hoteles — catálogo para el selector
router.get('/hoteles', async (_req, res) => {
  try { res.json(await leerHoteles()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/traslados/turno?hora=HH:MM — a qué turno cae una hora dada
router.get('/turno', (req, res) => {
  res.json({ turno: turnoDeHora(req.query.hora) });
});

export default router;
