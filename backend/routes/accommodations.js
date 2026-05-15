import express from 'express';
import * as accommodationsController from '../controllers/accommodationsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

function extractAlojImage(f) {
  const candidates = [
    f['ImagenWP'], f['imagenwp'], f['imagenWP'], f['Imagen_WP'],
    f['Imagenurl'], f['ImagenUrl'], f['imagenurl'], f['imagenUrl'],
    f['Imagen'], f['Imagen Principal'], f['Image'], f['Images'],
    f['Foto'], f['Fotos'], f['Galeria'], f['Gallery'],
    f['Imagenes'], f['Attachments'], f['Attachment'], f['Media'],
    f['Pictures'], f['Photo'], f['Photos'],
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c) && c.length > 0) {
      const u = c[0]?.url || c[0]?.thumbnails?.large?.url || (typeof c[0] === 'string' ? c[0] : null);
      if (u) return u;
    } else if (typeof c === 'string' && c.startsWith('http')) {
      return c.split(',')[0].trim();
    }
  }
  // Fallback: any array field with .url
  for (const value of Object.values(f)) {
    if (Array.isArray(value) && value.length > 0 && value[0]?.url) return value[0].url;
  }
  return '';
}

// ── Catálogo público de alojamientos (AlojamientosTuristicos_SAI) ──────────
router.get('/catalog', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!apiKey) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('AlojamientosTuristicos_SAI')}?filterByFormula=${encodeURIComponent('{Publicado} = TRUE()')}&maxRecords=100`;
    const atRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!atRes.ok) return res.status(502).json({ error: 'Error consultando Airtable' });

    const data = await atRes.json();
    const records = (data.records || []).map(r => {
      const f = r.fields || {};
      return {
        id:          r.id,
        title:       f['Servicio'] || '',
        description: f['Descripcion'] || '',
        image:       extractAlojImage(f),
        category:    'hotel',
        price:       Number(f['Precio actualizado']) || 0,
        price2:      Number(f['Precio 2 Huespedes']) || 0,
        price3:      Number(f['Precio 3 Huespedes']) || 0,
        price4:      Number(f['Precio 4+ Huespedes']) || 0,
        tipo:        f['Tipo de Alojamiento'] || 'Alojamiento',
        capacidad:   f['Capacidad'] || null,
        active:      true,
        rating:      5,
        reviews:     0,
      };
    });

    res.json({ records });
  } catch (err) {
    console.error('❌ accommodations/catalog error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Conteo rápido de solicitudes pendientes (sin auth — solo cuenta)
router.get('/pending-count', accommodationsController.getPendingCount);

// Crear solicitud de alojamiento (no requiere auth estricta)
router.post('/submissions', accommodationsController.createSubmission);

// Listar solicitudes del socio (requiere auth partner/admin)
router.get('/submissions/partner', authenticateToken, authorizeRole('partner', 'admin'), accommodationsController.listForPartner);

// Listar todas las solicitudes (solo admin)
router.get('/submissions/admin/all', authenticateToken, authorizeRole('admin'), accommodationsController.listAll);

// Actualizar estado de una solicitud (partner/admin)
router.patch('/submissions/:id', authenticateToken, authorizeRole('partner', 'admin'), accommodationsController.updateSubmission);

// ── POST /registro — Formulario público de registro de alojamiento ──────────
// Escribe en AlojamientosTuristicos_SAI con Publicado=false para revisión
router.post('/registro', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!apiKey) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  const {
    servicio, tipoAlojamiento, descripcion, capacidadMaxima,
    rnt, nombreEncargado, nit, telefono, email, imageUrls,
  } = req.body;

  if (!servicio || !tipoAlojamiento || !descripcion || !nombreEncargado || !nit || !email) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const descConMeta = `[Encargado: ${nombreEncargado} | NIT: ${nit}]\n\n${descripcion}`;

  const fields = {
    'Servicio':            servicio,
    'Nombre alternativo':  nombreEncargado,
    'Tipo de Servicio':    'Alojamiento',
    'Tipo de Alojamiento': tipoAlojamiento,
    'Descripcion':         descConMeta,
    'RNT':                 rnt || '',
    'Telefono Contacto':   telefono || '',
    'Email contacto':      email || '',
    'Publicado':           false,
    'RequiereAprobacion':  true,
  };

  if (capacidadMaxima) fields['Capacidad Maxima'] = capacidadMaxima;

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    fields['Imagenurl'] = imageUrls
      .filter(u => typeof u === 'string' && u.startsWith('http'))
      .map(u => ({ url: u }));
  }

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('AlojamientosTuristicos_SAI')}`;
    const atRes = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    const data = await atRes.json();
    if (!atRes.ok) {
      console.error('[accommodations/registro] Airtable error:', JSON.stringify(data));
      return res.status(502).json({ error: data?.error?.message || 'Error en Airtable' });
    }
    const ref = 'ALJ-' + String(Date.now()).slice(-6);
    res.json({ success: true, id: data.id, ref });
  } catch (err) {
    console.error('[accommodations/registro] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /pending — Lista alojamientos pendientes de aprobación ───────────────
router.get('/pending', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!apiKey) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  try {
    const filter = encodeURIComponent('AND({RequiereAprobacion}=TRUE(), {Publicado}=FALSE())');
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('AlojamientosTuristicos_SAI')}?filterByFormula=${filter}&maxRecords=50&sort[0][field]=Last+Modified+Time&sort[0][direction]=desc`;
    const atRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!atRes.ok) return res.status(502).json({ error: 'Error consultando Airtable' });

    const data = await atRes.json();
    const records = (data.records || []).map(r => {
      const f = r.fields || {};
      return {
        id:          r.id,
        servicio:    f['Servicio'] || '(sin nombre)',
        encargado:   f['Nombre alternativo'] || '',
        tipo:        f['Tipo de Alojamiento'] || '',
        telefono:    f['Telefono Contacto'] || '',
        email:       f['Email contacto'] || '',
        rnt:         f['RNT'] || '',
        descripcion: f['Descripcion'] || '',
        imagen:      extractAlojImage(f),
        createdAt:   f['Last Modified Time'] || '',
      };
    });
    res.json({ records });
  } catch (err) {
    console.error('[accommodations/pending] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /pending/:id/approve — Publica el alojamiento ─────────────────────
router.patch('/pending/:id/approve', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!apiKey) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('AlojamientosTuristicos_SAI')}/${req.params.id}`;
    const atRes = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Publicado: true, RequiereAprobacion: false } }),
    });
    if (!atRes.ok) return res.status(502).json({ error: 'Error actualizando Airtable' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /pending/:id/reject — Descarta la solicitud ───────────────────────
router.patch('/pending/:id/reject', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
  if (!apiKey) return res.status(503).json({ error: 'AIRTABLE_API_KEY no configurado' });

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('AlojamientosTuristicos_SAI')}/${req.params.id}`;
    const atRes = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { RequiereAprobacion: false } }),
    });
    if (!atRes.ok) return res.status(502).json({ error: 'Error actualizando Airtable' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
