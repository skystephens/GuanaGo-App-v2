/**
 * GuanaGO — Ruta: /api/dinamicas
 * Maneja: Concursos, Embajadores y Perfiles de puntos (GuanaPoints)
 *
 * Tablas Airtable:
 *   Concursos             → tblYOTVRaQprTxVwq
 *   Concurso_Participantes→ tbl3sIlBTnFh2WCfF
 *   Embajadores           → tblkAbIW3LQX0dh9u
 *   Perfiles_Usuarios     → tblC6teRhWovnSzic
 */

import express from 'express';
import axios   from 'axios';
import { config } from '../config.js';

const router = express.Router();

const BASE    = 'https://api.airtable.com/v0';
const BASE_ID = config.airtable.baseId;
const headers = () => ({
  Authorization: `Bearer ${config.airtable.apiKey}`,
  'Content-Type': 'application/json',
});

const AT = {
  CONCURSOS:     'tblYOTVRaQprTxVwq',
  PARTICIPANTES: 'tbl3sIlBTnFh2WCfF',
  EMBAJADORES:   'tblkAbIW3LQX0dh9u',
  PERFILES:      'tblC6teRhWovnSzic',
};

/** Util: lista todos los registros paginados de una tabla */
async function listAll(tableId, params = {}) {
  const records = [];
  let offset;
  do {
    const { data } = await axios.get(`${BASE}/${BASE_ID}/${tableId}`, {
      headers: headers(),
      params: { ...params, ...(offset ? { offset } : {}) },
    });
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

// ─── GET /api/dinamicas/concursos ────────────────────────────────────────────
// Devuelve concursos activos con su conteo de votos por participante
router.get('/concursos', async (req, res) => {
  try {
    const records = await listAll(AT.CONCURSOS, {
      filterByFormula: "{Estado}='activo'",
      fields: ['Nombre', 'Descripcion', 'Categoria', 'FechaFin', 'Estado', 'Imagen'],
    });

    const concursos = records.map(r => ({
      id: r.id,
      nombre:      r.fields['Nombre']      || '',
      descripcion: r.fields['Descripcion'] || '',
      categoria:   r.fields['Categoria']   || '',
      fechaFin:    r.fields['FechaFin']    || '',
      estado:      r.fields['Estado']      || 'activo',
      imagen:      r.fields['Imagen']?.[0]?.url || '',
    }));

    res.json({ success: true, concursos });
  } catch (err) {
    console.error('[dinamicas] GET /concursos:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/dinamicas/concursos/:id/participantes ──────────────────────────
router.get('/concursos/:id/participantes', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await listAll(AT.PARTICIPANTES, {
      filterByFormula: `{Concurso}='${id}'`,
      fields: ['Nombre_Negocio', 'Concurso', 'Votos', 'Imagen', 'Descripcion', 'Categoria'],
      sort: [{ field: 'Votos', direction: 'desc' }],
    });

    const participantes = records.map(r => ({
      id:       r.id,
      nombre:   r.fields['Nombre_Negocio']  || '',
      votos:    r.fields['Votos']           || 0,
      imagen:   r.fields['Imagen']?.[0]?.url || '',
      descripcion: r.fields['Descripcion'] || '',
      categoria:   r.fields['Categoria']   || '',
    }));

    res.json({ success: true, participantes });
  } catch (err) {
    console.error('[dinamicas] GET /participantes:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/dinamicas/votar ───────────────────────────────────────────────
// Body: { participanteId, userId, concursoId }
// Guarda voto y suma +1 al participante (idempotente por userId+concursoId)
router.post('/votar', async (req, res) => {
  try {
    const { participanteId, userId, concursoId } = req.body;
    if (!participanteId || !userId || !concursoId) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    // Verificar si ya votó en este concurso
    const existing = await listAll(AT.PERFILES, {
      filterByFormula: `AND({FirebaseUID}='${userId}', {VotoConcurso}='${concursoId}')`,
      fields: ['FirebaseUID', 'VotoConcurso'],
      maxRecords: 1,
    });

    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Ya votaste en este concurso' });
    }

    // Obtener votos actuales del participante
    const { data: part } = await axios.get(
      `${BASE}/${BASE_ID}/${AT.PARTICIPANTES}/${participanteId}`,
      { headers: headers() }
    );
    const votosActuales = part.fields?.Votos || 0;

    // Incrementar votos
    await axios.patch(
      `${BASE}/${BASE_ID}/${AT.PARTICIPANTES}/${participanteId}`,
      { fields: { Votos: votosActuales + 1 } },
      { headers: headers() }
    );

    // Registrar voto en perfil del usuario (si tiene perfil en Perfiles_Usuarios)
    const perfiles = await listAll(AT.PERFILES, {
      filterByFormula: `{FirebaseUID}='${userId}'`,
      fields: ['GuanaPoints', 'VotoConcurso'],
      maxRecords: 1,
    });

    if (perfiles.length > 0) {
      const perfil = perfiles[0];
      const puntosActuales = perfil.fields['GuanaPoints'] || 0;
      await axios.patch(
        `${BASE}/${BASE_ID}/${AT.PERFILES}/${perfil.id}`,
        { fields: { GuanaPoints: puntosActuales + 30, VotoConcurso: concursoId } },
        { headers: headers() }
      );
    }

    res.json({ success: true, message: 'Voto registrado. +30 GuanaPoints' });
  } catch (err) {
    console.error('[dinamicas] POST /votar:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/dinamicas/embajador/:firebaseUid ───────────────────────────────
router.get('/embajador/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const records = await listAll(AT.EMBAJADORES, {
      filterByFormula: `{FirebaseUID}='${uid}'`,
      fields: ['Nombre', 'CodigoReferido', 'TotalReferidos', 'ReferidosActivos', 'Nivel', 'GuanaPoints', 'FirebaseUID'],
      maxRecords: 1,
    });

    if (records.length === 0) {
      return res.json({ success: true, embajador: null });
    }

    const r = records[0];
    res.json({
      success: true,
      embajador: {
        id:               r.id,
        nombre:           r.fields['Nombre']          || '',
        codigoReferido:   r.fields['CodigoReferido']  || '',
        totalReferidos:   r.fields['TotalReferidos']  || 0,
        referidosActivos: r.fields['ReferidosActivos']|| 0,
        nivel:            r.fields['Nivel']           || 'Bronce',
        puntos:           r.fields['GuanaPoints']     || 0,
      },
    });
  } catch (err) {
    console.error('[dinamicas] GET /embajador:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/dinamicas/perfil/:firebaseUid ──────────────────────────────────
router.get('/perfil/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const records = await listAll(AT.PERFILES, {
      filterByFormula: `{FirebaseUID}='${uid}'`,
      fields: ['Nombre', 'GuanaPoints', 'PuntosGanados', 'PuntosCanjeados', 'Nivel', 'FirebaseUID'],
      maxRecords: 1,
    });

    if (records.length === 0) {
      return res.json({ success: true, perfil: { puntos: 0, ganados: 0, canjeados: 0, nivel: 'Bronce' } });
    }

    const r = records[0];
    res.json({
      success: true,
      perfil: {
        id:        r.id,
        nombre:    r.fields['Nombre']           || '',
        puntos:    r.fields['GuanaPoints']       || 0,
        ganados:   r.fields['PuntosGanados']     || 0,
        canjeados: r.fields['PuntosCanjeados']   || 0,
        nivel:     r.fields['Nivel']             || 'Bronce',
      },
    });
  } catch (err) {
    console.error('[dinamicas] GET /perfil:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
