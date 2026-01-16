/**
 * Admin Service - Validación de PIN sin dependencias externas
 * Conexión directa a Airtable usando fetch nativo
 * Soporta PINs alfanuméricos y tiene fallback local
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';

// ============================================
// CREDENCIALES DE RESPALDO LOCAL (SuperAdmin)
// Esto funciona siempre, incluso sin Airtable
// ============================================
const LOCAL_ADMINS = [
  {
    id: 'local-superadmin-1',
    nombre: 'Super Admin',
    email: 'admin@guanago.travel',
    pin: '166400',
    rol: 'SuperAdmin',
    activo: true
  },
  {
    id: 'local-superadmin-2',
    nombre: 'Admin Dev',
    email: 'dev@guanago.travel',
    pin: 'test1234',
    rol: 'SuperAdmin',
    activo: true
  }
];

// Escapar valores especiales para fórmulas Airtable
function escapePinForFormula(pin) {
  if (typeof pin !== 'string') {
    return String(pin);
  }
  // Escapar comillas simples duplicándolas
  return pin.replace(/'/g, "''");
}

/**
 * Validar PIN contra credenciales locales (respaldo)
 */
function validateLocalPin(pinStr) {
  console.log('🔐 Intentando validación LOCAL...');
  const admin = LOCAL_ADMINS.find(a => a.pin === pinStr && a.activo);
  if (admin) {
    console.log(`✅ Admin LOCAL encontrado: ${admin.nombre}`);
    return { ...admin };
  }
  console.log('❌ PIN no encontrado en credenciales locales');
  return null;
}

/**
 * Validar PIN de administrador
 * 1. Primero intenta Airtable
 * 2. Si falla, usa credenciales locales de respaldo
 * @param {string|number} pin - El PIN a validar
 * @returns {Promise<Object|null>} Usuario admin si coincide, null si no
 */
export async function validateAdminPin(pin) {
  const pinStr = String(pin).trim();
  
  if (!pinStr || pinStr.length === 0) {
    console.warn('⚠️ PIN vacío');
    return null;
  }

  console.log(`🔐 Validando PIN: ${pinStr} (${pinStr.length} caracteres)`);

  // PASO 1: Intentar validación LOCAL primero (más rápido y siempre funciona)
  const localUser = validateLocalPin(pinStr);
  if (localUser) {
    return localUser;
  }

  // PASO 2: Si no hay credenciales de Airtable, retornar null
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE no configurado y PIN no está en credenciales locales');
    return null;
  }

  // PASO 3: Intentar Airtable
  try {
    console.log(`📋 Buscando en Airtable...`);
    console.log(`📋 Base ID: ${AIRTABLE_BASE_ID}`);
    console.log(`📋 Tabla: Usuarios_Admins`);
    
    // Escapar el PIN para evitar injection
    const escapedPin = escapePinForFormula(pinStr);
    
    // Buscar PIN como texto (soporta alfanuméricos como test1234)
    const filterFormula = `AND({Pin} = '${escapedPin}', {Activo} = TRUE())`;
    
    console.log(`📋 Fórmula: ${filterFormula}`);
    
    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      maxRecords: '1'
    });

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Usuarios_Admins?${params}`;
    
    console.log(`🌐 Request URL: ${url.substring(0, 80)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Airtable API Error ${response.status}:`, errorText);
      
      // Si hay error en la fórmula, intentar búsqueda simple
      console.log(`⚠️ Intentando búsqueda alternativa sin OR...`);
      return await validateAdminPinFallback(pinStr);
    }

    const data = await response.json();
    
    console.log(`📦 Records encontrados: ${data.records?.length || 0}`);
    
    if (data.records && data.records.length > 0) {
      const user = data.records[0].fields;
      console.log(`✅ Admin encontrado: ${user.Nombre} (ID: ${data.records[0].id})`);
      console.log(`📊 Campos: Rol=${user.Rol}, Activo=${user.Activo}`);
      
      return {
        id: data.records[0].id,
        nombre: user.Nombre || 'Admin',
        email: user.Email || '',
        pin: String(user.PIN), // Siempre como string
        rol: user.Rol || 'SuperAdmin',
        activo: user.Activo === true,
        permisos_especificos: user.Permisos_Especificos || []
      };
    }
    
    console.warn(`⚠️ PIN no coincide o usuario no está activo. Intentando búsqueda alternativa...`);
    return await validateAdminPinFallback(pinStr);
    
  } catch (error) {
    console.error('❌ Error en validateAdminPin:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

/**
 * Búsqueda alternativa: obtener todos los admins y validar localmente
 * Útil cuando la fórmula falla o hay problemas de tipo de dato
 */
async function validateAdminPinFallback(pinStr) {
  try {
    console.log(`🔄 Fallback: Obteniendo todos los admins de Usuarios_Admins...`);
    
    const params = new URLSearchParams({
      filterByFormula: '{Activo} = TRUE()',
      maxRecords: '100'
    });

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Usuarios_Admins?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Fallback failed - API error ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`📦 Fallback: ${data.records?.length || 0} admins activos encontrados`);
    
    // Buscar manualmente el PIN (como texto)
    for (const record of (data.records || [])) {
      const user = record.fields;
      const recordPin = String(user.Pin || user.PIN || '').trim();
      
      console.log(`   Comparando: "${pinStr}" === "${recordPin}" ?`);
      
      if (recordPin === pinStr) {
        console.log(`✅ Fallback: PIN coincide! Admin: ${user.Nombre}`);
        
        return {
          id: record.id,
          nombre: user.Nombre || 'Admin',
          email: user.Email || '',
          pin: recordPin,
          rol: user.Rol || 'SuperAdmin',
          activo: user.Activo === true,
          permisos_especificos: user.Permisos_Especificos || []
        };
      }
    }
    
    console.warn(`⚠️ Fallback: PIN ${pinStr} no encontrado en ningún usuario activo`);
    return null;
    
  } catch (error) {
    console.error('❌ Error en validateAdminPinFallback:', error.message);
    return null;
  }
}
