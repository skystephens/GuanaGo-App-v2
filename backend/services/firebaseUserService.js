/**
 * Firebase-Airtable Bridge Service
 * Fuente de verdad: tabla Usuarios_Admins (usuarios del sistema).
 * Busca o crea el registro al autenticar con Firebase.
 */

const TABLE = 'Usuarios_Admins';

const ADMIN_ROLES = ['Super_Admin', 'SuperAdmin', 'Admin', 'Junior', 'Asesor', 'Socio operador'];

const getHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

const tableUrl = (suffix = '') =>
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}${suffix}`;

/**
 * Busca usuario en Usuarios_Admins por Firebase UID o email.
 * Si no existe, lo crea. Retorna perfil normalizado.
 */
export async function findOrCreateLeadUser({ firebaseUid, email, nombre, photoUrl, userType = 'turista' }) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado, retornando perfil básico');
    return { success: true, user: buildFallbackProfile({ firebaseUid, email, nombre, userType }) };
  }

  try {
    // 1. Buscar por Firebase_UID
    const escapedUid = String(firebaseUid || '').replace(/'/g, "''");
    const byUidRes = await fetch(
      `${tableUrl()}?filterByFormula=${encodeURIComponent(`{Firebase_UID}='${escapedUid}'`)}`,
      { headers: getHeaders() }
    );

    let record = null;
    if (byUidRes.ok) {
      const d = await byUidRes.json();
      record = d.records?.[0] || null;
    }

    // 2. Fallback: buscar por Email
    if (!record && email) {
      const escapedEmail = String(email).replace(/'/g, "''");
      const byEmailRes = await fetch(
        `${tableUrl()}?filterByFormula=${encodeURIComponent(`{Email}='${escapedEmail}'`)}`,
        { headers: getHeaders() }
      );
      if (byEmailRes.ok) {
        const d = await byEmailRes.json();
        record = d.records?.[0] || null;
        // Vincular Firebase_UID al registro existente
        if (record && firebaseUid) {
          await patchRecord(record.id, { Firebase_UID: firebaseUid });
        }
      }
    }

    // 3. Encontrado → actualizar última actividad y retornar
    if (record) {
      await patchRecord(record.id, { Ultima_Actividad: new Date().toISOString() }).catch(() => {});
      return { success: true, user: buildProfile(record, firebaseUid) };
    }

    // 4. No existe → crear nuevo registro
    console.log('📝 Creando usuario en Usuarios_Admins:', email);
    const role = mapUserTypeToRole(userType);
    const isAutoActive = !['socio', 'aliado', 'operador'].includes(userType);

    const createRes = await fetch(tableUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Nombre: nombre || (email ? email.split('@')[0] : 'Usuario'),
            Email: email || '',
            Firebase_UID: firebaseUid || '',
            Rol: role,
            Activo: isAutoActive,
            Fecha: new Date().toISOString(),
            Ultima_Actividad: new Date().toISOString(),
            Origen: 'Firebase',
            Saldo_GUANA: 0,
            Nivel: 'Bronce',
          },
        }],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('❌ Error creando usuario en Airtable:', errText);
      // No lanzar — retornar perfil básico para no bloquear el login
      return { success: true, user: buildFallbackProfile({ firebaseUid, email, nombre, userType }) };
    }

    const createData = await createRes.json();
    const newRecord = createData.records[0];
    console.log('✅ Usuario creado en Usuarios_Admins:', email);

    return {
      success: true,
      user: buildProfile(newRecord, firebaseUid),
      isNew: true,
      message: isAutoActive ? '¡Bienvenido a GuanaGO!' : '¡Solicitud enviada! Un administrador revisará tu cuenta.',
    };

  } catch (error) {
    console.error('❌ Error en findOrCreateLeadUser:', error.message);
    // Fallback: no bloquear el login aunque Airtable falle
    return { success: true, user: buildFallbackProfile({ firebaseUid, email, nombre, userType }) };
  }
}

async function patchRecord(id, fields) {
  try {
    await fetch(tableUrl(`/${id}`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields }),
    });
  } catch (e) {
    console.warn('⚠️ No se pudo actualizar registro:', e.message);
  }
}

function buildProfile(record, firebaseUid) {
  const f = record.fields;
  const role = normalizeRole(f.Rol || f.Role || 'Turista');
  const accesos = Array.isArray(f.Accesos_Modulos)
    ? f.Accesos_Modulos.map(a => (typeof a === 'object' ? a.name : a))
    : [];

  return {
    id: record.id,
    email: f.Email || '',
    nombre: f.Nombre || '',
    role,
    saldo: f.Saldo_GUANA || 0,
    verificado: f.Activo === true,
    estado: f.Estado || (f.Activo === true ? 'Activo' : 'Pendiente'),
    tipoCliente: null,
    accesos,
    firebaseUid: f.Firebase_UID || firebaseUid,
    nivel: f.Nivel || null,
  };
}

function buildFallbackProfile({ firebaseUid, email, nombre, userType }) {
  return {
    id: firebaseUid || 'fallback',
    email: email || '',
    nombre: nombre || email?.split('@')[0] || '',
    role: mapUserTypeToRole(userType),
    saldo: 0,
    verificado: true,
    estado: 'Activo',
    accesos: [],
    firebaseUid,
  };
}

function mapUserTypeToRole(userType) {
  const map = {
    turista: 'Turista',
    local: 'Raizal_Residente',
    residente: 'Raizal_Residente',
    socio: 'Aliado',
    aliado: 'Aliado',
    operador: 'Operador',
    agencia: 'Aliado',
    admin: 'Super_Admin',
  };
  return map[userType] || 'Turista';
}

function normalizeRole(role) {
  const map = {
    'Super Admin': 'Super_Admin',
    'SuperAdmin': 'Super_Admin',
    'superadmin': 'Super_Admin',
    'super_admin': 'Super_Admin',
  };
  return map[role] || role;
}

/** @deprecated Alias para compatibilidad */
export const findOrCreateAirtableUser = findOrCreateLeadUser;
