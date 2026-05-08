/**
 * Firebase-Airtable Bridge Service
 * Fuente de verdad para usuarios: tabla Leads (B2C + B2B + Admin).
 * Para usuarios con rol admin, también carga Accesos_Modulos desde Usuarios_Admins.
 */

const LEADS_TABLE = 'Leads';
const ADMINS_TABLE = 'Usuarios_Admins';

// Roles que tienen acceso al backend admin
const ADMIN_ROLES = ['Super_Admin', 'Admin', 'Junior', 'Asesor', 'Socio operador'];

const getHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
});

const leadsUrl = () =>
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(LEADS_TABLE)}`;

const adminsUrl = () =>
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(ADMINS_TABLE)}`;

/**
 * Busca usuario en Leads por Firebase UID. Si no existe, lo crea.
 * Para roles admin, también carga Accesos_Modulos desde Usuarios_Admins.
 */
export async function findOrCreateLeadUser({ firebaseUid, email, nombre, photoUrl, userType = 'turista' }) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado, retornando perfil básico');
    return {
      success: true,
      user: buildFallbackProfile({ firebaseUid, email, nombre, userType })
    };
  }

  try {
    // 1. Buscar en Leads por ID_Usuario (Firebase UID)
    const escapedUid = String(firebaseUid || '').replace(/'/g, "''");
    const byUidUrl = `${leadsUrl()}?filterByFormula=${encodeURIComponent(`{ID_Usuario}='${escapedUid}'`)}`;

    const uidRes = await fetch(byUidUrl, { headers: getHeaders() });
    if (!uidRes.ok) throw new Error(`Leads UID search error: ${uidRes.status}`);
    const uidData = await uidRes.json();

    let leadsRecord = uidData.records?.[0] || null;

    // 2. Fallback: buscar por email (usuario registrado antes de tener Firebase_UID)
    if (!leadsRecord && email) {
      const escapedEmail = String(email).replace(/'/g, "''");
      const byEmailUrl = `${leadsUrl()}?filterByFormula=${encodeURIComponent(`{Email}='${escapedEmail}'`)}`;
      const emailRes = await fetch(byEmailUrl, { headers: getHeaders() });
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        leadsRecord = emailData.records?.[0] || null;
        // Vincular Firebase UID al registro existente
        if (leadsRecord) {
          await patchLead(leadsRecord.id, { ID_Usuario: firebaseUid });
        }
      }
    }

    // 3. Encontrado → actualizar última interacción y retornar perfil
    if (leadsRecord) {
      await patchLead(leadsRecord.id, { 'Última_Interacción': new Date().toISOString() });
      const profile = await buildProfile(leadsRecord, firebaseUid);
      return { success: true, user: profile };
    }

    // 4. No existe → crear nuevo Lead
    console.log('📝 Creando nuevo Lead en Airtable:', email);
    // Verificar si el email ya tiene rol en Usuarios_Admins (ej: info@guiasai.com)
    const adminRole = email ? await fetchAdminRoleByEmail(email) : null;
    const role = (adminRole && ADMIN_ROLES.includes(adminRole)) ? adminRole : mapUserTypeToRole(userType);
    const autoActive = !['socio', 'aliado', 'operador'].includes(userType);

    const createRes = await fetch(leadsUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Nombre: nombre || email.split('@')[0],
            Email: email,
            ID_Usuario: firebaseUid,
            Role: role,
            Estado_del_Lead: 'Nuevo',
            Fecha_de_Registro: new Date().toISOString(),
            'Última_Interacción': new Date().toISOString(),
            Metodo_de_Auth: 'Firebase',
            Saldo_GUANA: 0
          }
        }]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('❌ Error creando Lead:', errText);
      throw new Error(`Lead create error: ${createRes.status}`);
    }

    const createData = await createRes.json();
    const newRecord = createData.records[0];
    const profile = await buildProfile(newRecord, firebaseUid);

    return {
      success: true,
      user: profile,
      isNew: true,
      requiresApproval: !autoActive,
      message: autoActive
        ? '¡Bienvenido a GuanaGO!'
        : '¡Solicitud enviada! Un administrador revisará tu cuenta pronto.'
    };

  } catch (error) {
    console.error('❌ Error en findOrCreateLeadUser:', error);
    return { success: false, error: 'Error al buscar/crear perfil de usuario' };
  }
}

