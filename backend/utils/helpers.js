import { config } from '../config.js';

// Exportar funciones de logs y notificaciones
export * from './logs.js';

/**
 * Utilidad para hacer requests a Make.com
 */
export const makeRequest = async (webhookUrl, data, actionID) => {
  // Silently skip calls to unconfigured or placeholder webhooks
  if (!webhookUrl || webhookUrl.includes('YOUR_')) {
    return { status: 'skipped', message: 'Webhook not configured' };
  }
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

    // Intentar parsear como JSON, si falla, devolver respuesta como texto
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log(`⚠️ Make.com respondió con formato no-JSON [${actionID}]:`, text);
      // Si es una respuesta de aceptación, devolver un objeto estándar
      result = {
        status: 'accepted',
        message: text,
        actionID
      };
    }
    
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
