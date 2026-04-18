/**
 * routes/cowork.js — GuanaGO Cowork B2B
 *
 * GET  /api/cowork/catalogo-b2b   → Catálogo con precios netos para OTAs
 */

import express from 'express';
import { config } from '../config.js';

const router = express.Router();
const AT_URL = 'https://api.airtable.com/v0';
const TURCOM_MARKUP    = 1.23;   // tur.com cobra 23%
const CIVITATIS_MARKUP = 1.25;   // Civitatis cobra 25%

const GRUPO_DESCUENTOS = [
  { min: 150, max: Infinity, pct: 20 },
  { min: 100, max: 149,      pct: 15 },
  { min: 50,  max: 99,       pct: 10 },
  { min: 1,   max: 49,       pct: 0  },
];

function descuentoPct(pax) {
  return (GRUPO_DESCUENTOS.find(d => pax >= d.min && pax <= d.max) || { pct: 0 }).pct;
}

// ── GET /api/cowork/catalogo-b2b ──────────────────────────────────────────────

router.get('/catalogo-b2b', async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    // Sin filtro de campos ni sort de Airtable — sort se hace en JS
    const url = `${AT_URL}/${baseId}/ServiciosTuristicos_SAI?maxRecords=100`;

    const atRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!atRes.ok) {
      const errText = await atRes.text().catch(() => '');
      console.error(`[cowork] Airtable ${atRes.status}:`, errText.slice(0, 300));
      return res.status(502).json({
        success: false,
        error: `Airtable error ${atRes.status}`,
        detail: errText.slice(0, 200),
      });
    }

    const data = await atRes.json();

    const servicios = (data.records || [])
      .filter(r => r.fields?.Servicio && r.fields?.['Precio actualizado'])
      .map(r => {
        const precioNeto = Number(r.fields['Precio actualizado']) || 0;
        return {
          id:          r.id,
          nombre:      r.fields['Servicio']           || '',
          tipo:        r.fields['Tipo de Servicio']   || '',
          capacidad:   r.fields['Capacidad']          || null,
          descripcion: r.fields['Descripcion']        || '',
          precioNeto,
          precioOTA_turcom:    Math.round(precioNeto * TURCOM_MARKUP),
          precioOTA_civitatis: Math.round(precioNeto * CIVITATIS_MARKUP),
          markupTurcom:    23,
          markupCivitatis: 25,
          canalesOTA: r.fields?.['Canales_OTA'] || [],
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    res.json({ success: true, data: servicios, total: servicios.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cowork/calcular-grupo ────────────────────────────────────────────
// ?servicioId=xxx&pax=150&precioNeto=100000

router.get('/calcular-grupo', (req, res) => {
  const pax = parseInt(req.query.pax) || 1;
  const precioNeto = parseFloat(req.query.precioNeto) || 0;
  const pct = descuentoPct(pax);
  const netoConDescuento = Math.round(precioNeto * (1 - pct / 100));
  const precioOTA_turcom    = Math.round(netoConDescuento * TURCOM_MARKUP);
  const precioOTA_civitatis = Math.round(netoConDescuento * CIVITATIS_MARKUP);
  const totalNeto           = netoConDescuento * pax;
  const totalTurcom         = precioOTA_turcom * pax;
  const totalCivitatis      = precioOTA_civitatis * pax;

  res.json({
    success: true,
    data: {
      pax, precioNeto, pct,
      netoConDescuento,
      precioOTA_turcom, precioOTA_civitatis,
      totalNeto, totalTurcom, totalCivitatis,
    },
  });
});

// ── Helper: fetch paginado de Airtable ───────────────────────────────────────

async function fetchAirtable(apiKey, baseId, table, maxRecords = 100) {
  const url = `${AT_URL}/${baseId}/${encodeURIComponent(table)}?maxRecords=${maxRecords}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status} en ${table}`);
  const data = await res.json();
  return data.records || [];
}

// ── GET /api/cowork/catalogo-completo ────────────────────────────────────────
// Devuelve tours + alojamientos + traslados + tiquetes para el cotizador B2B

router.get('/catalogo-completo', async (req, res, next) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) {
      return res.status(503).json({ success: false, error: 'Airtable no configurado' });
    }

    // Fetch en paralelo las 4 tablas
    const [recsTours, recsAloj, recsTraslados, recsTiquetes] = await Promise.allSettled([
      fetchAirtable(apiKey, baseId, 'ServiciosTuristicos_SAI'),
      fetchAirtable(apiKey, baseId, 'AlojamientosTuristicos_SAI'),
      fetchAirtable(apiKey, baseId, 'Taxis_Traslados'),
      fetchAirtable(apiKey, baseId, 'Tiquetes_Aereos'),
    ]);

    const tours = (recsTours.status === 'fulfilled' ? recsTours.value : [])
      .filter(r => r.fields?.Servicio && r.fields?.['Precio actualizado'])
      .map(r => {
        const precioNeto = Number(r.fields['Precio actualizado']) || 0;
        return {
          id: r.id, tabla: 'tours',
          nombre:    r.fields['Servicio'] || '',
          tipo:      r.fields['Tipo de Servicio'] || 'Tour',
          capacidad: r.fields['Capacidad'] || null,
          precioNeto,
          canalesOTA: r.fields['Canales_OTA'] || [],
          unidad: 'persona',
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const alojamientos = (recsAloj.status === 'fulfilled' ? recsAloj.value : [])
      .filter(r => r.fields?.Servicio && r.fields?.['Precio actualizado'])
      .map(r => {
        const precioNeto = Number(r.fields['Precio actualizado']) || 0;
        return {
          id: r.id, tabla: 'alojamientos',
          nombre:    r.fields['Servicio'] || '',
          tipo:      r.fields['Tipo de Alojamiento'] || r.fields['Tipo de Servicio'] || 'Alojamiento',
          capacidad: r.fields['Capacidad'] || null,
          precioNeto,
          precioNeto2: Number(r.fields['Precio 2 Huespedes']) || null,
          precioNeto3: Number(r.fields['Precio 3 Huespedes']) || null,
          precioNeto4: Number(r.fields['Precio 4+ Huespedes']) || null,
          canalesOTA: [],
          unidad: 'noche',
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const traslados = (recsTraslados.status === 'fulfilled' ? recsTraslados.value : [])
      .filter(r => r.fields?.Nombre)
      .map(r => ({
        id: r.id, tabla: 'traslados',
        nombre:    (r.fields['Nombre'] || '').replace(/\n/g, ' ').trim(),
        tipo:      r.fields['Tipo_Vehiculo'] || r.fields['Tipo'] || 'Traslado',
        origen:    (r.fields['Origen'] || '').replace(/\n/g, ' ').trim(),
        destino:   (r.fields['Destino'] || '').replace(/\n/g, ' ').trim(),
        capacidad: r.fields['Capacidad_Max_Pasajeros'] || null,
        precioNeto: Number(r.fields['Precio_Base']) || 0,
        precioPorPersona: Number(r.fields['Precio_Por_Persona']) || 0,
        canalesOTA: [],
        unidad: 'traslado',
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const tiquetes = (recsTiquetes.status === 'fulfilled' ? recsTiquetes.value : [])
      .filter(r => r.fields?.Nombre)
      .map(r => ({
        id: r.id, tabla: 'tiquetes',
        nombre:    (r.fields['Nombre'] || '').replace(/\n/g, ' ').trim(),
        tipo:      r.fields['Tipo_Vuelo'] || 'Tiquete',
        origen:    r.fields['Origen'] || '',
        destino:   r.fields['Destino'] || '',
        aerolinea: r.fields['Aerolinea'] || '',
        precioAdulto: r.fields['Precio_Adulto'] || '',
        precioNino:   r.fields['Precio_Nino']   || '',
        precioNeto: 0,   // tiquetes son referenciales, precio varía
        canalesOTA: [],
        unidad: 'persona',
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    res.json({
      success: true,
      data: { tours, alojamientos, traslados, tiquetes },
      totals: { tours: tours.length, alojamientos: alojamientos.length, traslados: traslados.length, tiquetes: tiquetes.length },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
