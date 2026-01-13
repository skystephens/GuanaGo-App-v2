import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

/**
 * Obtener el directorio completo
 */
export const getDirectory = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    
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
    next(error);
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
