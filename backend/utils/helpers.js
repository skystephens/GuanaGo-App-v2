import { config } from '../config.js';

/**
 * Utilidad para hacer requests a Make.com
 */
export const makeRequest = async (webhookUrl, data, actionID) => {
  try {
    console.log(`📡 Enviando a Make.com [${actionID}]:`, webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionID,
        timestamp: new Date().toISOString(),
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`Make.com respondió con status ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Respuesta de Make.com [${actionID}]:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ Error en Make.com [${actionID}]:`, error.message);
    throw error;
  }
};

/**
 * Validar disponibilidad de cupos
 */
export const validateAvailability = (service, requestedPeople, date) => {
  const available = service.capacidad_diaria - (service.cupos_ocupados || 0);
  
  if (available < requestedPeople) {
    throw new Error(`Solo hay ${available} cupos disponibles para ${date}`);
  }
  
  return true;
};

/**
 * Calcular precio total con descuentos
 */
export const calculateTotal = (basePrice, people, discountPercent = 0) => {
  const subtotal = basePrice * people;
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;
  
  return {
    subtotal,
    discount,
    total,
    basePrice,
    people
  };
};
