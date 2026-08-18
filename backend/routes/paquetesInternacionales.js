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

    const formula = encodeURIComponent(`AND({Estado}="Activo", {Publicado}=1)`);
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
      nombre: rec.fields['Nombre'] || rec.fields['\uFEFFNombre'] || '',
      categoria: rec.fields['Categoria'] || 'Internacional',
      duracion: rec.fields['Duracion'] || '',
      origen: rec.fields['Origen'] || '',
      salidas: rec.fields['Salidas_2027'] || '',
      precioDesde: rec.fields['Precio_Desde_Doble_USD'] || 0,
      precioSencilla: rec.fields['Precio_Sencilla_USD'] || null,
      precioNino: rec.fields['Precio_Nino_USD'] || null,
      flyerDrive: rec.fields['Flyer_Drive'] || '',
      imagen: rec.fields['Imagen_URL'] || '',
      notas: rec.fields['Notas_Tarifa'] || '',
    })).filter(p => p.nombre);
    console.log(`✅ paquetes-internacionales: ${paquetes.length} con nombre válido (de ${data.records?.length ?? 0} totales)`);

    paquetes.sort((a, b) => (a.categoria + String(a.precioDesde).padStart(6, '0')).localeCompare(b.categoria + String(b.precioDesde).padStart(6, '0')));
    if (paquetes.length > 0) cache = { data: paquetes, ts: Date.now() };
    res.json(paquetes);
  } catch (err) {
    console.error('❌ paquetes-internacionales:', err.message);
    res.json([]);
  }
});

// ── ADMIN: lista completa (todos los estados, no solo Activo) ──────────────
router.get('/admin', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    if (!key) return res.status(500).json({ error: 'AIRTABLE_API_KEY no configurada' });

    let allRecords = [];
    let offset;
    do {
      const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}${offset ? `?offset=${offset}` : ''}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) {
        const errBody = await r.text().catch(() => '');
        return res.status(r.status).json({ error: `Airtable ${r.status}`, detail: errBody.slice(0, 300) });
      }
      const data = await r.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;
    } while (offset);

    const paquetes = allRecords.map(rec => ({
      id: rec.id,
      nombre: rec.fields['Nombre'] || rec.fields['\uFEFFNombre'] || '',
      categoria: rec.fields['Categoria'] || '',
      duracion: rec.fields['Duracion'] || '',
      origen: rec.fields['Origen'] || '',
      salidas: rec.fields['Salidas_2027'] || '',
      precioDesde: rec.fields['Precio_Desde_Doble_USD'] || 0,
      precioSencilla: rec.fields['Precio_Sencilla_USD'] || null,
      precioNino: rec.fields['Precio_Nino_USD'] || null,
      flyerDrive: rec.fields['Flyer_Drive'] || '',
      imagen: rec.fields['Imagen_URL'] || '',
      notas: rec.fields['Notas_Tarifa'] || '',
      operador: rec.fields['Operador'] || '',
      estado: rec.fields['Estado'] || '',
      publicado: rec.fields['Publicado'] === true,
    }));
    paquetes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    res.json(paquetes);
  } catch (err) {
    console.error('❌ paquetes-internacionales/admin:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const buildFields = (body) => {
  const fields = {};
  if (body.nombre !== undefined) fields['Nombre'] = body.nombre;
  if (body.categoria !== undefined) fields['Categoria'] = body.categoria;
  if (body.duracion !== undefined) fields['Duracion'] = body.duracion;
  if (body.origen !== undefined) fields['Origen'] = body.origen;
  if (body.salidas !== undefined) fields['Salidas_2027'] = body.salidas;
  if (body.precioDesde !== undefined) fields['Precio_Desde_Doble_USD'] = Number(body.precioDesde) || 0;
  if (body.precioSencilla !== undefined) fields['Precio_Sencilla_USD'] = body.precioSencilla === '' ? null : Number(body.precioSencilla);
  if (body.precioNino !== undefined) fields['Precio_Nino_USD'] = body.precioNino === '' ? null : Number(body.precioNino);
  if (body.flyerDrive !== undefined) fields['Flyer_Drive'] = body.flyerDrive;
  if (body.imagen !== undefined) fields['Imagen_URL'] = body.imagen;
  if (body.notas !== undefined) fields['Notas_Tarifa'] = body.notas;
  if (body.operador !== undefined) fields['Operador'] = body.operador;
  if (body.estado !== undefined) fields['Estado'] = body.estado;
  if (body.publicado !== undefined) fields['Publicado'] = !!body.publicado;
  return fields;
};

// ── ADMIN: crear ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    if (!key) return res.status(500).json({ error: 'AIRTABLE_API_KEY no configurada' });
    if (!req.body.nombre) return res.status(400).json({ error: 'Falta el nombre del paquete' });

    const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: buildFields(req.body), typecast: true }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      return res.status(r.status).json({ error: `Airtable ${r.status}`, detail: errBody.slice(0, 300) });
    }
    cache = { data: null, ts: 0 }; // invalidar caché público
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: editar ────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    if (!key) return res.status(500).json({ error: 'AIRTABLE_API_KEY no configurada' });

    const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}/${req.params.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: buildFields(req.body), typecast: true }),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      return res.status(r.status).json({ error: `Airtable ${r.status}`, detail: errBody.slice(0, 300) });
    }
    cache = { data: null, ts: 0 };
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: borrar ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
    if (!key) return res.status(500).json({ error: 'AIRTABLE_API_KEY no configurada' });

    const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}/${req.params.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      return res.status(r.status).json({ error: `Airtable ${r.status}`, detail: errBody.slice(0, 300) });
    }
    cache = { data: null, ts: 0 };
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
