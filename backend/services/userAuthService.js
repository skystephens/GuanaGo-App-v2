/**
 * User Authentication Service
 * Maneja registro y login de usuarios con Airtable
 * Incluye credenciales locales de respaldo
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USUARIOS_TABLE = 'Usuarios_Admins'; // Tabla de usuarios principal (Email/Pin/Rol/Activo)

// ============================================
// CREDENCIALES DE RESPALDO LOCAL
// Esto funciona siempre, incluso sin Airtable
// ============================================
const LOCAL_USERS = [
  {
    id: 'local-superadmin-1',
    nombre: 'Super Admin',
    email: 'admin@guanago.travel',
    pin: '166400',
    rol: 'SuperAdmin',
    activo: true
  },
  {
    id: 'local-admin-2',
    nombre: 'Admin Dev',
    email: 'dev@guanago.travel',
    pin: 'test1234',
    rol: 'SuperAdmin',
    activo: true
  },
  {
    id: 'local-turista-1',
    nombre: 'Turista Demo',
    email: 'turista@demo.com',
    pin: 'turista123',
    rol: 'Turista',
    activo: true
  },
  {
    id: 'local-local-1',
    nombre: 'Residente Demo',
    email: 'local@demo.com',
    pin: 'local123',
    rol: 'Residente Local',
    activo: true
  },
  {
    id: 'local-socio-1',
    nombre: 'Socio Demo',
    email: 'socio@demo.com',
    pin: 'socio123',
    rol: 'Socio',
    activo: true
  }
];

/**
 * Validar credenciales contra usuarios locales
 */
function validateLocalUser(email, password) {
  console.log('🔐 Intentando validación LOCAL para:', email);
  const user = LOCAL_USERS.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.pin === password && 
    u.activo
  );
  if (user) {
    console.log(`✅ Usuario LOCAL encontrado: ${user.nombre} (${user.rol})`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.rol,
        activo: true
      }
    };
  }
  return null;
}

// Detectar nombres de campos reales en la tabla Usuarios_Admins

// Detectar nombres de campos reales en la tabla Usuarios_Admins
async function detectUserFields() {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`Airtable API error: ${response.status}`);
    const data = await response.json();
    const sample = data.records && data.records[0];
    const keys = sample && sample.fields ? Object.keys(sample.fields) : [];

    const pick = (candidates) => {
      const found = candidates.find(c => keys.includes(c))
        || candidates.find(c => keys.map(k => k.toLowerCase()).includes(c.toLowerCase()));
      return found || null;
    };

    const emailField = pick(['Email', 'Correo', 'E-mail', 'Mail', 'email']);
    const passwordField = pick(['Pin', 'PIN', 'Password', 'Contraseña', 'Clave', 'password']);
    const roleField = pick(['Rol', 'Role', 'Tipo', 'Perfil']);
    const activeField = pick(['Activo', 'Estado', 'Active', 'Verificado']);
    const nameField = pick(['Nombre', 'Name', 'Full Name']);

    const mapping = { emailField, passwordField, roleField, activeField, nameField };
    console.log('🧭 Mapeo de campos detectado:', mapping);
    return mapping;
  } catch (e) {
    console.warn('⚠️ No fue posible detectar campos; usando valores por defecto');
    return { emailField: 'Email', passwordField: 'Password', roleField: 'Rol', activeField: 'Activo', nameField: 'Nombre' };
  }
}

function buildActiveFormula(activeField) {
  if (!activeField) return '';
  if (activeField === 'Activo') return `{Activo} = TRUE()`;
  if (activeField === 'Active') return `{Active} = TRUE()`;
  if (activeField === 'Verificado') return `{Verificado} = TRUE()`;
  if (activeField === 'Estado') {
    return `OR({Estado}='Activo', {Estado}='Aprobado', {Estado}='Verificado', {Estado}=TRUE())`;
  }
  return '';
}

/**
 * Registrar nuevo usuario
 * Auto-aprueba: Turista y Residente Local
 * Requiere aprobación: Socio Operador
 */
