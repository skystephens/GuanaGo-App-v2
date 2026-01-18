import { createAvailabilityRequest, updateAvailabilityRequest, listAvailabilityRequests } from '../services/airtableAvailabilityService.js';
import { registrarLogTrazabilidad } from '../utils/helpers.js';

export const createRequest = async (req, res, next) => {
  try {
    const {
      alojamientoId,
      socioId,
      checkIn,
      checkOut,
      adultos,
      ninos,
      bebes,
      notas,
      contactName,
      contactEmail,
      contactWhatsapp
    } = req.body;

    if (!alojamientoId || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
    }

    const usuarioId = req.user?.id || req.body.usuarioId || '';

    const record = await createAvailabilityRequest({
      alojamientoId,
      socioId,
      usuarioId,
      checkIn,
      checkOut,
      adultos,
      ninos,
      bebes,
      notas,
      contactName,
      contactEmail,
      contactWhatsapp
    });

    await registrarLogTrazabilidad({
      tipo: 'availability_request',
      usuarioId: usuarioId || 'anonimo',
      descripcion: `Solicitud de disponibilidad para ${alojamientoId} del ${checkIn} al ${checkOut}`,
      extra: { requestId: record.id }
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const listForPartner = async (req, res, next) => {
  try {
    const socioId = req.user?.id;
    const records = await listAvailabilityRequests({ socioId });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const listForUser = async (req, res, next) => {
  try {
    const usuarioId = req.user?.id;
    const records = await listAvailabilityRequests({ usuarioId });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const listAll = async (req, res, next) => {
  try {
    // Sin filtro de socioId ni usuarioId - devuelve todas las solicitudes
    const records = await listAvailabilityRequests({});
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, tarifaConfirmada, currency, condiciones, expiresAt } = req.body;

    const estado = action === 'approve' ? 'approved'
      : action === 'reject' ? 'rejected'
      : undefined;

    const record = await updateAvailabilityRequest(id, {
      estado,
      tarifaConfirmada,
      currency,
      condiciones,
      expiresAt
    });

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
