import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

/**
 * Obtener tarifas de taxis
 */
export const getTaxiRates = async (req, res, next) => {
  try {
    const { origin, destination, vehicleType } = req.query;
    
    const result = await makeRequest(
      config.makeWebhooks.taxis,
      {
        action: 'getRates',
        origin,
        destination,
        vehicleType
      },
      'GET_TAXI_RATES'
    );

    res.json({
      success: true,
      data: result.rates || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicitar un taxi
 */
export const requestTaxi = async (req, res, next) => {
  try {
    const { origin, destination, vehicleType, pickupTime, passengers } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origen y destino son requeridos'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.taxis,
      {
        action: 'request',
        origin,
        destination,
        vehicleType,
        pickupTime,
        passengers,
        userId: req.user?.id
      },
      'REQUEST_TAXI'
    );

    res.status(201).json({
      success: true,
      data: result.booking,
      message: 'Solicitud de taxi creada'
    });
  } catch (error) {
    next(error);
  }
};
