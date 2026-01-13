import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

// Datos mock para cuando Make no está configurado
const MOCK_SERVICES = [
  { id: '1', title: 'Tour Isla de San Andrés', category: 'tour', price: 150, rating: 4.8, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' },
  { id: '2', title: 'Hotel Decameron', category: 'hotel', price: 200, rating: 4.5, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
  { id: '3', title: 'Snorkel en el Acuario', category: 'tour', price: 80, rating: 4.9, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400' },
];

const isMakeConfigured = () => {
  return config.makeWebhooks.services && !config.makeWebhooks.services.includes('YOUR_');
};

/**
 * Obtener todos los servicios turísticos
 */
export const getServices = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;
    
    // Si Make no está configurado, devolver datos mock
    if (!isMakeConfigured()) {
      console.log('⚠️ Make webhook no configurado, usando datos mock para services');
      return res.json({
        success: true,
        data: MOCK_SERVICES,
        total: MOCK_SERVICES.length,
        source: 'mock'
      });
    }

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
    // Si falla Make, devolver datos mock
    console.log('⚠️ Error con Make, usando datos mock:', error.message);
    res.json({
      success: true,
      data: MOCK_SERVICES,
      total: MOCK_SERVICES.length,
      source: 'mock-fallback'
    });
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
