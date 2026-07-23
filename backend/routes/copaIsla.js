/**
 * Copa de la Isla — Logística de delegaciones · GuíaSAI
 *
 * Arquitectura (3 capas, tal como el prototipo de Sky):
 *   1. Copa_Tarifas       → catálogo único de precios venta/neto (editable en Torre)
 *   2. Copa_Delegaciones  → una fila por club/equipo, con código de acceso público
 *   3. Copa_Viajeros      → personas de cada delegación
 *
 * Endpoints:
 *   GET   /api/copa/catalogo                          catálogo de tarifas
 *   PUT   /api/copa/catalogo                           actualizar tarifas (Torre)
 *   GET   /api/copa/delegaciones                       listar (admin/torre)
 *   POST  /api/copa/delegaciones                        crear
 *   GET   /api/copa/delegaciones/:id                    detalle + cálculo
 *   PATCH /api/copa/delegaciones/:id                    actualizar / publicar
 *   DELETE /api/copa/delegaciones/:id
 *   GET   /api/copa/delegaciones/:id/viajeros           listar viajeros
 *   POST  /api/copa/delegaciones/:id/viajeros            agregar uno
 *   POST  /api/copa/delegaciones/:id/viajeros/bulk        carga masiva
 *   PATCH /api/copa/viajeros/:id                         editar (estado de pago, etc)
 *   DELETE /api/copa/viajeros/:id
 *   GET   /api/copa/portal/:codigo                       público — solo lectura, solo si Publicado
 *   POST  /api/copa/delegaciones/:id/pago-link             link de pago Wompi (abono 30%)
 */

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const TABLES = {
  TARIFAS: 'tblz1uekwVb41U27q',      // Copa_Tarifas
  DELEGACIONES: 'tblQTPoSr4ggTX3nc', // Copa_Delegaciones
  VIAJEROS: 'tblpxiCyegu9qVUsN',     // Copa_Viajeros
};

const AT = () => {
  const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  return { key, base, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } };
};
const atUrl = (tableId) => { const { base } = AT(); return `https://api.airtable.com/v0/${base}/${tableId}`; };

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusión
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Catálogo de tarifas ────────────────────────────────────────────────────

let cacheTarifas = { data: null, ts: 0 };

async function leerCatalogo() {
  if (cacheTarifas.data && Date.now() - cacheTarifas.ts < 60_000) return cacheTarifas.data;
  const { headers } = AT();
  const r = await fetch(`${atUrl(TABLES.TARIFAS)}?pageSize=50`, { headers });
  if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const catalogo = (d.records || []).map(rec => ({
    id: rec.id,
    servicioId: rec.fields['Servicio_Id'] || '',
    nombre: rec.fields['Nombre'] || '',
    unidad: rec.fields['Unidad'] || 'pax',
    multiplicador: rec.fields['Multiplicador'] || 'unico', // unico | noches | dias
    descripcion: rec.fields['Descripcion'] || '',
    precioVenta: Number(rec.fields['Precio_Venta'] || 0),
    precioNeto: Number(rec.fields['Precio_Neto'] || 0),
    proveedor: rec.fields['Proveedor'] || '',
    activoDefault: !!rec.fields['Activo_Default'],
  }));
  cacheTarifas = { data: catalogo, ts: Date.now() };
  return catalogo;
}

