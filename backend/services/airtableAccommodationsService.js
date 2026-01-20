import { config } from '../config.js';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

const getHeaders = () => ({
  'Authorization': `Bearer ${config.airtable.apiKey}`,
  'Content-Type': 'application/json'
});

const tableNameSubmissions = 'Alojamientos_Solicitudes';

export async function createAccommodationSubmission(payload) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameSubmissions)}`;

  const fields = {
    Estado: 'pending',
    FechaSolicitud: new Date().toISOString(),

    // Identidad del socio/usuario
    SocioId: payload.socioId || '',
    UsuarioId: payload.usuarioId || '',

    // Datos principales del alojamiento
    'Nombre Alojamiento': payload.nombreAlojamiento || '',
    'Tipo de Alojamiento': payload.tipoAlojamiento || '',
    Ubicacion: payload.ubicacion || 'San Andrés',
    Direccion: payload.direccion || '',
    Descripcion: payload.descripcion || '',

    // Capacidades y amenidades
    'Capacidad Maxima': payload.capacidadMaxima ?? null,
    'Camas Sencillas': payload.camasSencillas ?? null,
    'Camas Dobles': payload.camasDobles ?? null,
    'Tiene Cocina': payload.tieneCocina === true,
    'Incluye Desayuno': payload.incluyeDesayuno === true,

    // Política de bebés
    'Acepta Bebes': payload.aceptaBebes === true,
    'Politica Bebes': payload.politicaBebes || '',

    // Reglas de estadía
    'Minimo Noches': payload.minimoNoches ?? 1,
    'Moneda Precios': payload.monedaPrecios || 'COP',

    // Precios por huésped (por noche)
    'Precio 1 Huesped': payload.precio1 ?? null,
    'Precio 2 Huespedes': payload.precio2 ?? null,
    'Precio 3 Huespedes': payload.precio3 ?? null,
    'Precio 4+ Huespedes': payload.precio4 ?? null,

    // Contacto
    'Telefono Contacto': payload.telefonoContacto || '',
    'Email Contacto': payload.emailContacto || ''
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ records: [{ fields }] })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error creando solicitud de alojamiento en Airtable');
  }
  return data.records?.[0];
}

export async function listAccommodationSubmissions({ socioId, usuarioId } = {}) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameSubmissions)}?pageSize=100`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error listando solicitudes de alojamientos en Airtable');
  }
  let records = data.records || [];
  if (socioId) records = records.filter(r => (r.fields?.SocioId || '') === socioId);
  if (usuarioId) records = records.filter(r => (r.fields?.UsuarioId || '') === usuarioId);
  return records;
}

export async function updateAccommodationSubmission(id, updates) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameSubmissions)}`;
  const fields = {};

  if (updates.estado) fields.Estado = updates.estado;
  if (updates.notasAdmin) fields.NotasAdmin = updates.notasAdmin;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ records: [{ id, fields }] })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error actualizando solicitud de alojamiento en Airtable');
  }
  return data.records?.[0];
}
