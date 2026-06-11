/**
 * Proxy API — Disponibilidad Alojamientos
 * Permite a propietarios leer/guardar su disponibilidad sin exponer la API key.
 * Usa los mismos field IDs que disponibilidad-propietario.html
 *
 * GET  /api/disponibilidad/:alojId         → info alojamiento + bloques
 * POST /api/disponibilidad/:alojId/bloques → crear nuevo bloque
 */

import express from 'express';
const router = express.Router();

const BASE_ID  = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const ALOJ_TBL = 'tblUNglGMsxDZYZPs';  // AlojamientosTuristicos_SAI
const DISP_TBL = 'tblcw6FBoo7iQPhDB';  // Disponibilidad_SAI
const AT_URL   = 'https://api.airtable.com/v0';

// Field IDs — Disponibilidad_SAI (los mismos que usa el HTML del propietario)
const F_BLOQUE_ID   = 'fld5eSmyq9izWRPbA';
const F_FECHA_INI   = 'fldpYBC6vkMnDBkYv';
const F_FECHA_FIN   = 'fldRBuqC1fuH4WjHC';
const F_ESTADO      = 'flddExbxaRGzoyaeR';
const F_DESCUENTO   = 'fldgbeX9cL7kce5AP';
const F_NOTAS       = 'fldLvnA1i4EOreSzP';
const F_CREADO_POR  = 'fldyuCPxBKkLbmLmq';
const F_ALOJAMIENTO = 'fldwaAf8p8s3quhc6';

// Field IDs — AlojamientosTuristicos_SAI
const F_NOMBRE    = 'fldC0HvJST8ZtnuZX';
const F_CAPACIDAD = 'fldt6s43OnktwOkPW';

const atHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

// ── GET /api/disponibilidad/:alojId ─────────────────────────────────────────
// Retorna info del alojamiento + lista de bloques
router.get('/:alojId', async (req, res) => {
  const { alojId } = req.params;

  if (!alojId || !alojId.startsWith('rec')) {
    return res.status(400).json({ error: 'ID de alojamiento inválido' });
  }

  try {
    // Verificar que el alojamiento existe
    const alojRes = await fetch(
      `${AT_URL}/${BASE_ID}/${ALOJ_TBL}/${alojId}?returnFieldsByFieldId=true`,
      { headers: atHeaders() }
    );
    if (!alojRes.ok) {
      return res.status(404).json({ error: 'Alojamiento no encontrado' });
    }
    const alojData = await alojRes.json();
    const af = alojData.fields || {};

    // Buscar bloques de disponibilidad para este alojamiento
    const params = new URLSearchParams({
      filterByFormula: `FIND("${alojId}", ARRAYJOIN({Alojamiento}))`,
      maxRecords: '365',
      returnFieldsByFieldId: 'true',
    });
    const dispRes = await fetch(`${AT_URL}/${BASE_ID}/${DISP_TBL}?${params}`, { headers: atHeaders() });
    const dispData = dispRes.ok ? await dispRes.json() : { records: [] };

    const blocks = (dispData.records || []).map(r => {
      const f = r.fields || {};
      return {
        id:        r.id,
        start:     f[F_FECHA_INI] || '',
        end:       f[F_FECHA_FIN]  || '',
        estado:    f[F_ESTADO]    || 'Bloqueado',
        descuento: f[F_DESCUENTO] || 0,
        notas:     f[F_NOTAS]     || '',
      };
    }).filter(b => b.start && b.end); // descartar bloques sin fecha

    res.json({
      aloj: {
        id:        alojData.id,
        nombre:    af[F_NOMBRE]    || af.Servicio || af.Nombre || alojData.id,
        capacidad: af[F_CAPACIDAD] || '',
      },
      blocks,
    });
  } catch (err) {
    console.error('❌ disponibilidadProxy GET:', err.message);
    res.status(500).json({ error: 'Error del servidor al cargar disponibilidad' });
  }
});

// ── POST /api/disponibilidad/:alojId/bloques ─────────────────────────────────
// Crea un nuevo bloque de disponibilidad
router.post('/:alojId/bloques', async (req, res) => {
  const { alojId } = req.params;
  const { start, end, estado, descuento, notas } = req.body || {};

  if (!alojId || !alojId.startsWith('rec')) {
    return res.status(400).json({ error: 'ID de alojamiento inválido' });
  }
  if (!start || !end || !estado) {
    return res.status(400).json({ error: 'Faltan campos: start, end, estado' });
  }

  const estadosValidos = ['Libre', 'Bloqueado', 'Promo', 'Reservado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido: ${estado}` });
  }

  try {
    const postRes = await fetch(`${AT_URL}/${BASE_ID}/${DISP_TBL}`, {
      method: 'POST',
      headers: atHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            [F_BLOQUE_ID]:   `${alojId} · ${start}`,
            [F_ALOJAMIENTO]: [{ id: alojId }],
            [F_FECHA_INI]:   start,
            [F_FECHA_FIN]:   end,
            [F_ESTADO]:      estado,
            [F_DESCUENTO]:   Number(descuento) || 0,
            [F_NOTAS]:       notas || '',
            [F_CREADO_POR]:  'Propietario',
          },
        }],
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error('❌ Airtable POST error:', errText);
      return res.status(400).json({ error: 'Error al guardar en Airtable', details: errText });
    }

    const result = await postRes.json();
    const saved  = (result.records || [])[0];
    res.status(201).json({
      id:        saved?.id,
      start, end, estado,
      descuento: Number(descuento) || 0,
      notas:     notas || '',
    });
  } catch (err) {
    console.error('❌ disponibilidadProxy POST:', err.message);
    res.status(500).json({ error: 'Error del servidor al guardar bloque' });
  }
});

export default router;