router.get('/catalogo', async (_req, res) => {
  try { res.json(await leerCatalogo()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/catalogo', async (req, res) => {
  const { cambios } = req.body || {}; // [{ id, precioVenta?, precioNeto?, proveedor? }]
  if (!Array.isArray(cambios) || !cambios.length) {
    return res.status(400).json({ error: 'Body esperado: { cambios: [{ id, precioVenta, precioNeto, proveedor }] }' });
  }
  try {
    const { headers } = AT();
    const records = cambios.map(c => {
      const fields = {};
      if (c.precioVenta !== undefined) fields['Precio_Venta'] = Number(c.precioVenta) || 0;
      if (c.precioNeto !== undefined) fields['Precio_Neto'] = Number(c.precioNeto) || 0;
      if (c.proveedor !== undefined) fields['Proveedor'] = String(c.proveedor);
      return { id: c.id, fields };
    });
    for (let i = 0; i < records.length; i += 10) {
      const r = await fetch(atUrl(TABLES.TARIFAS), {
        method: 'PATCH', headers,
        body: JSON.stringify({ records: records.slice(i, i + 10), typecast: true }),
      });
      if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    }
    cacheTarifas = { data: null, ts: 0 };
    res.json({ success: true, actualizadas: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── Catálogo REAL de la plataforma (fuente única de verdad de precios) ────
// Tours: ServiciosTuristicos_SAI · Alojamientos: AlojamientosTuristicos_SAI
// Se reutiliza el mismo patrón que /api/home-config/catalogo-selector.

let cacheCatalogoReal = { data: null, ts: 0 };

async function leerCatalogoReal() {
  if (cacheCatalogoReal.data && Date.now() - cacheCatalogoReal.ts < 60_000) return cacheCatalogoReal.data;
  const { headers } = AT();

  const CAMPOS_TOURS = ['Servicio', 'Nombre alternativo', 'Tipo de Servicio', 'Precio actualizado', 'Precio_GuanaGO', 'Precio Costo', 'ImagenWP', 'Publicado'];
  const CAMPOS_ALOJ  = ['Servicio', 'Nombre alternativo', 'Tipo de Alojamiento', 'Tipo de Servicio', 'Precio actualizado', 'Precio_GuanaGO', 'Precio Costo', 'ImagenWP', 'Publicado'];

  const fetchTabla = async (tabla, campos) => {
    const fieldsQs = campos.map(c => `fields[]=${encodeURIComponent(c)}`).join('&');
    const r = await fetch(`https://api.airtable.com/v0/${AT().base}/${encodeURIComponent(tabla)}?${fieldsQs}&maxRecords=100`, { headers });
    if (!r.ok) { console.warn(`[copa/catalogo-real] ${tabla} ${r.status}`); return []; }
    const d = await r.json();
    return d.records || [];
  };

  const [recsTours, recsAloj] = await Promise.all([
    fetchTabla('ServiciosTuristicos_SAI', CAMPOS_TOURS),
    fetchTabla('AlojamientosTuristicos_SAI', CAMPOS_ALOJ),
  ]);

  const mapItem = (r, tabla) => {
    const f = r.fields;
    const nombre = f['Servicio'] || f['Nombre alternativo'] || '';
    if (!nombre || !f['Publicado']) return null;
    let imagen = '';
    if (f['ImagenWP'] && typeof f['ImagenWP'] === 'string') {
      const u = f['ImagenWP'].split(',')[0].trim();
      if (u.startsWith('http')) imagen = u;
    }
    return {
      id: r.id,
      tabla,
      nombre,
      tipo: f['Tipo de Servicio'] || f['Tipo de Alojamiento'] || (tabla === 'tours' ? 'Tour' : 'Alojamiento'),
      precioVenta: Number(f['Precio actualizado'] || f['Precio_GuanaGO'] || 0),
      precioNeto: Number(f['Precio Costo'] || 0),
      imagen,
    };
  };

  const catalogo = [
    ...recsTours.map(r => mapItem(r, 'tours')),
    ...recsAloj.map(r => mapItem(r, 'alojamientos')),
  ].filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  cacheCatalogoReal = { data: catalogo, ts: Date.now() };
  return catalogo;
}

router.get('/catalogo-real', async (_req, res) => {
  try { res.json(await leerCatalogoReal()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});


// NOTA: catálogo de traslados pendiente — se rediseñará con sistema de
// zonas/mapa (ver AdminTaxiZoneEditor) en vez de tarifa plana. Mientras
// tanto, "Traslados" en el paquete grupal usa Copa_Tarifas (tarifa fija).
// ─── Disponibilidad de alojamientos para grupos del evento ────────────────
// Lee AlojamientosTuristicos_SAI filtrando Disponible_Copa_Isla=true.
// Capacidad estimada = Habitaciones_Disp_Diciembre × capacidad por habitación
// (campo 'Capacidad' existente) — es un estimado para filtrar opciones,
// la confirmación final la hace Sky con cada hotel.

let cacheDisponibilidad = { data: null, ts: 0 };

async function leerDisponibilidadGrupos() {
  if (cacheDisponibilidad.data && Date.now() - cacheDisponibilidad.ts < 60_000) return cacheDisponibilidad.data;
  const { headers, base } = AT();
  const CAMPOS = ['Servicio', 'Nombre alternativo', 'Tipo de Alojamiento', 'Precio actualizado', 'Precio_GuanaGO',
    'ImagenWP', 'Descripcion', 'Capacidad', 'Disponible_Copa_Isla', 'Habitaciones_Disp_Diciembre'];
  const fieldsQs = CAMPOS.map(c => `fields[]=${encodeURIComponent(c)}`).join('&');
  const r = await fetch(`https://api.airtable.com/v0/${base}/AlojamientosTuristicos_SAI?${fieldsQs}&maxRecords=100`, { headers });
  if (!r.ok) { console.warn(`[copa/disponibilidad] ${r.status}: ${await r.text()}`); return []; }
  const d = await r.json();
  const hoteles = (d.records || [])
    .filter(rec => rec.fields['Disponible_Copa_Isla'])
    .map(rec => {
      const f = rec.fields;
      const nombre = f['Servicio'] || f['Nombre alternativo'] || '';
      if (!nombre) return null;
      const habitaciones = Number(f['Habitaciones_Disp_Diciembre'] || 0);
      const capPorHab = Number(f['Capacidad'] || 2) || 2;
      let imagenes = [];
      if (f['ImagenWP'] && typeof f['ImagenWP'] === 'string') {
        imagenes = f['ImagenWP'].split(',').map(u => u.trim()).filter(u => u.startsWith('http'));
      }
      return {
        id: rec.id,
        nombre,
        tipo: f['Tipo de Alojamiento'] || 'Alojamiento',
        precioNoche: Number(f['Precio actualizado'] || f['Precio_GuanaGO'] || 0),
        imagen: imagenes[0] || '',
        imagenes,
        descripcion: (f['Descripcion'] || '').slice(0, 160),
        habitacionesDisponibles: habitaciones,
        capacidadEstimada: habitaciones * capPorHab,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.capacidadEstimada - a.capacidadEstimada);
  cacheDisponibilidad = { data: hoteles, ts: Date.now() };
  return hoteles;
}

// GET /api/copa/disponibilidad?pax=35 — hoteles con capacidad estimada suficiente
router.get('/disponibilidad', async (req, res) => {
  try {
    const pax = Number(req.query.pax) || 0;
    const todos = await leerDisponibilidadGrupos();
    const filtrados = pax > 0 ? todos.filter(h => h.capacidadEstimada >= pax) : todos;
    res.json({ pax, hoteles: filtrados, totalDisponibles: todos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cálculo de cotización de una delegación ───────────────────────────────

function nochesEntre(inn, out) {
  if (!inn || !out) return 0;
  const a = new Date(inn), b = new Date(out);
  const n = Math.round((b - a) / 86_400_000);
  return n > 0 ? n : 0;
}

async function calcularDelegacion(fields, viajerosCount) {
  const catalogo = await leerCatalogo();
  let activos = [];
  try { activos = JSON.parse(fields['Servicios_Activos'] || '[]'); } catch { activos = []; }
  let actividadesIds = [];
  try { actividadesIds = JSON.parse(fields['Actividades_Catalogo'] || '[]'); } catch { actividadesIds = []; }

  const pax = viajerosCount || Number(fields['Meta_Pax']) || 0;
  const noches = nochesEntre(fields['Checkin'], fields['Checkout']);
  const dias = Math.max(noches, 1);

  const lineas = [];
  for (const servicioId of activos) {
    const t = catalogo.find(c => c.servicioId === servicioId);
    if (!t || !t.precioVenta) continue;
    const mult = t.multiplicador === 'noches' ? pax * noches : t.multiplicador === 'dias' ? pax * dias : pax;
    lineas.push({
      servicioId,
      titulo: t.nombre,
      detalle: t.multiplicador === 'noches' ? `${pax} pax × ${noches} noches`
        : t.multiplicador === 'dias' ? `${pax} pax × ${dias} días` : `${pax} pax`,
      unidades: mult,
      valorVenta: mult * t.precioVenta,
      valorNeto: mult * t.precioNeto,
      proveedor: t.proveedor,
      origen: 'grupal',
    });
  }

  // Actividades del catálogo real (tours/alojamientos con tarifa vigente de la plataforma)
  if (actividadesIds.length) {
    const catalogoReal = await leerCatalogoReal();
    for (const id of actividadesIds) {
      const it = catalogoReal.find(c => c.id === id);
      if (!it) continue; // pudo despublicarse — se omite sin romper el cálculo
      lineas.push({
        servicioId: it.id,
        titulo: it.nombre,
        detalle: `${pax} pax`,
        unidades: pax,
        valorVenta: pax * it.precioVenta,
        valorNeto: pax * it.precioNeto,
        proveedor: it.tipo,
        origen: 'catalogo',
      });
    }
  }

  const totalVenta = lineas.reduce((a, l) => a + l.valorVenta, 0);
  const totalNeto = lineas.reduce((a, l) => a + l.valorNeto, 0);

  return {
    pax, noches, lineas,
    total: totalVenta,
    costoNeto: totalNeto,
    margen: totalVenta - totalNeto,
    margenPct: totalVenta ? Math.round((totalVenta - totalNeto) / totalVenta * 100) : 0,
    abono: Math.round(totalVenta * 0.3),
    saldo: totalVenta - Math.round(totalVenta * 0.3),
  };
}

function mapDelegacion(rec) {
  return {
    id: rec.id,
    club: rec.fields['Club'] || '',
    ciudad: rec.fields['Ciudad'] || '',
    coordinador: rec.fields['Coordinador'] || '',
    whatsapp: rec.fields['WhatsApp'] != null ? String(rec.fields['WhatsApp']) : '',
    metaPax: Number(rec.fields['Meta_Pax'] || 0),
    checkin: rec.fields['Checkin'] || '',
    checkout: rec.fields['Checkout'] || '',
    codigoAcceso: rec.fields['Codigo_Acceso'] || '',
    serviciosActivos: (() => { try { return JSON.parse(rec.fields['Servicios_Activos'] || '[]'); } catch { return []; } })(),
    actividadesCatalogo: (() => { try { return JSON.parse(rec.fields['Actividades_Catalogo'] || '[]'); } catch { return []; } })(),
    publicado: String(rec.fields['Publicado'] || '').toLowerCase() === 'true',
    estado: rec.fields['Estado'] || 'Cotizando',
    evento: rec.fields['Evento'] || 'Copa de la Isla',
  };
}

// ─── Delegaciones ───────────────────────────────────────────────────────────

router.get('/delegaciones', async (_req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.DELEGACIONES)}?pageSize=100`, { headers });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const dels = (d.records || []).filter(rec => rec.fields['Club']).map(mapDelegacion);

    // Adjuntar cálculo + conteo de viajeros a cada una (para la Torre)
    const rViaj = await fetch(`${atUrl(TABLES.VIAJEROS)}?pageSize=100`, { headers });
    const dViaj = rViaj.ok ? await rViaj.json() : { records: [] };
    const viajerosPorDelegacion = {};
    (dViaj.records || []).forEach(v => {
      const did = v.fields['Delegacion_Id'];
      (viajerosPorDelegacion[did] = viajerosPorDelegacion[did] || []).push(v);
    });

    const dRaw = (await (await fetch(`${atUrl(TABLES.DELEGACIONES)}?pageSize=100`, { headers })).json()).records || [];
    const conCalculo = await Promise.all(dels.map(async del => {
      const raw = dRaw.find(r => r.id === del.id);
      const viajeros = viajerosPorDelegacion[del.id] || [];
      const calc = await calcularDelegacion(raw.fields, viajeros.length);
      return { ...del, viajerosCount: viajeros.length, ...calc };
    }));

    res.json(conCalculo);
  } catch (err) {
    console.error('❌ copa/delegaciones GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/delegaciones', async (req, res) => {
  const { club, ciudad, coordinador, whatsapp, metaPax, checkin, checkout, evento } = req.body || {};
  if (!club) return res.status(400).json({ error: 'club es requerido' });
  try {
    const { headers } = AT();
    const codigo = generarCodigo();
    const avisos = [];

    const fieldsBase = {
      Club: club, Ciudad: ciudad || '', Coordinador: coordinador || '',
      Meta_Pax: Number(metaPax) || 0, Checkin: checkin || '', Checkout: checkout || '',
      Codigo_Acceso: codigo, Servicios_Activos: JSON.stringify(['alojamiento']),
      Publicado: 'false', Estado: 'Cotizando',
    };

    // Intento 1: con Evento y WhatsApp (los dos campos que pueden fallar
    // por config de Airtable — nombre de campo o formato de número).
    const intentar = async (fields) => {
      const r = await fetch(atUrl(TABLES.DELEGACIONES), {
        method: 'POST', headers, body: JSON.stringify({ fields, typecast: true }),
      });
      const texto = await r.text();
      if (!r.ok) { const err = new Error(texto); err.status = r.status; throw err; }
      return JSON.parse(texto);
    };

    let fields = { ...fieldsBase, Evento: evento || 'Copa de la Isla' };
    const whatsappNum = whatsapp ? Number(String(whatsapp).replace(/\D/g, '')) : 0;
    if (whatsappNum) fields.WhatsApp = whatsappNum;

    let rec;
    try {
      rec = await intentar(fields);
    } catch (e1) {
      // Reintentar quitando el campo que Airtable rechazó, uno a la vez
      if (/Evento/i.test(e1.message)) {
        avisos.push('El campo "Evento" no existe (o tiene otro nombre) en Copa_Delegaciones — la delegación se creó sin torneo asignado. Revisa el nombre exacto del campo en Airtable.');
        delete fields.Evento;
        try { rec = await intentar(fields); }
        catch (e2) {
          if (/WhatsApp/i.test(e2.message)) { delete fields.WhatsApp; avisos.push('El campo "WhatsApp" rechazó el número — se creó sin WhatsApp.'); rec = await intentar(fields); }
          else throw e2;
        }
      } else if (/WhatsApp/i.test(e1.message)) {
        avisos.push('El campo "WhatsApp" rechazó el número — se creó sin WhatsApp. Revisa el tipo de campo en Airtable (debe ser Number).');
        delete fields.WhatsApp;
        rec = await intentar(fields);
      } else {
        throw e1;
      }
    }

    res.json({ ...mapDelegacion(rec), avisos });
  } catch (err) {
    console.error('❌ copa/delegaciones POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/delegaciones/:id', async (req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.DELEGACIONES)}/${req.params.id}`, { headers });
    if (!r.ok) return res.status(404).json({ error: 'Delegación no encontrada' });
    const rec = await r.json();

    const rv = await fetch(`${atUrl(TABLES.VIAJEROS)}?filterByFormula=${encodeURIComponent(`{Delegacion_Id}='${req.params.id}'`)}&pageSize=100`, { headers });
    const dv = rv.ok ? await rv.json() : { records: [] };
    const viajeros = (dv.records || []).map(mapViajero);

    const calc = await calcularDelegacion(rec.fields, viajeros.length);
    res.json({ ...mapDelegacion(rec), viajeros, ...calc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/delegaciones/:id', async (req, res) => {
  const b = req.body || {};
  try {
    const { headers } = AT();
    const fields = {};
    if (b.club !== undefined) fields.Club = b.club;
    if (b.ciudad !== undefined) fields.Ciudad = b.ciudad;
    if (b.coordinador !== undefined) fields.Coordinador = b.coordinador;
    if (b.whatsapp !== undefined) fields.WhatsApp = Number(String(b.whatsapp).replace(/\D/g, '')) || 0;
    if (b.metaPax !== undefined) fields.Meta_Pax = Number(b.metaPax) || 0;
    if (b.checkin !== undefined) fields.Checkin = b.checkin;
    if (b.checkout !== undefined) fields.Checkout = b.checkout;
    if (b.serviciosActivos !== undefined) fields.Servicios_Activos = JSON.stringify(b.serviciosActivos);
    if (b.actividadesCatalogo !== undefined) fields.Actividades_Catalogo = JSON.stringify(b.actividadesCatalogo);
    if (b.publicado !== undefined) fields.Publicado = b.publicado ? 'true' : 'false';
    if (b.estado !== undefined) fields.Estado = b.estado;
    if (b.evento !== undefined) fields.Evento = b.evento;

    const intentar = async (f) => {
      const r = await fetch(`${atUrl(TABLES.DELEGACIONES)}/${req.params.id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ fields: f, typecast: true }),
      });
      const texto = await r.text();
      if (!r.ok) { const err = new Error(texto); throw err; }
      return JSON.parse(texto);
    };

    let rec, aviso;
    try {
      rec = await intentar(fields);
    } catch (e1) {
      // Si el campo Actividades_Catalogo aún no existe en Airtable, guardamos
      // el resto de cambios igual y avisamos, en vez de perder todo el PATCH.
      if (/Actividades_Catalogo/i.test(e1.message)) {
        const { Actividades_Catalogo, ...resto } = fields;
        aviso = 'El campo "Actividades_Catalogo" no existe todavía en Airtable — créalo (Long text) para poder guardar actividades del catálogo.';
        rec = await intentar(resto);
      } else if (/Evento/i.test(e1.message)) {
        const { Evento, ...resto } = fields;
        aviso = 'El campo "Evento" no existe todavía en Airtable.';
        rec = await intentar(resto);
      } else {
        throw e1;
      }
    }
    res.json({ ...mapDelegacion(rec), aviso });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delegaciones/:id', async (req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.DELEGACIONES)}/${req.params.id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new Error(`Airtable ${r.status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Viajeros ───────────────────────────────────────────────────────────────

function mapViajero(rec) {
  return {
    id: rec.id,
    delegacionId: rec.fields['Delegacion_Id'] || '',
    nombre: rec.fields['Nombre'] || '',
    documento: rec.fields['Documento'] != null ? String(rec.fields['Documento']) : '',
    telefono: rec.fields['Telefono'] != null ? String(rec.fields['Telefono']) : '',
    subgrupo: rec.fields['Subgrupo'] || 'Sin subgrupo',
    rol: rec.fields['Rol'] || 'Jugador',
    estadoPago: rec.fields['Estado_Pago'] || 'Pendiente',
  };
}

router.get('/delegaciones/:id/viajeros', async (req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.VIAJEROS)}?filterByFormula=${encodeURIComponent(`{Delegacion_Id}='${req.params.id}'`)}&pageSize=100`, { headers });
    if (!r.ok) throw new Error(`Airtable ${r.status}`);
    const d = await r.json();
    res.json((d.records || []).map(mapViajero));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delegaciones/:id/viajeros', async (req, res) => {
  const { nombre, documento, telefono, subgrupo, rol } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const { headers } = AT();
    const fields = {
      Delegacion_Id: req.params.id, Nombre: nombre,
      Subgrupo: subgrupo || 'Sin subgrupo', Rol: rol || 'Jugador', Estado_Pago: 'Pendiente',
    };
    if (documento) fields.Documento = Number(String(documento).replace(/\D/g, '')) || undefined;
    if (telefono) fields.Telefono = Number(String(telefono).replace(/\D/g, '')) || undefined;
    const r = await fetch(atUrl(TABLES.VIAJEROS), {
      method: 'POST', headers, body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    const rec = await r.json();
    res.json(mapViajero(rec));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delegaciones/:id/viajeros/bulk', async (req, res) => {
  const { lineas, subgrupo } = req.body || {}; // lineas: ["Nombre; doc; tel", ...]
  if (!Array.isArray(lineas) || !lineas.length) return res.status(400).json({ error: 'lineas requerido (array de texto)' });
  try {
    const { headers } = AT();
    const registros = lineas.map(l => {
      const [nombre, doc, tel] = String(l).split(/[;,\t]/).map(x => (x || '').trim());
      if (!nombre) return null;
      const fields = { Delegacion_Id: req.params.id, Nombre: nombre, Subgrupo: subgrupo || 'Sin subgrupo', Rol: 'Jugador', Estado_Pago: 'Pendiente' };
      if (doc) fields.Documento = Number(doc.replace(/\D/g, '')) || undefined;
      if (tel) fields.Telefono = Number(tel.replace(/\D/g, '')) || undefined;
      return { fields };
    }).filter(Boolean);

    let creados = 0;
    for (let i = 0; i < registros.length; i += 10) {
      const r = await fetch(atUrl(TABLES.VIAJEROS), {
        method: 'POST', headers,
        body: JSON.stringify({ records: registros.slice(i, i + 10), typecast: true }),
      });
      if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
      const d = await r.json();
      creados += (d.records || []).length;
    }
    res.json({ success: true, creados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/viajeros/:id', async (req, res) => {
  const b = req.body || {};
  try {
    const { headers } = AT();
    const fields = {};
    if (b.nombre !== undefined) fields.Nombre = b.nombre;
    if (b.documento !== undefined) fields.Documento = Number(String(b.documento).replace(/\D/g, '')) || undefined;
    if (b.telefono !== undefined) fields.Telefono = Number(String(b.telefono).replace(/\D/g, '')) || undefined;
    if (b.subgrupo !== undefined) fields.Subgrupo = b.subgrupo;
    if (b.rol !== undefined) fields.Rol = b.rol;
    if (b.estadoPago !== undefined) fields.Estado_Pago = b.estadoPago;

    const r = await fetch(`${atUrl(TABLES.VIAJEROS)}/${req.params.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    const rec = await r.json();
    res.json(mapViajero(rec));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/viajeros/:id', async (req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.VIAJEROS)}/${req.params.id}`, { method: 'DELETE', headers });
    if (!r.ok) throw new Error(`Airtable ${r.status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Portal público del coordinador (solo lectura, por código) ─────────────

router.get('/portal/:codigo', async (req, res) => {
  try {
    const { headers } = AT();
    const codigo = String(req.params.codigo || '').trim().toUpperCase();
    if (!codigo) return res.status(400).json({ error: 'Código requerido' });

    const rd = await fetch(`${atUrl(TABLES.DELEGACIONES)}?filterByFormula=${encodeURIComponent(`{Codigo_Acceso}='${codigo}'`)}&maxRecords=1`, { headers });
    const dd = await rd.json();
    const rec = (dd.records || [])[0];
    if (!rec) return res.status(404).json({ error: 'Código no encontrado' });

    const del = mapDelegacion(rec);
    if (!del.publicado) return res.status(403).json({ error: 'Esta delegación aún no ha sido publicada por GuíaSAI' });

    const rv = await fetch(`${atUrl(TABLES.VIAJEROS)}?filterByFormula=${encodeURIComponent(`{Delegacion_Id}='${rec.id}'`)}&pageSize=100`, { headers });
    const dv = rv.ok ? await rv.json() : { records: [] };
    const viajerosRaw = (dv.records || []).map(mapViajero);

    const calc = await calcularDelegacion(rec.fields, viajerosRaw.length);

    // Enmascarar documentos para el portal público
    const viajeros = viajerosRaw.map(v => ({
      nombre: v.nombre,
      doc: v.documento ? '••••' + v.documento.slice(-4) : '',
      rol: v.rol,
      sub: v.subgrupo,
      datos: !!(v.nombre && v.documento && v.telefono),
      pago: v.estadoPago === 'Pago total' ? 'pago' : v.estadoPago === 'Abono' ? 'abono' : 'pend',
    }));

    const inscritos = viajeros.length;
    const completos = viajeros.filter(v => v.datos).length;
    const abonados = viajeros.filter(v => v.pago !== 'pend').length;

    res.json({
      actualizado: new Date().toISOString(),
      evento: del.evento,
      delegacion: {
        club: del.club, ciudad: del.ciudad, lider: del.coordinador,
        meta: del.metaPax, inn: del.checkin, out: del.checkout,
      },
      pax: calc.pax, noches: calc.noches,
      inscritos, completos, abonados,
      total: calc.total, abono: calc.abono, saldo: calc.saldo,
      servicios: calc.lineas.map(l => ({ id: l.servicioId, titulo: l.titulo, detalle: l.detalle, valor: l.valorVenta, origen: l.origen })),
      personas: viajeros,
    });
  } catch (err) {
    console.error('❌ copa/portal:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Link de pago Wompi — abono 30% ─────────────────────────────────────────

function sha256(str) { return crypto.createHash('sha256').update(str).digest('hex'); }

router.post('/delegaciones/:id/pago-link', async (req, res) => {
  try {
    const { headers } = AT();
    const r = await fetch(`${atUrl(TABLES.DELEGACIONES)}/${req.params.id}`, { headers });
    if (!r.ok) return res.status(404).json({ error: 'Delegación no encontrada' });
    const rec = await r.json();
    const del = mapDelegacion(rec);

    const rv = await fetch(`${atUrl(TABLES.VIAJEROS)}?filterByFormula=${encodeURIComponent(`{Delegacion_Id}='${rec.id}'`)}&pageSize=100`, { headers });
    const dv = rv.ok ? await rv.json() : { records: [] };
    const calc = await calcularDelegacion(rec.fields, (dv.records || []).length);

    if (!calc.abono) return res.status(400).json({ error: 'La delegación no tiene servicios activos con valor — nada que cobrar' });

    const publicKey = (process.env.WOMPI_PUBLIC_KEY || '').trim();
    const integritySecret = (process.env.WOMPI_INTEGRITY_SECRET || '').trim();
    if (!publicKey || !integritySecret) return res.status(503).json({ error: 'Wompi no configurado en el servidor' });

    const BACKEND_URL = (process.env.BACKEND_URL || process.env.BASE_URL || 'https://app.guiasanandresislas.com').trim().replace(/\/$/, '');
    const referenceCode = `COPA-${rec.id}-${Date.now()}`;
    const amountInCents = calc.abono * 100;
    const integrity = sha256(`${referenceCode}${amountInCents}COP${integritySecret}`);

    const params = new URLSearchParams({
      'public-key': publicKey, currency: 'COP', 'amount-in-cents': String(amountInCents),
      reference: referenceCode, 'signature:integrity': integrity,
      'redirect-url': `${BACKEND_URL}/pago-resultado`,
    });
    if (del.coordinador) params.set('customer-data:full-name', del.coordinador);
    if (del.whatsapp) {
      params.set('customer-data:phone-number', del.whatsapp.replace(/^57/, ''));
      params.set('customer-data:phone-number-prefix', '+57');
    }

    const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

    res.json({
      success: true,
      checkoutUrl,
      referenceCode,
      abono: calc.abono,
      whatsappTexto: `Hola ${del.coordinador || ''} 👋 Este es el link para el abono del 30% de ${del.club} — Copa de la Isla:\n\n${checkoutUrl}\n\nMonto: $${calc.abono.toLocaleString('es-CO')} COP\n\n¡Pago 100% seguro con Wompi! 🔒`,
    });
  } catch (err) {
    console.error('❌ copa/pago-link:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
