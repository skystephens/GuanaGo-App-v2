import { createAccommodationSubmission, listAccommodationSubmissions, updateAccommodationSubmission } from '../services/airtableAccommodationsService.js';
import { registrarLogTrazabilidad } from '../utils/helpers.js';

export const createSubmission = async (req, res, next) => {
  try {
    const payload = req.body || {};

    // Validaciones mínimas
    if (!payload.nombreAlojamiento || !payload.tipoAlojamiento) {
      return res.status(400).json({ success: false, error: 'Faltan datos: nombreAlojamiento, tipoAlojamiento' });
    }

    const usuarioId = req.user?.id || payload.usuarioId || '';
    const socioId = req.user?.id || payload.socioId || '';

    const record = await createAccommodationSubmission({
      ...payload,
      usuarioId,
      socioId
    });

    await registrarLogTrazabilidad({
      tipo: 'accommodation_submission',
      usuarioId: usuarioId || 'anonimo',
      descripcion: `Solicitud de alojamiento: ${payload.nombreAlojamiento}`,
      extra: { requestId: record.id, tipoAlojamiento: payload.tipoAlojamiento }
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const listForPartner = async (req, res, next) => {
  try {
    const socioId = req.user?.id;
    const records = await listAccommodationSubmissions({ socioId });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const listAll = async (req, res, next) => {
  try {
    const records = await listAccommodationSubmissions({});
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getPendingCount = async (req, res, next) => {
  try {
    const records = await listAccommodationSubmissions({});
    const pending = (records || []).filter(r => {
      const estado = (r.estado || r.Estado || '').toLowerCase();
      return estado === 'pendiente' || estado === 'pending' || estado === '';
    });
    res.json({ success: true, total: pending.length });
  } catch (error) {
    res.json({ success: true, total: 0 }); // silencioso — es solo un badge
  }
};

export const updateSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, notasAdmin } = req.body;
    const record = await updateAccommodationSubmission(id, { estado, notasAdmin });
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
