/**
 * Admin Service - Gestión de administradores y validación de PIN
 */

// Configuración: PIN por defecto (cambia esto en producción)
const DEFAULT_ADMIN_PIN = '2026';

// Base de datos simulada de admins (en producción, usar Airtable o base de datos real)
const ADMIN_USERS = {
  '2026': {
    id: 'admin-001',
    nombre: 'Administrador Principal',
    email: 'admin@guanago.com',
    rol: 'admin',
    pin: '2026',
    activo: true,
    permisos: ['tareas', 'usuarios', 'servicios', 'finanzas', 'aprobaciones', 'configuracion']
  }
};

/**
 * Validar PIN de administrador
 * @param {string} pin - PIN ingresado por el usuario
 * @returns {Promise<Object|null>} - Datos del admin si es válido, null si no
 */
export async function validateAdminPin(pin) {
  if (!pin) {
    console.warn('⚠️ PIN vacío recibido');
    return null;
  }

  // Buscar admin con este PIN
  const adminUser = ADMIN_USERS[pin];
  
  if (adminUser && adminUser.activo) {
    console.log(`✅ Admin validado: ${adminUser.nombre}`);
    
    // Retornar datos del admin (sin exponer el PIN completo)
    return {
      id: adminUser.id,
      nombre: adminUser.nombre,
      email: adminUser.email,
      rol: adminUser.rol,
      permisos: adminUser.permisos
    };
  }

  console.warn(`❌ Intento de login con PIN inválido`);
  return null;
}

/**
 * Obtener datos del admin por ID
 * @param {string} adminId - ID del administrador
 * @returns {Object|null} - Datos del admin o null
 */
export function getAdminById(adminId) {
  for (const [pin, admin] of Object.entries(ADMIN_USERS)) {
    if (admin.id === adminId && admin.activo) {
      return {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
        permisos: admin.permisos
      };
    }
  }
  return null;
}

/**
 * Cambiar PIN del administrador
 * @param {string} currentPin - PIN actual
 * @param {string} newPin - Nuevo PIN
 * @returns {Promise<boolean>} - true si cambio fue exitoso
 */
export async function changeAdminPin(currentPin, newPin) {
  if (!ADMIN_USERS[currentPin]) {
    console.warn('❌ PIN actual inválido');
    return false;
  }

  if (!newPin || newPin.length < 4) {
    console.warn('❌ Nuevo PIN debe tener al menos 4 dígitos');
    return false;
  }

  const admin = ADMIN_USERS[currentPin];
  
  // Eliminar entrada antigua
  delete ADMIN_USERS[currentPin];
  
  // Crear entrada nueva con nuevo PIN
  ADMIN_USERS[newPin] = {
    ...admin,
    pin: newPin
  };

  console.log(`✅ PIN cambiado exitosamente para ${admin.nombre}`);
  return true;
}

/**
 * Verificar si un admin tiene permiso para una acción
 * @param {string} adminId - ID del admin
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean} - true si tiene permiso
 */
export function hasPermission(adminId, permiso) {
  for (const admin of Object.values(ADMIN_USERS)) {
    if (admin.id === adminId && admin.activo) {
      return admin.permisos.includes(permiso) || admin.permisos.includes('*');
    }
  }
  return false;
}

/**
 * Obtener todos los permisos de un admin
 * @param {string} adminId - ID del admin
 * @returns {Array<string>} - Lista de permisos
 */
export function getAdminPermissions(adminId) {
  for (const admin of Object.values(ADMIN_USERS)) {
    if (admin.id === adminId && admin.activo) {
      return admin.permisos;
    }
  }
  return [];
}

export default {
  validateAdminPin,
  getAdminById,
  changeAdminPin,
  hasPermission,
  getAdminPermissions
};
