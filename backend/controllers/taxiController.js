import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

// Datos mock para cuando Make no está configurado
const MOCK_TAXI_RATES = [
  { id: '1', origin: 'Aeropuerto', destination: 'Centro', price: 25000, vehicleType: 'sedan', duration: '15 min' },
  { id: '2', origin: 'Centro', destination: 'Spratt Bight', price: 15000, vehicleType: 'sedan', duration: '10 min' },
  { id: '3', origin: 'Aeropuerto', destination: 'Punta Sur', price: 45000, vehicleType: 'suv', duration: '25 min' },
];

const isMakeConfigured = () => {
  return config.makeWebhooks.taxis && !config.makeWebhooks.taxis.includes('YOUR_');
};

/**
 * Obtener tarifas de taxis
 */
export const getTaxiRates = async (req, res, next) => {
  try {
    const { origin, destination, vehicleType } = req.query;
    
    // Si Make no está configurado, devolver datos mock
    if (!isMakeConfigured()) {
      console.log('⚠️ Make webhook no configurado, usando datos mock para taxis');
      return res.json({
        success: true,
        data: MOCK_TAXI_RATES,
        source: 'mock'
      });
    }

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
    // Si falla Make, devolver datos mock
    console.log('⚠️ Error con Make taxis, usando datos mock:', error.message);
    res.json({
      success: true,
      data: MOCK_TAXI_RATES,
      source: 'mock-fallback'
    });
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
