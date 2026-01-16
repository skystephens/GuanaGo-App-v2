// Servicio para validar acceso admin por PIN contra Airtable
import { fetchTable } from './airtableService';

export interface AdminUser {
  id: string;
  nombre: string;
  email?: string;
  pin: string;
  rol?: string;
  activo: boolean;
  permisos_especificos?: string;
}

export async function validateAdminPin(pin: string): Promise<AdminUser | null> {
  const records = await fetchTable<AdminUser>('Usuarios_Admins', {
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
