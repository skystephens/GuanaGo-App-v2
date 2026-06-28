/**
 * POST /api/leads — captura de leads desde formulario público
 * Guarda en tabla Leads de Airtable y devuelve referencia.
 */

import express from 'express';
import axios   from 'axios';

const router = express.Router();

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AIRTABLE_KEY  = process.env.AIRTABLE_API_KEY;
const AIRTABLE_URL  = `https://api.airtable.com/v0/${AIRTABLE_BASE}/Leads`;

// Make.com webhook para notificación WhatsApp (opcional)
const MAKE_WEBHOOK_LEADS = process.env.MAKE_WEBHOOK_LEADS;

// GET /api/leads?tipo=Aliado_Diagnostico  — lista de leads filtrada (uso admin)
router.get('/', async (req, res) => {
  if (!AIRTABLE_KEY) return res.status(503).json({ success: false, error: 'AIRTABLE_API_KEY not configured' });

  const { tipo, estado, limit = '50' } = req.query;
  const params = new URLSearchParams({ pageSize: String(Math.min(Number(limit), 100)) });
  const filterParts = [];
  if (tipo)   filterParts.push(`{Tipo_Cliente}="${tipo}"`);
  if (estado) filterParts.push(`{Estado_del_Lead}="${estado}"`);
  if (filterParts.length) params.set('filterByFormula', filterParts.length > 1 ? `AND(${filterParts.join(',')})` : filterParts[0]);
  params.set('sort[0][field]', 'Referencia_GG');
  params.set('sort[0][direction]', 'desc');

  try {
    const atRes = await axios.get(`${AIRTABLE_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    const records = (atRes.data.records || []).map(r => ({
      id: r.id,
      nombre:      r.fields.Nombre            || '',
      whatsapp:    r.fields.WhatsApp           || '',
      tipo:        r.fields.Tipo_Cliente       || '',
      estado:      r.fields.Estado_del_Lead    || '',
      fuente:      r.fields.Fuente_del_Lead    || '',
      ref:         r.fields.Referencia_GG      || '',
      detalles:    r.fields.Detalles_Adicionales || '',
      canal:       r.fields.Canal_Preferido    || '',
      createdTime: r.createdTime               || '',
    }));
    return res.json({ success: true, records, total: records.length });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    return res.status(500).json({ success: false, error: msg });
  }
});

router.post('/', async (req, res) => {
  const refNum = 'GG-' + String(Date.now()).slice(-6);

  const fields = {
    Nombre:            req.body.Nombre           || '',
    WhatsApp:          req.body.WhatsApp          || '',
    Estado_del_Lead:   'Nuevo',
    Tipo_Cliente:      req.body.Tipo_Cliente      || 'Turista',
    Fuente_del_Lead:   req.body.Fuente_del_Lead   || 'Formulario web',
    Referencia_GG:     refNum,
    Canal_Preferido:   req.body.Canal_Preferido   || '',
  };

  if (req.body.Email)               fields.Email                = req.body.Email;
  if (req.body.Fechas_del_Viaje)    fields.Fechas_del_Viaje    = req.body.Fechas_del_Viaje;
  if (req.body.Viajeros)            fields.Viajeros             = req.body.Viajeros;
  if (req.body.Tipo_de_Viaje)       fields.Tipo_de_Viaje        = req.body.Tipo_de_Viaje;
  if (req.body.Intereses_de_Tours)  fields.Intereses_de_Tours   = req.body.Intereses_de_Tours;
  if (req.body.Detalles_Adicionales) fields.Detalles_Adicionales = req.body.Detalles_Adicionales;

  try {
    if (!AIRTABLE_KEY) throw new Error('AIRTABLE_API_KEY not configured');

    await axios.post(
      AIRTABLE_URL,
      { fields },
      { headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' } }
    );

    // Dispara Make.com para notificación WhatsApp (fire-and-forget)
    if (MAKE_WEBHOOK_LEADS) {
      axios.post(MAKE_WEBHOOK_LEADS, { ref: refNum, ...fields })
        .catch(e => console.error('Make.com webhook leads error:', e.message));
    }

    return res.json({ success: true, ref: refNum });

  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[leads] Error Airtable: ${msg}`);
    // Respondemos igual para no bloquear UX — el lead se loguea en consola
    console.log('[leads] Payload no guardado:', JSON.stringify(fields));
    return res.status(500).json({ success: false, ref: refNum, error: msg });
  }
});

export default router;
