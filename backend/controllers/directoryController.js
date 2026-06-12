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

/** Genera un slug URL-safe desde el nombre comercial (fallback si ID_Slug está vacío) */
function generarSlug(nombre) {
  return (nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // eliminar tildes
    .replace(/[^a-z0-9\s-]/g, '')     // solo alfanumérico
    .trim()
    .replace(/\s+/g, '-');            // espacios → guión
}

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

  const name = f.Nombre ?? f.Name ?? '';

  return {
    id:          r.id,
    slug:        f.ID_Slug      ?? f.Slug        ?? generarSlug(name),
    whatsapp:    f.WhatsApp     ?? f.Whatsapp    ?? '',
    raizal:      f.Raizal_Owned === true || f.Raizal === true,
    name:        f.Nombre       ?? f.Name        ?? '',
    category:    f.Categoria    ?? f.Category    ?? 'General',
    latitude:    lat,
    longitude:   lng,
    lat,
    lng,
    address:     f.Direccion    ?? f.Address     ?? '',
    phone:       f.Telefono     ?? f.Phone       ?? '',
    email:       f.Email        ?? f.Correo      ?? '',
    hours:       f.Horario      ?? f.Hours       ?? '',
    description: f.Descripcion  ?? f.Description ?? '',
    website:     f.Website      ?? '',
    rating:      Number(f.Rating ?? f.Calificacion ?? 0),
    image,
    price:       Number(f.Precio ?? f.Price ?? 0),
    featured:    f.Destacado    === true || f.Featured === true,
    estado:      f.Estado       ?? f.Estado_Aliado ?? 'activo',
    plan:        f.Plan         ?? f.Membresia   ?? '',
    rnt:         f.RNT          ?? '',
    responsable: f.Responsable  ?? f.Contacto    ?? '',
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

    const { category, search, featured, email, estado } = req.query;
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

    if (email) {
      result = result.filter(p => p.email?.toLowerCase() === email.toLowerCase());
    }

    if (estado) {
      result = result.filter(p => (p.estado ?? '').toLowerCase() === estado.toLowerCase());
    }

    res.json({ success: true, data: result, total: result.length, source });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/directory/slug/:slug ─────────────────────────────────────────────
// Busca un negocio por su slug (ID_Slug en Airtable o generado desde el nombre).
// Usado por los micrositios públicos /aliado/:slug

export const getPlaceBySlug = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const slug = (req.params.slug || '').toLowerCase();
    const { data } = await getAll(apiKey, baseId);
    const place = data.find(p => p.slug === slug);

    if (!place) {
      return res.status(404).json({ success: false, error: 'Aliado no encontrado' });
    }

    res.json({ success: true, data: place });
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

// ── POST /api/directory — crear nuevo negocio ─────────────────────────────────

export const createPlace = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const { name, category, address, phone, email, description, website, hours, estado, plan, rnt, responsable } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'El campo "name" es requerido' });
    }

    const fields = {
      Nombre:      name,
      Categoria:   category    || 'General',
      Direccion:   address     || '',
      Telefono:    phone       || '',
      Email:       email       || '',
      Descripcion: description || '',
      Website:     website     || '',
      Horario:     hours       || '',
      Estado:      estado      || 'activo',
      Plan:        plan        || '',
      RNT:         rnt         || '',
      Responsable: responsable || '',
    };

    const atRes = await fetch(`${AT_URL}/${baseId}/${encodeURIComponent(TABLE)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }] }),
      signal: AbortSignal.timeout(10000),
    });

    if (!atRes.ok) {
      const err = await atRes.text().catch(() => '');
      return res.status(502).json({ success: false, error: `Airtable ${atRes.status}`, detail: err.slice(0, 200) });
    }

    const data = await atRes.json();
    const newRecord = data.records?.[0];

    // Invalidar cache para que el próximo GET traiga los datos frescos
    memCache = { data: null, ts: 0 };

    res.status(201).json({ success: true, data: newRecord ? normalizeRecord(newRecord) : null });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/directory/:id — actualizar negocio ────────────────────────────

export const updatePlace = async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    const { id } = req.params;
    const { name, category, address, phone, email, description, website, hours, estado, plan, rnt, responsable } = req.body;

    const fields = {};
    if (name        !== undefined) fields.Nombre      = name;
    if (category    !== undefined) fields.Categoria   = category;
    if (address     !== undefined) fields.Direccion   = address;
    if (phone       !== undefined) fields.Telefono    = phone;
    if (email       !== undefined) fields.Email       = email;
    if (description !== undefined) fields.Descripcion = description;
    if (website     !== undefined) fields.Website     = website;
    if (hours       !== undefined) fields.Horario     = hours;
    if (estado      !== undefined) fields.Estado      = estado;
    if (plan        !== undefined) fields.Plan        = plan;
    if (rnt         !== undefined) fields.RNT         = rnt;
    if (responsable !== undefined) fields.Responsable = responsable;

    const atRes = await fetch(`${AT_URL}/${baseId}/${encodeURIComponent(TABLE)}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      signal: AbortSignal.timeout(10000),
    });

    if (atRes.status === 404) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
    }
    if (!atRes.ok) {
      const err = await atRes.text().catch(() => '');
      return res.status(502).json({ success: false, error: `Airtable ${atRes.status}`, detail: err.slice(0, 200) });
    }

    const record = await atRes.json();

    // Invalidar cache
    memCache = { data: null, ts: 0 };

    res.json({ success: true, data: normalizeRecord(record) });
  } catch (err) {
    next(err);
  }
};
