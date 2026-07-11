/**
 * CRM Torre Comercial GuiaSAI — API
 *
 * GET  /api/crm/resumen    → métricas tycoon por departamento
 * GET  /api/crm/leads      → leads (CotizacionesGG) con campos CRM
 * PATCH /api/crm/leads/:id → actualiza Etapa_CRM / Temperatura / Notas_CRM
 *
 * Fuente: Airtable CotizacionesGG (tblNSEeP3MttNNDuT), Pagos, Chats_Atencion
 * + vouchers del día vía vouchersService (base Generador_vouchers).
 */

import express from 'express';
import * as vouchersService from '../services/vouchersService.js';

const router = express.Router();

const AT = () => {
  const key  = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  return { key, base };
};

const atFetch = async (tabla, params = '') => {
  const { key, base } = AT();
  const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tabla)}${params}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`${tabla} ${r.status}`);
  return r.json();
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function normFecha(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

const mapLead = (rec) => ({
  id: rec.id,
  nombre: rec.fields['Nombre'] || 'Sin nombre',
  telefono: rec.fields['Telefono'] || '',
  email: rec.fields['Email'] || '',
  fechaCreacion: rec.fields['Fecha Creacion'] || '',
  fechaViaje: rec.fields['Fecha Inicio'] || '',
  adultos: rec.fields['Adultos 18 - 99 años'] || 0,
  precio: rec.fields['Precio total'] || 0,
  estado: rec.fields['Estado'] || '',
  numeroReserva: rec.fields['Numero_Reserva'] || '',
  etapa: rec.fields['Etapa_CRM'] || 'Nuevo',
  temperatura: rec.fields['Temperatura'] || '',
  notas: rec.fields['Notas_CRM'] || '',
});

// ── GET /api/crm/leads ────────────────────────────────────────────────────────
router.get('/leads', async (_req, res) => {
  try {
    const data = await atFetch('CotizacionesGG', '?pageSize=100&sort%5B0%5D%5Bfield%5D=Fecha%20Creacion&sort%5B0%5D%5Bdirection%5D=desc');
    res.json((data.records || []).map(mapLead));
  } catch (err) {
    console.error('❌ crm/leads:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/crm/leads/:id ──────────────────────────────────────────────────
router.patch('/leads/:id', express.json(), async (req, res) => {
  const { etapa, temperatura, notas } = req.body || {};
  const fields = {};
  if (etapa !== undefined) fields['Etapa_CRM'] = etapa;
  if (temperatura !== undefined) fields['Temperatura'] = temperatura;
  if (notas !== undefined) fields['Notas_CRM'] = notas;
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nada que actualizar' });

  try {
    const { key, base } = AT();
    const r = await fetch(`https://api.airtable.com/v0/${base}/CotizacionesGG/${req.params.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    const rec = await r.json();
    res.json(mapLead(rec));
  } catch (err) {
    console.error('❌ crm/patch:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/crm/resumen — métricas tycoon ────────────────────────────────────
let cacheResumen = { data: null, ts: 0 };

router.get('/resumen', async (_req, res) => {
  try {
    if (cacheResumen.data && Date.now() - cacheResumen.ts < 120_000) {
      return res.json(cacheResumen.data);
    }
    const hoy = hoyISO();
    const mesActual = hoy.slice(0, 7);

    const [cotiz, pagos, chats, vouchers] = await Promise.allSettled([
      atFetch('CotizacionesGG', '?pageSize=100&sort%5B0%5D%5Bfield%5D=Fecha%20Creacion&sort%5B0%5D%5Bdirection%5D=desc'),
      atFetch('Pagos', '?pageSize=100&sort%5B0%5D%5Bfield%5D=Fecha_Pago&sort%5B0%5D%5Bdirection%5D=desc'),
      atFetch('Chats_Atencion', `?pageSize=50&filterByFormula=${encodeURIComponent(`{Estado}='pendiente'`)}`),
      vouchersService.getVouchers(100),
    ]);

    // Ventas
    let ventasHoy = 0, sinAtender = 0, pipeline = 0, ganadosHoy = 0;
    if (cotiz.status === 'fulfilled') {
      for (const rec of cotiz.value.records || []) {
        const f = rec.fields;
        const creado = normFecha(f['Fecha Creacion']);
        const etapa = f['Etapa_CRM'] || 'Nuevo';
        const pagado = !!f['Numero_Reserva'] || etapa === 'Ganado';
        if (creado === hoy) ventasHoy++;
        if (etapa === 'Nuevo' && !pagado) sinAtender++;
        if (!pagado && !['Perdido'].includes(etapa)) pipeline += Number(f['Precio total'] || 0);
        if (pagado && creado === hoy) ganadosHoy++;
      }
    }

    // Finanzas
    let cajaHoy = 0, cajaMes = 0;
    if (pagos.status === 'fulfilled') {
      for (const rec of pagos.value.records || []) {
        const f = rec.fields;
        if (f['Estado'] && f['Estado'] !== 'Completado') continue;
        const fecha = normFecha(f['Fecha_Pago']);
        const monto = Number(f['Monto'] || 0);
        if (fecha === hoy) cajaHoy += monto;
        if (fecha.startsWith(mesActual)) cajaMes += monto;
      }
    }

    // Atención
    const chatsPendientes = chats.status === 'fulfilled' ? (chats.value.records || []).length : 0;

    // Operaciones
    let toursHoy = 0, vouchersPendientes = 0;
    if (vouchers.status === 'fulfilled') {
      for (const v of vouchers.value || []) {
        const f = normFecha(v.fecha);
        if (f === hoy) toursHoy++;
        if (f && f < hoy && /pendiente/i.test(v.estado || '')) vouchersPendientes++;
      }
    }

    const resumen = {
      ventas: { hoy: ventasHoy, sinAtender, pipeline, ganadosHoy },
      finanzas: { cajaHoy, cajaMes },
      atencion: { chatsPendientes },
      operaciones: { toursHoy, vouchersPendientes },
      actualizado: new Date().toISOString(),
    };
    cacheResumen = { data: resumen, ts: Date.now() };
    res.json(resumen);
  } catch (err) {
    console.error('❌ crm/resumen:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
