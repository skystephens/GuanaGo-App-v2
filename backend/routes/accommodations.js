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

export default router;
