/**
 * Tycoon GuiaSAI — GET /api/tycoon/metricas
 * Métricas en vivo por departamento, leyendo las tablas EXISTENTES:
 *   🛎️ Ventas:      CotizacionesGG (leads hoy / sin atender)
 *   💰 Finanzas:    Pagos (ventas de hoy y del mes, Wompi)
 *   💬 Atención:    Chats_Atencion (pendientes)
 *   ⚙️ Operaciones: Generador_vouchers (tours de hoy)
 * El kanban CRM se activará cuando existan los campos Etapa_CRM etc.
 */

import express from 'express';
import * as vouchersService from '../services/vouchersService.js';

const router = express.Router();

let cache = { data: null, ts: 0 };
const CACHE_MS = 60_000;

const AT_BASE = () => process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_KEY  = () => process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;

async function atList(table, params = '') {
  const r = await fetch(
    `https://api.airtable.com/v0/${AT_BASE()}/${encodeURIComponent(table)}?${params}`,
    { headers: { Authorization: `Bearer ${AT_KEY()}` } },
  );
  if (!r.ok) throw new Error(`${table} ${r.status}`);
  return (await r.json()).records || [];
}

function ymdLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function normFecha(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : ymdLocal(d);
}

router.get('/metricas', async (_req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) return res.json(cache.data);

    const hoy = ymdLocal();
    const inicioMes = hoy.slice(0, 8) + '01';

    const out = {
      ventas:      { leadsHoy: 0, sinAtender: 0, leadUrgente: null },
      finanzas:    { ventasHoyCOP: 0, ventasMesCOP: 0, pagosMes: 0 },
      atencion:    { chatsPendientes: 0 },
      operaciones: { toursHoy: 0, vouchersPendientes: 0 },
      generadoEn:  new Date().toISOString(),
    };

    // ── 🛎️ Ventas: CotizacionesGG ──
    try {
      const cot = await atList('CotizacionesGG',
        `pageSize=100&sort%5B0%5D%5Bfield%5D=Fecha%20Creacion&sort%5B0%5D%5Bdirection%5D=desc` +
        `&fields%5B%5D=Nombre&fields%5B%5D=Estado&fields%5B%5D=Fecha%20Creacion&fields%5B%5D=Precio%20total`);
      const hoyCot = cot.filter(r => normFecha(r.fields['Fecha Creacion']) === hoy);
      out.ventas.leadsHoy = hoyCot.length;
      const sinAtender = cot.filter(r => {
        const e = (r.fields['Estado'] || '').toString().toLowerCase();
        return e === '' || e === 'pendiente' || e === 'nueva' || e === 'nuevo';
      });
      out.ventas.sinAtender = sinAtender.length;
      if (sinAtender[0]) {
        out.ventas.leadUrgente = {
          nombre: sinAtender[0].fields['Nombre'] || 'Cliente',
          desde: sinAtender[0].fields['Fecha Creacion'] || '',
          monto: sinAtender[0].fields['Precio total'] || 0,
        };
      }
    } catch (e) { console.warn('tycoon ventas:', e.message); }

    // ── 💰 Finanzas: Pagos (Wompi) ──
    try {
      const pagos = await atList('Pagos',
        `pageSize=100&filterByFormula=${encodeURIComponent(`AND({Estado}="Completado", IS_AFTER({Fecha_Pago}, "${inicioMes}"))`)}` +
        `&fields%5B%5D=Monto&fields%5B%5D=Fecha_Pago`);
      out.finanzas.pagosMes = pagos.length;
      pagos.forEach(p => {
        const m = Number(p.fields['Monto'] || 0);
        out.finanzas.ventasMesCOP += m;
        if (normFecha(p.fields['Fecha_Pago']) === hoy) out.finanzas.ventasHoyCOP += m;
      });
    } catch (e) { console.warn('tycoon finanzas:', e.message); }

    // ── 💬 Atención: Chats_Atencion ──
    try {
      const chats = await atList('Chats_Atencion',
        `pageSize=100&filterByFormula=${encodeURIComponent(`FIND("pendiente", LOWER({Estado}))`)}&fields%5B%5D=Estado`);
      out.atencion.chatsPendientes = chats.length;
    } catch (e) { console.warn('tycoon atencion:', e.message); }

    // ── ⚙️ Operaciones: vouchers de hoy ──
    try {
      const vouchers = await vouchersService.getVouchers(200);
      out.operaciones.toursHoy = vouchers.filter(v => normFecha(v.fecha) === hoy).length;
      out.operaciones.vouchersPendientes = vouchers.filter(v =>
        (v.estado || '').toLowerCase().includes('pendiente')).length;
    } catch (e) { console.warn('tycoon operaciones:', e.message); }

    cache = { data: out, ts: Date.now() };
    res.json(out);
  } catch (err) {
    console.error('❌ tycoon metricas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
