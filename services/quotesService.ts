/**
 * Quotes Service - Gestión de Cotizaciones
 * Maneja CRUD de cotizaciones y validación de horarios/disponibilidad
 */

import { Cotizacion, CotizacionItem, QuoteStatus, QuoteItemStatus, Tour } from '../types';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const TABLES = {
  COTIZACIONES: 'CotizacionesGG',
  COTIZACIONES_ITEMS: 'cotizaciones_Items',
  SERVICIOS: 'ServiciosTuristicos_SAI'
};

const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
});

// =========================================================
// 📊 HELPERS - Validación de Horarios
// =========================================================

/**
 * Parsear horario "HH:MM" a minutos desde medianoche
 */
function parseTimeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verificar si dos rangos de tiempo se solapan
 */
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  
  // No overlap si uno termina antes de que el otro empiece
  return !(e1 <= s2 || e2 <= s1);
}

/**
 * Validar que no haya conflictos de horarios en la misma fecha
 */
export function validateScheduleConflicts(
  newItem: Partial<CotizacionItem>,
  existingItems: CotizacionItem[]
): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  if (!newItem.fecha || !newItem.horarioInicio || !newItem.horarioFin) {
    return { valid: true, conflicts };
  }
  
  // Filtrar items de la misma fecha
  const sameDay = existingItems.filter(item => item.fecha === newItem.fecha);
  
  for (const item of sameDay) {
    if (!item.horarioInicio || !item.horarioFin) continue;
    
    // Verificar solapamiento
    if (timesOverlap(newItem.horarioInicio, newItem.horarioFin, item.horarioInicio, item.horarioFin)) {
      conflicts.push(`Conflicto con ${item.servicioNombre} (${item.horarioInicio} - ${item.horarioFin})`);
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

/**
 * Validar capacidad de un servicio
 */
export function validateCapacity(
  servicio: Tour,
  adultos: number,
  ninos: number,
  bebes: number
): { valid: boolean; message?: string } {
  const total = adultos + ninos + bebes;
  const capacity = servicio.capacity || servicio.capacidad || 999;
  
  if (total > capacity) {
    return {
      valid: false,
      message: `Capacidad máxima: ${capacity} personas. Solicitado: ${total}`
    };
  }
  
  return { valid: true };
}

/**
 * Validar día de operación
 */
export function validateOperatingDay(
  servicio: Tour,
  fecha: string
): { valid: boolean; message?: string } {
  const diasOperacion = servicio.operatingDays || servicio.diasOperacion || '';
  
  if (!diasOperacion) {
    // Si no hay restricción, asume que opera todos los días
    return { valid: true };
  }
  
  const date = new Date(fecha);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[date.getDay()];
  
  // Verificar si el día está en la lista de días de operación
  if (!diasOperacion.toLowerCase().includes(dayName.toLowerCase())) {
    return {
      valid: false,
      message: `${servicio.title || servicio.nombre} no opera los ${dayName}. Días disponibles: ${diasOperacion}`
    };
  }
  
  return { valid: true };
}

// =========================================================
// 📋 CRUD - COTIZACIONES
// =========================================================

/**
 * Obtener todas las cotizaciones
 */
export async function getCotizaciones(): Promise<Cotizacion[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado');
    return [];
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES)}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const cotizaciones = data.records.map(mapRecordToCotizacion);
    
    console.log(`✅ Cargadas ${cotizaciones.length} cotizaciones`);
    return cotizaciones;
  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones:', error);
    return [];
  }
}

/**
 * Obtener cotización por ID con sus items
 */
