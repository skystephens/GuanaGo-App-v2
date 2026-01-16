import { config } from '../config.js';

/**
 * Registrar un log de trazabilidad en Airtable (Logs_Trazabilidad)
 * @param {Object} logData - Información relevante del evento
 * @param {string} logData.tipo - Tipo de evento (ej: 'cotizacion', 'reserva', 'notificacion', 'aprobacion')
 * @param {string} logData.usuarioId - ID del usuario que genera el evento
 * @param {string} [logData.proveedorId] - ID del proveedor involucrado (opcional)
 * @param {string} [logData.adminId] - ID del admin/superadmin que aprueba (opcional)
 * @param {string} logData.descripcion - Descripción del evento
 * @param {Object} [logData.extra] - Información adicional relevante
 * @returns {Promise<Object>} Resultado de la operación
 */
export const registrarLogTrazabilidad = async (logData) => {
  try {
    const response = await fetch(config.makeWebhooks.logsTrazabilidad, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        ...logData,
        timestamp: new Date().toISOString()
      })
    });
    if (!response.ok) {
      throw new Error(`Error registrando log: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error registrando log de trazabilidad:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notificar a proveedores que cumplen perfil y registrar log
 * @param {Object} notificacion - Datos de la notificación
 * @param {string[]} notificacion.proveedoresIds - IDs de proveedores a notificar
 * @param {string} notificacion.mensaje - Mensaje de notificación
 * @param {string} notificacion.solicitudId - ID de la solicitud del cliente
 * @param {string} notificacion.usuarioId - ID del usuario solicitante
 * @returns {Promise<Object>} Resultado de la operación
 */
export const notificarProveedoresYRegistrar = async (notificacion) => {
  try {
    // Notificar a cada proveedor (puede ser por webhook, email, push, etc.)
    for (const proveedorId of notificacion.proveedoresIds) {
      // Aquí puedes integrar el canal real de notificación
      // Ejemplo: await enviarPushProveedor(proveedorId, notificacion.mensaje);
      // Registrar log de notificación
      await registrarLogTrazabilidad({
        tipo: 'notificacion',
        usuarioId: notificacion.usuarioId,
        proveedorId,
        descripcion: `Notificación enviada a proveedor ${proveedorId} para solicitud ${notificacion.solicitudId}`,
        extra: { mensaje: notificacion.mensaje }
      });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando proveedores:', error.message);
    return { success: false, error: error.message };
  }
};
