/**
 * User Authentication Service
 * Maneja registro y login de usuarios con Airtable
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USUARIOS_TABLE = 'Usuarios_Admins'; // Tabla de usuarios principal (Email/Password/Rol/Activo)

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
    const passwordField = pick(['Password', 'Contraseña', 'Clave', 'password']);
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
 * Verifica credenciales en Airtable
 */
export async function loginUser({ email, password }) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE_API_KEY o AIRTABLE_BASE_ID no configurado');
    return { success: false, error: 'Configuración de servidor incompleta' };
  }

  try {
    console.log('🔐 Intentando login:', email);
    const fieldsMap = await detectUserFields();

    // 1. Buscar usuario por email y password (sin filtro de activo primero)
    const escapedEmail = String(email || '').replace(/'/g, "''");
    const escapedPass = String(password || '').replace(/'/g, "''");
    const emailField = fieldsMap.emailField || 'Email';
    const passField = fieldsMap.passwordField || 'Password';
    
    // Primero buscar solo por email+password para dar mensajes apropiados
    const formula = `AND({${emailField}}='${escapedEmail}', {${passField}}='${escapedPass}')`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`;
    
    console.log('📋 Buscando en:', USUARIOS_TABLE);
    console.log('📋 Fórmula:', formula);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Airtable API error:', response.status, errText);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Registros encontrados:', data.records?.length || 0);
    
    if (!data.records || data.records.length === 0) {
      // Si no hay coincidencia, buscar solo por email para dar mejor mensaje
      const emailOnlyFormula = `{${emailField}}='${escapedEmail}'`;
      const emailCheckUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}?filterByFormula=${encodeURIComponent(emailOnlyFormula)}`;
      
      const emailCheckResponse = await fetch(emailCheckUrl, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const emailCheckData = await emailCheckResponse.json();
      
      if (emailCheckData.records && emailCheckData.records.length > 0) {
        return { success: false, error: 'Contraseña incorrecta' };
      }
      
      return { success: false, error: 'Usuario no encontrado. ¿Ya te registraste?' };
    }

    const userRecord = data.records[0];
    const fields = userRecord.fields;
    
    // 2. Verificar estado del usuario
    const activeField = fieldsMap.activeField || 'Activo';
    const isActive = fields[activeField] === true || 
                     fields[activeField] === 'Activo' || 
                     fields[activeField] === 'Aprobado' ||
                     fields[activeField] === 'Verificado' ||
                     fields.Activo === true;
    
    console.log(`👤 Usuario encontrado: ${fields[emailField]}, Activo: ${fields[activeField]}, isActive: ${isActive}`);

    // Para compatibilidad si hay campo Estado
    if (fields.Estado === 'Inactivo') {
      return { success: false, error: 'Cuenta desactivada. Contacta a soporte.' };
    }

    if (fields.Estado === 'Pendiente') {
      return { 
        success: false, 
        error: 'Tu cuenta está pendiente de aprobación. Te notificaremos cuando sea aprobada.' 
      };
    }
    
    // Si el campo Activo es false, informar
    if (!isActive && fields[activeField] !== undefined) {
      return { 
        success: false, 
        error: 'Tu cuenta no está activa. Contacta a soporte.' 
      };
    }

    // 3. Actualizar última actividad
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
