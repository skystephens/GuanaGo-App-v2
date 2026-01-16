import { makeRequest, registrarLogTrazabilidad } from '../utils/helpers.js';
import { config } from '../config.js';

// Datos mock para cuando Make no está configurado
const MOCK_SERVICES = [
  { id: '1', title: 'Tour Isla de San Andrés', category: 'tour', price: 150, rating: 4.8, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' },
  { id: '2', title: 'Hotel Decameron', category: 'hotel', price: 200, rating: 4.5, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
  { id: '3', title: 'Snorkel en el Acuario', category: 'tour', price: 80, rating: 4.9, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400' },
];

// Mock data para eventos musicales RIMM Caribbean Night
const MOCK_MUSIC_EVENTS = [
  {
    id: 'cn-001',
    eventName: 'Caribbean Night - Live Stieg Edition',
    title: 'Caribbean Night - Live Stieg Edition',
    date: '2026-01-15',
    price: 85000,
    artistName: 'Stieg',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example',
    description: 'Una noche mágica de música Kriol en vivo con el talento local de San Andrés.',
    category: 'music_event'
  },
  {
    id: 'cn-002',
    eventName: 'Reggae Roots Night',
    title: 'Reggae Roots Night',
    date: '2026-01-22',
    price: 75000,
    artistName: 'Island Vibes Band',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example2',
    description: 'Reggae auténtico con sabor caribeño para una noche inolvidable.',
    category: 'music_event'
  },
  {
    id: 'cn-003',
    eventName: 'Calypso Sunset Session',
    title: 'Calypso Sunset Session',
    date: '2026-01-29',
    price: 65000,
    artistName: 'Caribbean Soul',
    imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    description: 'Calypso y ritmos tradicionales al atardecer frente al mar.',
    category: 'music_event'
  }
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
    
    // Eventos musicales RIMM Caribbean Night - siempre usar datos locales
    // (No están en Airtable, son gestionados internamente por RIMM)
    if (category === 'music_event') {
      console.log('🎵 Cargando eventos RIMM Caribbean Night (datos locales)');
      return res.json({
        success: true,
        data: MOCK_MUSIC_EVENTS,
        total: MOCK_MUSIC_EVENTS.length,
        source: 'rimm-internal'
      });
    }
    
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

    // Registrar log de trazabilidad para creación/actualización de servicio
    await registrarLogTrazabilidad({
      tipo: id ? 'servicio_actualizado' : 'servicio_creado',
      usuarioId: req.user?.id || 'anonimo',
      descripcion: `${id ? 'Actualización' : 'Creación'} de servicio: ${serviceData.title || serviceData.Nombre || 'sin nombre'}`,
      extra: {
        service: result.service,
        userRole: req.user.role
      }
    });

    res.json({
      success: true,
      data: result.service,
      message: id ? 'Servicio actualizado' : 'Servicio creado'
    });
  } catch (error) {
    next(error);
  }
};
