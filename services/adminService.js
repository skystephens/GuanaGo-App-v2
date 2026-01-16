/**
 * Admin Service - Validación de PIN sin dependencias externas
 * Conexión directa a Airtable usando fetch nativo
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';

export async function validateAdminPin(pin) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable credentials not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      filterByFormula: `AND({PIN} = '${pin}', {Activo} = TRUE())`,
      maxRecords: '1'
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
      console.error('❌ Airtable API Error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const user = data.records[0].fields;
      return {
        id: data.records[0].id,
        nombre: user.Nombre,
        email: user.Email,
        pin: user.PIN,
        rol: user.Rol,
        activo: user.Activo,
        permisos_especificos: user.Permisos_Especificos
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error validating admin PIN:', error);
    return null;
  }
}
