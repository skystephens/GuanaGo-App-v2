import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

/**
 * Obtener todos los servicios turísticos
 */
export const getServices = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;
    
    const result = await makeRequest(
      config.makeWebhooks.services,
      {
        action: 'list',
        filters: { category, featured, search }
      },
      'GET_SERVICES'
    );

    res.json({
      success: true,
      data: result.services || [],
      total: result.total || 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un servicio específico por ID
 */
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await makeRequest(
      config.makeWebhooks.services,
      {
        action: 'get',
        serviceId: id
      },
      'GET_SERVICE_BY_ID'
    );

    if (!result.service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar disponibilidad de un servicio
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const { serviceId, date, people } = req.body;
    
    if (!serviceId || !date || !people) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: serviceId, date, people'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.services,
      {
        action: 'checkAvailability',
        serviceId,
        date,
        people
      },
      'CHECK_AVAILABILITY'
    );

    res.json({
      success: true,
      available: result.available,
      cuposDisponibles: result.cuposDisponibles,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear o actualizar un servicio (solo para partners/admins)
 */
export const createOrUpdateService = async (req, res, next) => {
  try {
    const serviceData = req.body;
    const { id } = req.params;
    
    const result = await makeRequest(
      config.makeWebhooks.services,
      {
        action: id ? 'update' : 'create',
        serviceId: id,
        service: serviceData,
        userId: req.user.id,
        userRole: req.user.role
      },
      id ? 'UPDATE_SERVICE' : 'CREATE_SERVICE'
    );

    res.json({
      success: true,
      data: result.service,
      message: id ? 'Servicio actualizado' : 'Servicio creado'
    });
  } catch (error) {
    next(error);
  }
};
