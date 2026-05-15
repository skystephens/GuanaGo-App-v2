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
