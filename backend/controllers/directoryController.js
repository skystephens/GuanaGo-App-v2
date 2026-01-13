import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

// Datos mock para cuando Make no está configurado
const MOCK_DIRECTORY = [
  { id: '1', name: 'Restaurante Miss Celia', category: 'Restaurante', lat: 12.5847, lng: -81.7006, rating: 4.8 },
  { id: '2', name: 'Hotel Sunrise Beach', category: 'Hotel', lat: 12.5820, lng: -81.7050, rating: 4.5 },
  { id: '3', name: 'Tour Johnny Cay', category: 'Tour', lat: 12.5900, lng: -81.6900, rating: 4.9 },
  { id: '4', name: 'Taxi Aeropuerto', category: 'Transporte', lat: 12.5834, lng: -81.7112, rating: 4.2 },
];

const isMakeConfigured = () => {
  return config.makeWebhooks.directory && !config.makeWebhooks.directory.includes('YOUR_');
};

/**
 * Obtener el directorio completo
 */
export const getDirectory = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    
    // Si Make no está configurado correctamente, devolver datos mock
    if (!isMakeConfigured()) {
      console.log('⚠️ Make webhook no configurado, usando datos mock para directory');
      return res.json({
        success: true,
        data: MOCK_DIRECTORY,
        total: MOCK_DIRECTORY.length,
        source: 'mock'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.directory,
      {
        action: 'list',
        filters: { category, search, featured }
      },
      'GET_DIRECTORY'
    );

    res.json({
      success: true,
      data: result.directory || result.data || [],
      total: result.total || 0
    });
  } catch (error) {
    // Si falla Make, devolver datos mock
    console.log('⚠️ Error con Make directory, usando datos mock:', error.message);
    res.json({
      success: true,
      data: MOCK_DIRECTORY,
      total: MOCK_DIRECTORY.length,
      source: 'mock-fallback'
    });
  }
};

/**
 * Obtener información de un lugar específico
 */
export const getPlaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await makeRequest(
      config.makeWebhooks.directory,
      {
        action: 'get',
        placeId: id
      },
      'GET_PLACE_BY_ID'
    );

    if (!result.place) {
      return res.status(404).json({
        success: false,
        error: 'Lugar no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.place
    });
  } catch (error) {
    next(error);
  }
};
