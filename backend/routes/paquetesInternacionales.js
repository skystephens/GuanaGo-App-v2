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
  // Esta es una API de datos, no un archivo estático — nunca debe responder
  // 304 (sin cuerpo). El bug real: Express generaba un ETag automático y el
  // navegador recibía "no modificado" con body vacío aunque Airtable sí
  // tuviera los 13 paquetes — el fetch del frontend fallaba en silencio.
  res.set('Cache-Control', 'no-store');

  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) {
      console.log(`✅ paquetes-internacionales: ${cache.data.length} desde caché`);
      return res.json(cache.data);
    }

    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    console.log(`🔎 paquetes-internacionales: base=${base} key=${key ? 'presente (' + key.slice(0, 6) + '...)' : 'AUSENTE'}`);
    if (!key) {
      console.warn('⚠️ paquetes-internacionales: AIRTABLE_API_KEY no está configurada en este servicio de Render');
      return res.json([]);
    }

    const formula = encodeURIComponent(`{Estado}="Activo"`);
    const r = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&pageSize=50`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    if (!r.ok) {
      const errBody = await r.text().catch(() => '(sin body)');
      console.warn(`⚠️ ${TABLE} no disponible (${r.status}) — sección internacional oculta — respuesta: ${errBody.slice(0, 300)}`);
      return res.json([]);
    }
    const data = await r.json();
    console.log(`📦 paquetes-internacionales: Airtable devolvió ${data.records?.length ?? 0} registros con Estado="Activo" (base ${base})`);
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
    if (paquetes.length > 0) cache = { data: paquetes, ts: Date.now() };
    res.json(paquetes);
  } catch (err) {
    console.error('❌ paquetes-internacionales:', err.message);
    res.json([]);
  }
});

export default router;
