import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

/**
 * Crear una nueva reserva
 */
export const createReservation = async (req, res, next) => {
  try {
    const { serviceId, date, people, customerInfo, paymentMethod } = req.body;
    
    if (!serviceId || !date || !people || !customerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.reservations,
      {
        action: 'create',
        serviceId,
        date,
        people,
        customerInfo,
        paymentMethod,
        userId: req.user?.id
      },
      'CREATE_RESERVATION'
    );

    res.status(201).json({
      success: true,
      data: result.reservation,
      transactionId: result.hederaTransactionId,
      message: 'Reserva creada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reservas del usuario
 */
export const getUserReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const result = await makeRequest(
      config.makeWebhooks.reservations,
      {
        action: 'getUserReservations',
        userId: req.user.id,
        status
      },
      'GET_USER_RESERVATIONS'
    );

    res.json({
      success: true,
      data: result.reservations || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reservas de un partner
 */
export const getPartnerReservations = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    
    const result = await makeRequest(
      config.makeWebhooks.reservations,
      {
        action: 'getPartnerReservations',
        partnerId: req.user.id,
        status,
        date
      },
      'GET_PARTNER_RESERVATIONS'
    );

    res.json({
      success: true,
      data: result.reservations || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validar/Escanear QR de reserva
 */
export const validateReservation = async (req, res, next) => {
  try {
    const { reservationId, qrCode } = req.body;
    
    const result = await makeRequest(
      config.makeWebhooks.reservations,
      {
        action: 'validate',
        reservationId,
        qrCode,
        validatedBy: req.user.id,
        validatedAt: new Date().toISOString()
      },
      'VALIDATE_RESERVATION'
    );

    res.json({
      success: true,
      data: result.reservation,
      message: 'Reserva validada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar una reserva
 */
export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await makeRequest(
      config.makeWebhooks.reservations,
      {
        action: 'cancel',
        reservationId: id,
        cancelledBy: req.user.id,
        reason
      },
      'CANCEL_RESERVATION'
    );

    res.json({
      success: true,
      message: 'Reserva cancelada',
      refundInfo: result.refund
    });
  } catch (error) {
    next(error);
  }
};
