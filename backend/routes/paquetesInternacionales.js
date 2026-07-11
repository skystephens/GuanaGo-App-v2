/**
 * Paquetes Internacionales — GET /api/paquetes-internacionales
 * Lee la tabla Airtable "Paquetes_Internacionales" (Estado = Activo).
 * Si la tabla no existe aún, devuelve [] y el Home simplemente oculta la sección.
 */

import express from 'express';

const router = express.Router();
const TABLE = 'Paquetes_Internacionales';

let cache = { data: null, ts: 0 };
const CACHE_MS = 5 * 60_000;

router.get('/', async (_req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) return res.json(cache.data);

    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    if (!key) return res.json([]);

    const formula = encodeURIComponent(`{Estado}="Activo"`);
    const r = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&pageSize=50`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    if (!r.ok) {
      console.warn(`⚠️ ${TABLE} no disponible (${r.status}) — sección internacional oculta`);
      return res.json([]);
    }
    const data = await r.json();
    const paquetes = (data.records || []).map(rec => ({
      id: rec.id,
      nombre: rec.fields['Nombre'] || '',
      categoria: rec.fields['Categoria'] || 'Internacional',
      duracion: rec.fields['Duracion'] || '',
      origen: rec.fields['Origen'] || '',
      salidas: rec.fields['Salidas_2027'] || '',
      precioDesde: rec.fields['Precio_Desde_Doble_USD'] || 0,
      precioSencilla: rec.fields['Precio_Sencilla_USD'] || null,
      imagen: rec.fields['Imagen_URL'] || '',
      notas: rec.fields['Notas_Tarifa'] || '',
    })).filter(p => p.nombre);

    paquetes.sort((a, b) => (a.categoria + String(a.precioDesde).padStart(6, '0')).localeCompare(b.categoria + String(b.precioDesde).padStart(6, '0')));
    cache = { data: paquetes, ts: Date.now() };
    res.json(paquetes);
  } catch (err) {
    console.error('❌ paquetes-internacionales:', err.message);
    res.json([]);
  }
});

export default router;
