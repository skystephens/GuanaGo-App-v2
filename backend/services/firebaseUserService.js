/**
 * Firebase-Airtable Bridge Service
 * Busca o crea usuarios en Airtable vinculados a Firebase UID
 */

const USUARIOS_TABLE = 'Usuarios_Admins';

// Obtener config dinámicamente (evita problemas de carga de módulos ES)
const getAirtableHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
});

const baseUrl = () => `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(USUARIOS_TABLE)}`;

/**
 * Busca usuario en Airtable por email. Si no existe, lo crea.
 */
export async function findOrCreateAirtableUser({ firebaseUid, email, nombre, photoUrl, userType }) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado, retornando perfil basico');
    return {
      success: true,
      user: {
        id: firebaseUid,
        email,
        nombre: nombre || email.split('@')[0],
        role: mapUserType(userType),
        saldo: 0,
        nivel: 'Bronce',
        verificado: true,
        firebaseUid
      }
    };
  }

  try {
    // 1. Buscar por email en Airtable
    const escapedEmail = String(email || '').replace(/'/g, "''");
    const searchUrl = `${baseUrl()}?filterByFormula=${encodeURIComponent(`{Email}='${escapedEmail}'`)}`;

    const searchRes = await fetch(searchUrl, { headers: getAirtableHeaders() });
    if (!searchRes.ok) {
      throw new Error(`Airtable search error: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();

    // 2a. Usuario encontrado → actualizar Firebase_UID y retornar perfil
    if (searchData.records && searchData.records.length > 0) {
      const record = searchData.records[0];
      const fields = record.fields;

      // Intentar actualizar ultimo acceso (ignorar si falla)
      try {
        await fetch(`${baseUrl()}/${record.id}`, {
          method: 'PATCH',
          headers: getAirtableHeaders(),
          body: JSON.stringify({
            fields: {
              'Ultimo acceso': new Date().toISOString()
            }
          })
        });
      } catch (e) {
        // Silenciar - el campo puede no existir
      }

      return {
        success: true,
        user: extractProfile(record, firebaseUid)
      };
    }

    // 2b. Usuario no encontrado → crear nuevo registro
    console.log('📝 Creando nuevo usuario en Airtable:', email);
    const rol = mapUserType(userType);
    const autoApprove = userType === 'turista' || userType === 'local';

    // Crear con campos básicos que existen en la tabla
    const createRes = await fetch(baseUrl(), {
      method: 'POST',
      headers: getAirtableHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Email: email,
            Nombre: nombre || email.split('@')[0],
            Rol: rol,
            Activo: autoApprove,
            'Fecha_de_Creacion': new Date().toISOString(),
            'Ultimo acceso': new Date().toISOString()
          }
        }]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('❌ Error creando usuario:', errText);
      throw new Error(`Airtable create error: ${createRes.status}`);
    }

    const createData = await createRes.json();
    const newRecord = createData.records[0];

    const requiresApproval = !autoApprove;

    return {
      success: true,
      user: extractProfile(newRecord, firebaseUid),
      isNew: true,
      requiresApproval,
      message: requiresApproval
        ? '¡Solicitud enviada! Un administrador revisará tu solicitud pronto.'
        : '¡Bienvenido a GuanaGO!'
    };

  } catch (error) {
    console.error('❌ Error en findOrCreateAirtableUser:', error);
    return { success: false, error: 'Error al buscar/crear perfil de usuario' };
  }
}

function mapUserType(userType) {
  switch (userType) {
    case 'turista': return 'Turista';
    case 'local': return 'Local';
    case 'socio': return 'Socio';
    case 'admin': return 'SuperAdmin';
    default: return 'Turista';
  }
}

function extractProfile(record, firebaseUid) {
  const f = record.fields;
  // Normalizar rol (la tabla puede tener "Super Admin" con espacio)
  let role = f.Rol || f.Role || 'Turista';
  if (role === 'Super Admin') role = 'SuperAdmin';

  return {
    id: record.id,
    email: f.Email || '',
    nombre: f.Nombre || '',
    role,
    saldo: f.Saldo_GUANA || 0,
    nivel: f.Nivel || 'Bronce',
    puntos: f.Puntos_Acumulados || 0,
    verificado: f.Activo === true,
    firebaseUid
  };
}