export async function getCotizacionById(id: string): Promise<Cotizacion | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado');
    return null;
  }

  try {
    // Obtener cotización
    const cotUrl = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES)}/${id}`;
    const cotResponse = await fetch(cotUrl, {
      headers: getHeaders()
    });

    if (!cotResponse.ok) {
      throw new Error(`Error ${cotResponse.status}`);
    }

    const cotData = await cotResponse.json();
    const cotizacion = mapRecordToCotizacion(cotData);

    // Obtener items de esta cotizaci\u00f3n
    const items = await getCotizacionItems(id);
    cotizacion.items = items;

    return cotizacion;
  } catch (error) {
    console.error('❌ Error obteniendo cotizaci\u00f3n:', error);
    return null;
  }
}

/**
 * Obtener items de una cotización
 */
export async function getCotizacionItems(cotizacionId: string): Promise<CotizacionItem[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  try {
    // Filtrar por cotizacionId
    const filterFormula = `{Cotizacion}='${cotizacionId}'`;
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES_ITEMS)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    const items = data.records.map(mapRecordToCotizacionItem);
    
    console.log(`✅ Cargados ${items.length} items para cotización ${cotizacionId}`);
    return items;
  } catch (error) {
    console.error('❌ Error obteniendo items:', error);
    return [];
  }
}

/**
 * Crear nueva cotización
 */
export async function createCotizacion(
  cotizacion: Omit<Cotizacion, 'id'>
): Promise<Cotizacion | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado');
    return null;
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: mapCotizacionToFields(cotizacion)
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const created = data.records?.[0];
    
    if (created) {
      console.log('✅ Cotización creada:', created.id);
      return mapRecordToCotizacion(created);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error creando cotización:', error);
    return null;
  }
}

/**
 * Agregar item a cotización
 */
export async function addCotizacionItem(
  item: Omit<CotizacionItem, 'id'>
): Promise<CotizacionItem | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado');
    return null;
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES_ITEMS)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: mapCotizacionItemToFields(item)
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const created = data.records?.[0];
    
    if (created) {
      console.log('✅ Item agregado:', created.id);
      return mapRecordToCotizacionItem(created);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error agregando item:', error);
    return null;
  }
}

/**
 * Actualizar cotización
 */
export async function updateCotizacion(
  id: string,
  updates: Partial<Cotizacion>
): Promise<Cotizacion | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES)}/${id}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: mapCotizacionToFields(updates)
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Cotización actualizada:', id);
    return mapRecordToCotizacion(data);
  } catch (error) {
    console.error('❌ Error actualizando cotización:', error);
    return null;
  }
}

/**
 * Eliminar item de cotización
 */
export async function deleteCotizacionItem(id: string): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.COTIZACIONES_ITEMS)}/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    console.log('✅ Item eliminado:', id);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando item:', error);
    return false;
  }
}

// =========================================================
// 🔄 MAPEO AIRTABLE ↔ INTERFACES
// =========================================================

function mapRecordToCotizacion(record: any): Cotizacion {
  const f = record.fields;
  
  return {
    id: record.id,
    nombre: f.Nombre || f.nombre || '',
    email: f.Email || f.email || '',
    telefono: f.Telefono || f.telefono || '',
    fechaInicio: f['Fecha Inicio'] || f.fechaInicio || '',
    fechaFin: f['Fecha Fin'] || f.fechaFin || '',
    adultos: parseInt(f['Adultos 18 - 99 años'] || f.Adultos || '0') || 0,
    ninos: parseInt(f['Niños 4 - 18 años'] || f.Ninos || '0') || 0,
    bebes: parseInt(f['Bebes 0 - 3 años'] || f.Bebes || '0') || 0,
    fechaCreacion: f['Fecha Creacion'] || f.fechaCreacion || record.createdTime,
    estado: (f.Estado || 'draft') as QuoteStatus,
    precioTotal: parseFloat(f['Precio total'] || f.precioTotal || '0') || 0,
    notasInternas: f['Notas internas'] || f.notasInternas || ''
  };
}

function mapCotizacionToFields(cotizacion: Partial<Cotizacion>): Record<string, any> {
  const fields: Record<string, any> = {};
  
  if (cotizacion.nombre !== undefined) fields.Nombre = cotizacion.nombre;
  if (cotizacion.email !== undefined) fields.Email = cotizacion.email;
  if (cotizacion.telefono !== undefined) fields.Telefono = cotizacion.telefono;
  if (cotizacion.fechaInicio !== undefined) fields['Fecha Inicio'] = cotizacion.fechaInicio;
  if (cotizacion.fechaFin !== undefined) fields['Fecha Fin'] = cotizacion.fechaFin;
  if (cotizacion.adultos !== undefined) fields['Adultos 18 - 99 años'] = cotizacion.adultos;
  if (cotizacion.ninos !== undefined) fields['Niños 4 - 18 años'] = cotizacion.ninos;
  if (cotizacion.bebes !== undefined) fields['Bebes 0 - 3 años'] = cotizacion.bebes;
  if (cotizacion.estado !== undefined) fields.Estado = cotizacion.estado;
  if (cotizacion.precioTotal !== undefined) fields['Precio total'] = cotizacion.precioTotal;
  if (cotizacion.notasInternas !== undefined) fields['Notas internas'] = cotizacion.notasInternas;
  
  return fields;
}

function mapRecordToCotizacionItem(record: any): CotizacionItem {
  const f = record.fields;
  
  return {
    id: record.id,
    cotizacionId: f.Cotizacion?.[0] || f.cotizacionId || '',
    servicioId: f.Servicio?.[0] || f.servicioId || '',
    servicioNombre: f.Nombre || f.servicioNombre || '',
    servicioTipo: (f.Tipo || 'tour') as 'tour' | 'hotel' | 'taxi' | 'package',
    fecha: f['Fecha inicio'] || f.fecha || '',
    horarioInicio: f['Horario Inicio'] || f.horarioInicio || '',
    horarioFin: f['Horario Fin'] || f.horarioFin || '',
    adultos: parseInt(f['Adultos 18 - 99 años'] || f.adultos || '0') || 0,
    ninos: parseInt(f['Niños 4 - 18 años'] || f.ninos || '0') || 0,
    bebes: parseInt(f['Bebes 0 - 3 años'] || f.bebes || '0') || 0,
    precioUnitario: parseFloat(f['Precio Unitario'] || f.precioUnitario || '0') || 0,
    subtotal: parseFloat(f['Precio Subtotal'] || f.subtotal || '0') || 0,
    status: (f.Status || 'disponible') as QuoteItemStatus,
    conflictos: []
  };
}

function mapCotizacionItemToFields(item: Partial<CotizacionItem>): Record<string, any> {
  const fields: Record<string, any> = {};
  
  if (item.cotizacionId !== undefined) fields.Cotizacion = [item.cotizacionId];
  if (item.servicioId !== undefined) fields.Servicio = [item.servicioId];
  if (item.servicioNombre !== undefined) fields.Nombre = item.servicioNombre;
  if (item.servicioTipo !== undefined) fields.Tipo = item.servicioTipo;
  if (item.fecha !== undefined) fields['Fecha inicio'] = item.fecha;
  if (item.horarioInicio !== undefined) fields['Horario Inicio'] = item.horarioInicio;
  if (item.horarioFin !== undefined) fields['Horario Fin'] = item.horarioFin;
  if (item.adultos !== undefined) fields['Adultos 18 - 99 años'] = item.adultos;
  if (item.ninos !== undefined) fields['Niños 4 - 18 años'] = item.ninos;
  if (item.bebes !== undefined) fields['Bebes 0 - 3 años'] = item.bebes;
  if (item.precioUnitario !== undefined) fields['Precio Unitario'] = item.precioUnitario;
  if (item.subtotal !== undefined) fields['Precio Subtotal'] = item.subtotal;
  if (item.status !== undefined) fields.Status = item.status;
  
  return fields;
}

export default {
  getCotizaciones,
  getCotizacionById,
  getCotizacionItems,
  createCotizacion,
  addCotizacionItem,
  updateCotizacion,
  deleteCotizacionItem,
  validateScheduleConflicts,
  validateCapacity,
  validateOperatingDay
};
