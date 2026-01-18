import { config } from '../config.js';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

const getHeaders = () => ({
  'Authorization': `Bearer ${config.airtable.apiKey}`,
  'Content-Type': 'application/json'
});

const tableNameRequests = 'AvailabilityRequests';
const tableNameReservations = 'Reservations';

export async function createAvailabilityRequest(payload) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameRequests)}`;

  const fields = {
    AlojamientoId: payload.alojamientoId,
    SocioId: payload.socioId || '',
    UsuarioId: payload.usuarioId || '',
    CheckIn: payload.checkIn,
    CheckOut: payload.checkOut,
    Adultos: payload.adultos ?? 1,
    Ninos: payload.ninos ?? 0,
    Bebes: payload.bebes ?? 0,
    Estado: 'pending',
    TarifaConfirmada: payload.tarifaConfirmada ?? null,
    Moneda: payload.currency || 'COP',
    Notas: payload.notas || '',
    ExpiresAt: payload.expiresAt || null,
    ContactoNombre: payload.contactName || '',
    ContactoEmail: payload.contactEmail || '',
    ContactoWhatsapp: payload.contactWhatsapp || ''
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ records: [{ fields }] })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error creando solicitud en Airtable');
  }
  return data.records?.[0];
}

export async function updateAvailabilityRequest(id, updates) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameRequests)}`;
  const fields = {};

  if (updates.estado) fields.Estado = updates.estado;
  if (updates.tarifaConfirmada !== undefined) fields.TarifaConfirmada = updates.tarifaConfirmada;
  if (updates.currency) fields.Moneda = updates.currency;
  if (updates.condiciones) fields.Condiciones = updates.condiciones;
  if (updates.expiresAt) fields.ExpiresAt = updates.expiresAt;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ records: [{ id, fields }] })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error actualizando solicitud en Airtable');
  }
  return data.records?.[0];
}

export async function listAvailabilityRequests({ socioId, usuarioId } = {}) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameRequests)}?pageSize=100`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error listando solicitudes en Airtable');
  }
  let records = data.records || [];
  if (socioId) records = records.filter(r => (r.fields?.SocioId || '') === socioId);
  if (usuarioId) records = records.filter(r => (r.fields?.UsuarioId || '') === usuarioId);
  return records;
}

export async function createReservationFromRequest(requestRecord, paymentInfo) {
  const baseId = config.airtable.baseId;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableNameReservations)}`;

  const f = requestRecord.fields || {};
  const fields = {
    RequestId: requestRecord.id,
    AlojamientoId: f.AlojamientoId,
    SocioId: f.SocioId || '',
    UsuarioId: f.UsuarioId || '',
    CheckIn: f.CheckIn,
    CheckOut: f.CheckOut,
    Adultos: f.Adultos || 1,
    Ninos: f.Ninos || 0,
    Bebes: f.Bebes || 0,
    MontoPagado: paymentInfo.monto || f.TarifaConfirmada || 0,
    Moneda: paymentInfo.currency || f.Moneda || 'COP',
    Estado: 'paid',
    MetodoPago: paymentInfo.method || 'payu',
    TransactionId: paymentInfo.transactionId || ''
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ records: [{ fields }] })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error creando reserva en Airtable');
  }
  return data.records?.[0];
}