/**
 * Para usuarios admin, carga sus módulos autorizados desde Usuarios_Admins.
 * @returns {Promise<string[]>} array de nombres de módulos
 */
async function fetchAdminAccesos(firebaseUid) {
  try {
    const escapedUid = String(firebaseUid || '').replace(/'/g, "''");
    const url = `${adminsUrl()}?filterByFormula=${encodeURIComponent(`{Firebase_UID}='${escapedUid}'`)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.records?.length) return [];

    const record = data.records[0];

    // Actualizar Ultimo acceso sin bloquear
    fetch(`${adminsUrl()}/${record.id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields: { 'Ultimo acceso': new Date().toISOString() } })
    }).catch(() => {});

    const accesos = record.fields.Accesos_Modulos;
    if (!Array.isArray(accesos)) return [];
    // Airtable devuelve multipleSelects como [{id, name, color}]
    return accesos.map(a => (typeof a === 'object' ? a.name : a));

  } catch (e) {
    console.warn('⚠️ No se pudo cargar Accesos_Modulos:', e.message);
    return [];
  }
}

/**
 * Si el email existe en Usuarios_Admins, retorna su rol normalizado.
 * Permite asignar el rol correcto al crear un Lead para un admin existente.
 */
async function fetchAdminRoleByEmail(email) {
  try {
    const escapedEmail = String(email).replace(/'/g, "''");
    const url = `${adminsUrl()}?filterByFormula=${encodeURIComponent(`{Email}='${escapedEmail}'`)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.records?.length) return null;
    const record = data.records[0];
    const rol = record.fields.Rol || record.fields.Role;
    if (!rol) return null;
    const name = typeof rol === 'object' ? rol.name : rol;
    return normalizeRole(name);
  } catch {
    return null;
  }
}

async function patchLead(recordId, fields) {
  try {
    await fetch(`${leadsUrl()}/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields })
    });
  } catch (e) {
    console.warn('⚠️ No se pudo actualizar Lead:', e.message);
  }
}

async function buildProfile(record, firebaseUid) {
  const f = record.fields;
  const role = normalizeRole(f.Role || f.Rol || 'Turista');

  let accesos = [];
  if (ADMIN_ROLES.includes(role)) {
    accesos = await fetchAdminAccesos(firebaseUid);
  }

  return {
    id: record.id,
    email: f.Email || '',
    nombre: f.Nombre || '',
    role,
    saldo: f.Saldo_GUANA || 0,
    verificado: f.Verificado === true,
    estado: f.Estado_del_Lead?.name || f.Estado_del_Lead || 'Activo',
    tipoCliente: f.Tipo_Cliente?.name || f.Tipo_Cliente || null,
    accesos,
    firebaseUid
  };
}

function buildFallbackProfile({ firebaseUid, email, nombre, userType }) {
  return {
    id: firebaseUid,
    email: email || '',
    nombre: nombre || email?.split('@')[0] || '',
    role: mapUserTypeToRole(userType),
    saldo: 0,
    verificado: true,
    estado: 'Activo',
    accesos: [],
    firebaseUid
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
    admin: 'Super_Admin'
  };
  return map[userType] || 'Turista';
}

function normalizeRole(role) {
  const normalize = {
    'Super Admin': 'Super_Admin',
    'SuperAdmin': 'Super_Admin',
    'superadmin': 'Super_Admin',
    'super_admin': 'Super_Admin'
  };
  return normalize[role] || role;
}

/** @deprecated Usar findOrCreateLeadUser */
export const findOrCreateAirtableUser = findOrCreateLeadUser;
