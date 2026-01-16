// Servicio para validar acceso admin por PIN contra Airtable
import { airtableService } from './airtableService';
const { fetchTable } = airtableService;
import type { GuanaUser, UserRole } from '../types';

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
      nombre: user.nombre,
      email: user.email,
      pin: user.pin,
      rol: user.rol,
      activo: user.activo,
      permisos_especificos: user.permisos_especificos
    };
  }
  return null;
}
