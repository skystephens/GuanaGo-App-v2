/**
 * directoryController.js — GuanaGO Directory/Map
 *
 * GET /api/directory        → lista completa, con filtros opcionales ?category=&search=
 * GET /api/directory/:id    → punto individual por Airtable record ID
 *
 * Fuente: tabla Directorio_Mapa en Airtable (base appiReH55Qhrbv4Lk)
 */

import { config } from '../config.js';

const AT_URL = 'https://api.airtable.com/v0';
const TABLE  = 'Directorio_Mapa';
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 min (por debajo del TTL de URLs firmadas de Airtable)

// Cache en memoria para no saturar Airtable en cada request
let memCache = { data: null, ts: 0 };

/** Normaliza un record de Airtable al shape que espera el frontend */
function normalizeRecord(r) {
  const f = r.fields ?? {};
  const lat  = parseFloat(f.Latitud  ?? f.lat  ?? f.Latitude  ?? 0);
  const lng  = parseFloat(f.Longitud ?? f.lng  ?? f.Longitude ?? 0);

  // Imagen: puede ser attachment array o URL string
  let image = '';
  if (Array.isArray(f.Imagen) && f.Imagen[0]?.url) image = f.Imagen[0].url;
  else if (typeof f.Imagen === 'string') image = f.Imagen;
  else if (Array.isArray(f.Foto) && f.Foto[0]?.url) image = f.Foto[0].url;

  return {
    id:          r.id,
    name:        f.Nombre       ?? f.Name        ?? '',
    category:    f.Categoria    ?? f.Category    ?? 'General',
    latitude:    lat,
    longitude:   lng,
    // aliases que usa el frontend (DirectoryMapbox.tsx usa lat/lng y también latitude/longitude)
    lat,
    lng,
    address:     f.Direccion    ?? f.Address     ?? '',
    phone:       f.Telefono     ?? f.Phone       ?? '',
    hours:       f.Horario      ?? f.Hours       ?? '',
    description: f.Descripcion  ?? f.Description ?? '',
    website:     f.Website      ?? '',
    rating:      Number(f.Rating ?? f.Calificacion ?? 0),
    image,
    price:       Number(f.Precio ?? f.Price ?? 0),
    featured:    f.Destacado    === true || f.Featured === true,
  };
}

/** Fetch de todos los records de Directorio_Mapa con paginación */
async function fetchFromAirtable(apiKey, baseId) {
  const records = [];
  let offset = '';

  do {
    const url = new URL(`${AT_URL}/${baseId}/${encodeURIComponent(TABLE)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Airtable ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset ?? '';
  } while (offset);

  return records;
}

/** Obtiene los datos con cache en memoria */
async function getAll(apiKey, baseId) {
  if (memCache.data && Date.now() - memCache.ts < CACHE_TTL_MS) {
    return { data: memCache.data, source: 'cache' };
  }

  const records = await fetchFromAirtable(apiKey, baseId);
  const normalized = records
    .filter(r => r.fields?.Nombre || r.fields?.Name) // descartar filas vacías
    .map(normalizeRecord);

  memCache = { data: normalized, ts: Date.now() };
  return { data: normalized, source: 'airtable' };
}

// ── GET /api/directory ────────────────────────────────────────────────────────

export const getDirectory = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const { category, search, featured } = req.query;
    const { data, source } = await getAll(apiKey, baseId);

    let result = data;

    if (category && category !== 'Todos') {
      result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
      );
    }

    if (featured === 'true') {
      result = result.filter(p => p.featured);
    }

    res.json({ success: true, data: result, total: result.length, source });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/directory/:id ────────────────────────────────────────────────────

export const getPlaceById = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const { id } = req.params;

    // Intentar desde cache primero
    if (memCache.data) {
      const cached = memCache.data.find(p => p.id === id);
      if (cached) return res.json({ success: true, data: cached, source: 'cache' });
    }

    // Fetch directo del record
    const url = `${AT_URL}/${baseId}/${encodeURIComponent(TABLE)}/${id}`;
    const atRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (atRes.status === 404) {
      return res.status(404).json({ success: false, error: 'Lugar no encontrado' });
    }
    if (!atRes.ok) {
      const errText = await atRes.text().catch(() => '');
      return res.status(502).json({ success: false, error: `Airtable ${atRes.status}`, detail: errText.slice(0, 200) });
    }

    const record = await atRes.json();
    res.json({ success: true, data: normalizeRecord(record), source: 'airtable' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/directory/categories ────────────────────────────────────────────
// Devuelve las categorías únicas que existen en la tabla

export const getCategories = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const { data } = await getAll(apiKey, baseId);
    const cats = [...new Set(data.map(p => p.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );

    res.json({ success: true, data: cats });
  } catch (err) {
    next(err);
  }
};
