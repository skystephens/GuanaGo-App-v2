/**
 * routes/cowork.js — GuanaGO Cowork B2B
 *
 * GET  /api/cowork/catalogo-b2b   → Catálogo con precios netos para OTAs
 */

import express from 'express';
import { config } from '../config.js';

const router = express.Router();
const AT_URL = 'https://api.airtable.com/v0';
const OTA_MARKUP = 1.23;

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
          precioOTA:   Math.round(precioNeto * OTA_MARKUP),
          markupPct:   23,
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
  const precioOTA = Math.round(netoConDescuento * OTA_MARKUP);
  const totalNeto = netoConDescuento * pax;
  const totalOTA = precioOTA * pax;

  res.json({
    success: true,
    data: {
      pax, precioNeto, pct,
      netoConDescuento, precioOTA,
      totalNeto, totalOTA,
    },
  });
});

export default router;
