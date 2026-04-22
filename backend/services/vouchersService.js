/**
 * Vouchers Service — GuanaGO Admin
 * Lee y escribe en la base Airtable "Reservas seguimiento"
 * Base: appij4vUx7GZEwf5x  |  Tabla: Generador_vouchers
 */

import { config } from '../config.js';

const VOUCHER_BASE_ID = 'appij4vUx7GZEwf5x';
const VOUCHER_TABLE   = 'Generador_vouchers';
const AT_URL          = 'https://api.airtable.com/v0';

const getHeaders = () => ({
  'Authorization': `Bearer ${config.airtable.apiKey}`,
  'Content-Type': 'application/json',
});

function tableUrl(recordId = '') {
  const base = `${AT_URL}/${VOUCHER_BASE_ID}/${encodeURIComponent(VOUCHER_TABLE)}`;
  return recordId ? `${base}/${recordId}` : base;
}

// Airtable singleSelect fields return {id, name, color} objects — extract name
const sel = (v) => (v && typeof v === 'object' ? v.name : v) || '';

// Mapeo bidireccional entre estados del frontend y valores singleSelect de Airtable
const ESTADO_TO_AT = {
  'PENDIENTE':  'Pendiente',
  'CONFIRMADO': 'Reserva Confirmada',
  'CANCELADO':  'Cancelado',
  'COMPLETADO': 'Realizado',
};
const ESTADO_FROM_AT = {
  'Pendiente':          'PENDIENTE',
  'Reserva Confirmada': 'CONFIRMADO',
  'Abono Realizado':    'CONFIRMADO',
  'Realizado':          'COMPLETADO',
  'Cancelado':          'CANCELADO',
  'No llego el cliente':'CANCELADO',
};

function mapRecord(record) {
  const f = record.fields;
  const rawEstado = sel(f['Estado de la Reserva']) || f['Estado'] || '';
  return {
    id:                 record.id,
    titular:            f['Nombre del Cliente']  || '',
    reservaNum:         f['Reserva #']           || '',
    pax:                f['Numero de Personas '] || f['Numero de Personas'] || '',
    fecha:              f['Fecha de Inicio']      || '',
    hora:               f['Hora de Cita']         || '',
    puntoEncuentro:     sel(f['Punto de Encuentro']),
    observaciones:      f['Observaciones Especiales'] || '',
    notasAdicionales:   f['Notas adicionales']    || '',
    tourName:           f['Nombre del tour texto'] ||
                        (Array.isArray(f['Nombre del Servicio (from Tipo de Tour)'])
                          ? f['Nombre del Servicio (from Tipo de Tour)'][0]
                          : '') || '',
    estado:             ESTADO_FROM_AT[rawEstado] || rawEstado.toUpperCase() || 'PENDIENTE',
    estadoVoucher:      sel(f['Estado_Voucher']),
    telefono:           f['Telefono']             || '',
    email:              f['Email']                || '',
    ultimaModificacion: f['ultima modificacion']  || record.createdTime || '',
    createdTime:        record.createdTime        || '',
  };
}

/** Listar vouchers ordenados por modificación descendente */
export async function getVouchers(limit = 100) {
  const params = new URLSearchParams({
    maxRecords: String(limit),
    'sort[0][field]': 'ultima modificacion',
    'sort[0][direction]': 'desc',
  });
  const res = await fetch(`${tableUrl()}?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);
  const data = await res.json();
  return (data.records || []).map(mapRecord);
}

/** Obtener un voucher por su record ID de Airtable */
export async function getVoucherById(recordId) {
  const res = await fetch(tableUrl(recordId), { headers: getHeaders() });
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);
  return mapRecord(await res.json());
}

/** Crear un nuevo voucher */
export async function createVoucher(data) {
  const fields = {
    'Nombre del Cliente': data.titular,
    'Estado de la Reserva': data.estado || 'Pendiente',
  };
  if (data.telefono)       fields['Telefono']                   = data.telefono;
  if (data.email)          fields['Email']                      = data.email;
  if (data.pax)            fields['Numero de Personas ']        = String(data.pax);
  if (data.fecha)          fields['Fecha de Inicio']            = data.fecha;
  if (data.hora)           fields['Hora de Cita']               = data.hora;
  if (data.puntoEncuentro) fields['Punto de Encuentro']         = data.puntoEncuentro;
  if (data.observaciones)  fields['Observaciones Especiales']   = data.observaciones;
  if (data.notasAdicionales) fields['Notas adicionales']        = data.notasAdicionales;
  if (data.tourId)         fields['Tipo de Tour']               = [{ id: data.tourId }];

  const res = await fetch(tableUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Airtable error ${res.status}`);
  }
  return mapRecord(await res.json());
}

/** Actualizar estado de un voucher */
export async function updateVoucherStatus(recordId, estado) {
  const estadoAirtable = ESTADO_TO_AT[estado.toUpperCase()] || estado;
  const res = await fetch(tableUrl(recordId), {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ fields: { 'Estado de la Reserva': estadoAirtable } }),
  });
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);
  return mapRecord(await res.json());
}

/** Obtener servicios Civitatis (tabla: Servicios Turisticos, misma base) */
export async function getCivitatisServicios() {
  const SERVICIOS_TABLE = 'Servicios Turisticos';
  const url = `${AT_URL}/${VOUCHER_BASE_ID}/${encodeURIComponent(SERVICIOS_TABLE)}`;
  const params = new URLSearchParams({
    maxRecords: '100',
    'sort[0][field]': 'Nombre del Servicio',
    'sort[0][direction]': 'asc',
  });
  const res = await fetch(`${url}?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);
  const data = await res.json();
  return (data.records || []).map(r => ({
    id:             r.id,
    nombre:         r.fields['Nombre del Servicio'] || '',
    tipo:           r.fields['Tipo de Servicio']    || '',
    precioNeto:     r.fields['Precio Neto 2026']    || 0,
    horarios:       r.fields['Horarios de Salida']  || [],
  }));
}
