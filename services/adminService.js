// Adaptación ES module para Node.js
import { fetchTable } from './airtableService.js';

export async function validateAdminPin(pin) {
  const records = await fetchTable('Usuarios_Admins', {
    filterByFormula: `AND({PIN} = '${pin}', {Activo} = TRUE())`,
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