export async function registerUser({ email, password, userType, nombre }) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE_API_KEY o AIRTABLE_BASE_ID no configurado');
    return { success: false, error: 'Configuración de servidor incompleta' };
  }

  try {
    console.log('📝 Registrando nuevo usuario:', { email, userType, nombre });
    const fieldsMap = await detectUserFields();

    // 1. Verificar si el email ya existe
    const emailField = fieldsMap.emailField || 'Email';
    const escapedEmail = String(email || '').replace(/'/g, "''");
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}?filterByFormula=${encodeURIComponent(`{${emailField}}='${escapedEmail}'`)}`;
    
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable API error: ${checkResponse.status}`);
    }

    const checkData = await checkResponse.json();
    
    if (checkData.records && checkData.records.length > 0) {
      return { success: false, error: 'El correo ya está registrado' };
    }

    // 2. Mapear tipo de usuario a rol y estado
    // Mapear tipo a rol (español) y estado Activo
    let rol = 'Turista';
    let activo = true; // Auto-aprobado por defecto para turista/local

    switch (userType) {
      case 'turista':
        rol = 'Turista';
        activo = true;
        break;
      case 'local':
        rol = 'Local';
        activo = true;
        break;
      case 'socio':
        rol = 'Socio';
        activo = false; // Requiere aprobación manual
        break;
      default:
        rol = 'Turista';
        activo = true;
    }

    // 3. Crear registro en Airtable
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}`;
    
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            [fieldsMap.emailField || 'Email']: email,
            [fieldsMap.passwordField || 'Password']: password,
            [fieldsMap.nameField || 'Nombre']: nombre || email.split('@')[0],
            [fieldsMap.roleField || 'Rol']: rol,
            [fieldsMap.activeField || 'Activo']: (fieldsMap.activeField === 'Estado' ? (activo ? 'Activo' : 'Pendiente') : activo),
            Fecha: new Date().toISOString(),
            Ultima_Actividad: new Date().toISOString(),
            Saldo_GUANA: rol === 'Turista' || rol === 'Local' ? 100 : 0,
            Puntos_Acumulados: rol === 'Turista' || rol === 'Local' ? 100 : 0,
            Puntos_Canjeados: 0,
            Nivel: 'Bronce',
            Origen: 'App GuanaGO'
          }
        }]
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Error creando usuario:', errorText);
      return { success: false, error: `Error Airtable: ${errorText}` };
    }

    const userData = await createResponse.json();
    
    console.log('✅ Usuario creado exitosamente:', userData.id);

    const created = userData.records && userData.records[0];
    const fields = created.fields;
    const requiresApproval = !(fields.Activo === true);

    return {
      success: true,
      user: {
        id: created.id,
        email: fields[emailField] || fields.Email,
        nombre: fields[fieldsMap.nameField || 'Nombre'] || fields.Nombre,
        role: fields[fieldsMap.roleField || 'Rol'] || fields.Rol || 'Turista',
        verificado: (fields[fieldsMap.activeField || 'Activo'] === true) || (fields[fieldsMap.activeField || 'Activo'] === 'Activo'),
        estado: (fields[fieldsMap.activeField || 'Activo'] === true || fields[fieldsMap.activeField || 'Activo'] === 'Activo') ? 'Activo' : 'Pendiente',
        requiresApproval
      },
      message: requiresApproval 
        ? '¡Solicitud enviada! Un administrador revisará tu solicitud pronto.'
        : '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.'
    };

  } catch (error) {
    console.error('❌ Error en registerUser:', error);
    return { success: false, error: 'Error al registrar usuario' };
  }
}

/**
 * Login de usuario
 * Verifica credenciales primero localmente, luego en Airtable
 * Soporta tanto Password como PIN para autenticación
 */
export async function loginUser({ email, password }) {
  console.log('🔐 Intentando login:', email);

  // PASO 1: Intentar credenciales locales PRIMERO (siempre funciona)
  const localResult = validateLocalUser(email, password);
  if (localResult) {
    console.log('✅ Login LOCAL exitoso');
    return localResult;
  }

  // PASO 2: Si no hay Airtable configurado, retornar error
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE no configurado y credenciales locales no coinciden');
    return { success: false, error: 'Credenciales incorrectas' };
  }

  // PASO 3: Intentar Airtable
  try {
    console.log('📋 Buscando en Airtable...');
    const fieldsMap = await detectUserFields();

    const escapedEmail = String(email || '').replace(/'/g, "''");
    const escapedPass = String(password || '').replace(/'/g, "''");
    const emailField = fieldsMap.emailField || 'Email';
    
    // Detectar si la tabla usa Password o PIN
    const passField = fieldsMap.passwordField || 'Password';
    const hasPinField = passField === 'PIN' || !fieldsMap.passwordField;
    
    console.log('📋 Buscando en:', USUARIOS_TABLE);
    console.log('📋 Campo email:', emailField, '| Campo password/pin:', passField);
    
    // Primero buscar solo por email para verificar si el usuario existe
    const emailFormula = `{${emailField}}='${escapedEmail}'`;
    const emailUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}?filterByFormula=${encodeURIComponent(emailFormula)}`;
    
    const emailResponse = await fetch(emailUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('❌ Airtable API error:', emailResponse.status, errText);
      throw new Error(`Airtable API error: ${emailResponse.status}`);
    }

    const emailData = await emailResponse.json();
    console.log('📦 Usuarios encontrados con ese email:', emailData.records?.length || 0);
    
    if (!emailData.records || emailData.records.length === 0) {
      return { success: false, error: 'Usuario no encontrado. ¿Ya te registraste?' };
    }

    const userRecord = emailData.records[0];
    const fields = userRecord.fields;
    
    // Verificar credenciales: intentar con Pin primero (como está en Airtable)
    const storedPin = fields.Pin || fields.PIN || fields.pin;
    const storedPassword = fields.Password || fields.password || fields.Contraseña;
    
    console.log('🔑 Verificando credenciales...');
    console.log('   - Tiene Pin:', Boolean(storedPin));
    console.log('   - Tiene Password:', Boolean(storedPassword));
    
    let credentialsMatch = false;
    
    // Intentar primero con Pin (como lo tienes en Airtable)
    if (storedPin) {
      credentialsMatch = String(storedPin).trim() === String(password).trim();
      console.log('   - Comparando con Pin:', credentialsMatch ? '✅' : '❌');
    }
    
    // Si no hay Pin o no coincide, intentar con Password
    if (!credentialsMatch && storedPassword) {
      credentialsMatch = String(storedPassword).trim() === String(password).trim();
      console.log('   - Comparando con Password:', credentialsMatch ? '✅' : '❌');
    }
    
    if (!credentialsMatch) {
      return { success: false, error: 'Contraseña/PIN incorrecto' };
    }
    
    // Verificar estado del usuario
    const activeField = fieldsMap.activeField || 'Activo';
    const isActive = fields[activeField] === true || 
                     fields[activeField] === 'Activo' || 
                     fields[activeField] === 'Aprobado' ||
                     fields[activeField] === 'Verificado' ||
                     fields.Activo === true;
    
    console.log(`👤 Usuario: ${fields[emailField]}, Activo: ${fields[activeField]}, isActive: ${isActive}`);

    if (fields.Estado === 'Inactivo') {
      return { success: false, error: 'Cuenta desactivada. Contacta a soporte.' };
    }

    if (fields.Estado === 'Pendiente') {
      return { 
        success: false, 
        error: 'Tu cuenta está pendiente de aprobación.' 
      };
    }
    
    if (!isActive && fields[activeField] !== undefined) {
      return { 
        success: false, 
        error: 'Tu cuenta no está activa. Contacta a soporte.' 
      };
    }

    // Actualizar última actividad
    try {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}/${userRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Ultima_Actividad: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.warn('⚠️ No se pudo actualizar última actividad:', e.message);
    }

    console.log('✅ Login exitoso:', fields[emailField] || fields.Email);

    return {
      success: true,
      user: {
        id: userRecord.id,
        email: fields[emailField] || fields.Email,
        nombre: fields[fieldsMap.nameField || 'Nombre'] || fields.Nombre,
        role: fields[fieldsMap.roleField || 'Rol'] || fields.Rol || 'Turista',
        saldo: fields.Saldo_GUANA || 0,
        nivel: fields.Nivel || 'Bronce',
        verificado: (fields[fieldsMap.activeField || 'Activo'] === true) || (fields[fieldsMap.activeField || 'Activo'] === 'Activo')
      }
    };

  } catch (error) {
    console.error('❌ Error en loginUser:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}
