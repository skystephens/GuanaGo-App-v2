/**
 * Home Config — contenido editable del Home GuiaSAI (estilo WordPress)
 *
 * GET /api/home-config  → devuelve la config fusionada (Airtable Home_Config + defaults)
 * PUT /api/home-config  → guarda cambios (upsert por Clave en Home_Config)
 *
 * Tabla Airtable: "Home_Config" con campos: Clave (texto único), Valor (texto largo)
 * Si la tabla no existe todavía, GET responde con los defaults y PUT devuelve
 * instrucciones claras — el Home nunca se rompe.
 */

import express from 'express';

const router = express.Router();
const TABLE = 'Home_Config';

const AT = () => {
  const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  return { key, url: `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}` };
};

// ── Defaults (el Home funciona aunque la tabla no exista) ─────────────────────
export const HOME_DEFAULTS = {
  hero_kriol:    'Wi da piipl fram di sii — somos gente del mar',
  hero_titulo:   'El Caribe que|se vive en Kriol',
  hero_sub:      'Tours, alojamientos y experiencias auténticas en San Andrés, Providencia y Santa Catalina — operados por gente de la isla, con reserva y pago seguros.',
  hero_imagenes: [
    'https://guiasanandresislas.com/wp-content/uploads/2024/12/2.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2026/02/johnny-cay-2.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2024/12/jhony-cay4.jpg',
  ].join(', '),
  bandera:        'verde',
  bandera_texto:  'Reporte diario de la Capitanía de Puerto · Si el mar descansa, la cultura te recibe: reprogramación garantizada o plan cultural en tierra para toda reserva paga.',
  whatsapp:       '573153836043',
  raizal_kriol:   '"Laiv stieg, laiv di kolcha"',
  raizal_texto_1: 'En GuiaSAI el viaje empieza por la cultura: tejido en palma de coco con maestras artesanas, sopa de cangrejo cocinada al fogón, Rondón con música en vivo y las historias que solo se cuentan en Kriol.',
  raizal_texto_2: 'Cada experiencia con el sello Ruta Raizal apoya directamente a las familias y tradiciones del archipiélago. Viajas, y la isla también gana.',
  raizal_imagen:  'https://guiasanandresislas.com/wp-content/uploads/2024/12/crab1.jpg',
  grupos_titulo:  '¿Vienen en grupo a la isla?',
  grupos_texto:   'Hospedaje, traslados, alimentación y experiencias para delegaciones completas — como los equipos de la Copa de la Isla 2026. Cotización a la medida en menos de 24 horas.',
  experiencias:   JSON.stringify([
    { nombre: 'Johnny Cay Directo', precio: 85000, unidad: 'por persona', tag: 'Cayos', meta: '4 horas · salida 9:00 AM · todos los días', img: 'https://guiasanandresislas.com/wp-content/uploads/2024/12/jhony-cay4.jpg' },
    { nombre: 'Crab Soup Cooking Experience', precio: 250000, unidad: 'por persona', tag: 'Ruta Raizal', meta: '5 horas · cocina tradicional Kriol frente al mar', img: 'https://guiasanandresislas.com/wp-content/uploads/2024/12/crab1.jpg' },
    { nombre: 'Atardecer Isleño en Pontón', precio: 150000, unidad: 'por persona', tag: 'Atardecer', meta: '2 horas · sunset party en el mar de 7 colores', img: 'https://guiasanandresislas.com/wp-content/uploads/2026/03/paddle-noc-co-6.jpg' },
    { nombre: 'Paddleboard Nocturno con Luces', precio: 220000, unidad: 'por persona', tag: 'Nocturno', meta: '3 horas · incluye transporte desde tu hotel', img: 'https://guiasanandresislas.com/wp-content/uploads/2026/03/paddle-noc-co-11-scaled.jpeg' },
    { nombre: 'Alquiler de Jetski (30 min)', precio: 250000, unidad: 'por equipo', tag: 'Adrenalina', meta: 'Master class incluida · zona norte', img: 'https://guiasanandresislas.com/wp-content/uploads/2026/02/jetski-17.jpg' },
  ], null, 0),
};

const TABLE_ID_HOME_CONFIG = 'tblQmeIYaFwPp2n3r'; // Home_Config
let cache = { data: null, ts: 0 };
const CACHE_MS = 60_000;

async function leerConfigAirtable() {
  const { key, url } = AT();
  if (!key) return {};
  const res = await fetch(`${url}?pageSize=100`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
  const data = await res.json();
  const map = {};
  (data.records || []).forEach(r => {
    if (r.fields?.Clave) map[r.fields.Clave] = { valor: r.fields.Valor ?? '', id: r.id };
  });
  return map;
}

// GET — config fusionada
router.get('/', async (_req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) return res.json(cache.data);
    let remoto = {};
    try { remoto = await leerConfigAirtable(); }
    catch (e) { console.warn('⚠️ Home_Config no disponible, usando defaults:', e.message); }
    const merged = { ...HOME_DEFAULTS };
    Object.entries(remoto).forEach(([k, v]) => { if (v.valor !== '') merged[k] = v.valor; });
    cache = { data: merged, ts: Date.now() };
    res.json(merged);
  } catch (err) {
    res.json(HOME_DEFAULTS);
  }
});

