/**
 * Admin Service - Backend version (Node.js compatible)
 * Validates admin access via PIN against Airtable
 */
import { config } from '../backend/config.js';

const AIRTABLE_API_KEY = config.airtable.apiKey;
const AIRTABLE_BASE_ID = config.airtable.baseId;
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

/**
 * Escape special characters for Airtable formula to prevent injection
 */
function escapeFormulaValue(value) {
  if (typeof value !== 'string') return value;
  // Escape single quotes and backslashes for Airtable formula
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Fetch records from an Airtable table
 */
async function fetchTable(tableName, options = {}) {
  const url = new URL(`${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}`);
  
  if (options.filterByFormula) {
    url.searchParams.append('filterByFormula', options.filterByFormula);
  }
  if (options.maxRecords) {
    url.searchParams.append('maxRecords', options.maxRecords.toString());
  }
  if (options.view) {
    url.searchParams.append('view', options.view);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Database request failed');
  }
  
  const data = await response.json();
  return data.records || [];
}

/**
 * Validate admin PIN against Airtable Usuarios_Admins table
 */
export async function validateAdminPin(pin) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Admin validation service not available');
    return null;
  }
  
  // Sanitize PIN to prevent formula injection
  const sanitizedPin = escapeFormulaValue(pin);
  
  const records = await fetchTable('Usuarios_Admins', {
    filterByFormula: `AND({PIN} = '${sanitizedPin}', {Activo} = TRUE())`,
    maxRecords: 1
  });
  
  if (records.length > 0) {
    const user = records[0].fields;
    return {
      id: records[0].id,
      nombre: user.Nombre,
      email: user.Email,
      pin: user.PIN,
      rol: user.Rol,
      activo: user.Activo,
      permisos_especificos: user.Permisos_Especificos
    };
  }
  return null;
}