// PUT — upsert por Clave { cambios: { clave: valor, ... } }
router.put('/', async (req, res) => {
  const cambios = req.body?.cambios;
  if (!cambios || typeof cambios !== 'object') {
    return res.status(400).json({ error: 'Body esperado: { cambios: { clave: valor } }' });
  }
  const { key, url } = AT();
  if (!key) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  try {
    const existentes = await leerConfigAirtable();
    const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    const aCrear = [];
    const aActualizar = [];

    for (const [clave, valor] of Object.entries(cambios)) {
      if (!(clave in HOME_DEFAULTS)) continue; // solo claves conocidas
      const val = String(valor ?? '');
      if (existentes[clave]) aActualizar.push({ id: existentes[clave].id, fields: { Valor: val } });
      else aCrear.push({ fields: { Clave: clave, Valor: val } });
    }

    // Airtable acepta lotes de 10
    for (let i = 0; i < aActualizar.length; i += 10) {
      const r = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ records: aActualizar.slice(i, i + 10) }) });
      if (!r.ok) throw new Error(`PATCH ${r.status}: ${await r.text()}`);
    }
    for (let i = 0; i < aCrear.length; i += 10) {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ records: aCrear.slice(i, i + 10) }) });
      if (!r.ok) throw new Error(`POST ${r.status}: ${await r.text()}`);
    }

    cache = { data: null, ts: 0 }; // invalidar caché
    console.log(`✅ Home_Config actualizado: ${Object.keys(cambios).join(', ')}`);
    res.json({ success: true, actualizadas: aActualizar.length, creadas: aCrear.length });
  } catch (err) {
    console.error('❌ Home_Config PUT:', err.message);
    const esTabla = /404|NOT_FOUND|TABLE_NOT_FOUND/i.test(err.message);
    res.status(500).json({
      error: esTabla
        ? 'La tabla Home_Config no existe en Airtable. Créala con campos: Clave (texto), Valor (texto largo).'
        : `Error guardando: ${err.message}`,
    });
  }
});


// ── GET /api/home-config/catalogo-selector ────────────────────────────────────
// Devuelve servicios y alojamientos para el selector visual del Editor del Home.
// Usa los mismos nombres de campo que airtableService.getServices() en el front.
router.get('/catalogo-selector', async (_req, res) => {
  try {
    const { key, base } = AT();
    if (!key) return res.json([]);
    const headers = { Authorization: `Bearer ${key}` };

    const fetchTabla = async (tabla, filtro = '') => {
      const qs = filtro ? `?filterByFormula=${encodeURIComponent(filtro)}&maxRecords=100` : '?maxRecords=100';
      const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tabla)}${qs}`, { headers });
      if (!r.ok) { console.warn(`[catalogo-selector] ${tabla} ${r.status}`); return []; }
      const d = await r.json();
      return d.records || [];
    };

    const extraerImagen = (f) => {
      // Prioridad: ImagenWP (URL WordPress, no expira) > Imagenurl (adjunto Airtable)
      if (f['ImagenWP'] && typeof f['ImagenWP'] === 'string') {
        const url = f['ImagenWP'].split(',')[0].trim();
        if (url.startsWith('http')) return url;
      }
      const adjunto = f['Imagenurl'] || f['imagenurl'] || f['ImagenUrl'];
      if (Array.isArray(adjunto) && adjunto[0]?.url) return adjunto[0].url;
      if (Array.isArray(adjunto) && adjunto[0]?.thumbnails?.large?.url) return adjunto[0].thumbnails.large.url;
      return '';
    };

    const [recsTours, recsAloj] = await Promise.all([
      fetchTabla('ServiciosTuristicos_SAI'),
      fetchTabla('AlojamientosTuristicos_SAI'),
    ]);

    const tours = recsTours
      .filter(r => (r.fields['Servicio'] || r.fields['Nombre']) && r.fields['Publicado'])
      .map(r => ({
        id: r.id,
        tabla: 'tours',
        nombre: r.fields['Servicio'] || r.fields['Nombre'] || '',
        tipo: r.fields['Tipo de Servicio'] || 'Tour',
        precio: Number(r.fields['Precio_GuanaGO'] || r.fields['Precio actualizado'] || 0),
        imagen: extraerImagen(r.fields),
        descripcion: (r.fields['Descripcion'] || '').slice(0, 80),
        destacado: !!r.fields['Destacado'],
      }));

    const aloj = recsAloj
      .filter(r => (r.fields['Servicio'] || r.fields['Nombre']) && r.fields['Publicado'])
      .map(r => ({
        id: r.id,
        tabla: 'alojamientos',
        nombre: r.fields['Servicio'] || r.fields['Nombre'] || '',
        tipo: r.fields['Tipo de Alojamiento'] || r.fields['Tipo de Servicio'] || 'Alojamiento',
        precio: Number(r.fields['Precio_GuanaGO'] || r.fields['Precio 2 Huespedes'] || r.fields['Precio actualizado'] || 0),
        imagen: extraerImagen(r.fields),
        descripcion: (r.fields['Descripcion'] || '').slice(0, 80),
        destacado: !!r.fields['Destacado'],
      }));

    const todo = [...tours, ...aloj]
      .filter(it => it.nombre)
      .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || a.nombre.localeCompare(b.nombre, 'es'));

    console.log(`✅ catalogo-selector: ${tours.length} tours + ${aloj.length} aloj`);
    res.json(todo);
  } catch (err) {
    console.error('❌ catalogo-selector:', err.message);
    res.json([]);
  }
});

export default router;
