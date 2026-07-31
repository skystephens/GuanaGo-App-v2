/**
 * Finance Service — Cuentas por cobrar (clientes) y por pagar (proveedores)
 * Tablas: Reservas_grupo, Pago_proveedores, Pagos (reusada)
 */

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const TABLES = {
  RESERVAS_GRUPO: 'Reservas_grupo',
  PAGO_PROVEEDORES: 'Pago_proveedores',
  PAGOS: 'Pagos',
};

const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

export interface ReservaGrupo {
  id: string;
  clienteHotel: string;
  cliente: string;
  hotel: string;
  habitaciones: string[];
  totalPax: number;
  fecha: string;
  totalReservaInicial: number;
  nochesAdicionales: number;
  costoNocheAdicional: number;
  comisionExtra: number;
  totalReservaFinal: number;
  totalOperador: number;
  comisionGuia: number;
  notas: string;
  // Calculados
  abonadoCliente: number;
  saldoCliente: number;
  pagadoOperador: number;
  saldoOperador: number;
}

export interface PagoProveedorItem {
  id: string;
  proveedor: string;
  reservaGrupo: string;
  fechaPago: string;
  montoPagado: number;
  notas: string;
}

export interface AbonoClienteItem {
  id: string;
  referencia: string;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  notas: string;
}

async function fetchAllRecords(tabla: string): Promise<any[]> {
  const baseUrl = `${AIRTABLE_API_URL}/${encodeURIComponent(tabla)}`;
  let allRecords: any[] = [];
  let offset: string | undefined;

  do {
    const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`Error ${response.status} cargando ${tabla}`);
    const page = await response.json();
    allRecords = allRecords.concat(page.records || []);
    offset = page.offset;
  } while (offset);

  return allRecords;
}

export async function getFinanzas(): Promise<{
  reservas: ReservaGrupo[];
  pagosProveedores: PagoProveedorItem[];
  abonosClientes: AbonoClienteItem[];
}> {
  const [reservasRaw, pagosProvRaw, pagosRaw] = await Promise.all([
    fetchAllRecords(TABLES.RESERVAS_GRUPO),
    fetchAllRecords(TABLES.PAGO_PROVEEDORES),
    fetchAllRecords(TABLES.PAGOS),
  ]);

  const pagosProveedores: PagoProveedorItem[] = pagosProvRaw.map(r => ({
    id: r.id,
    proveedor: r.fields['Proveedor'] || '',
    reservaGrupo: r.fields['Reserva_Grupo'] || '',
    fechaPago: r.fields['Fecha_Pago'] || '',
    montoPagado: r.fields['Monto_Pagado'] || 0,
    notas: r.fields['Notas'] || '',
  }));

  // Solo los pagos de Pagos cuya Referencia coincide con un Cliente_Hotel real
  // (la tabla Pagos también se usa para el modelo legado de Reservas, se ignora el resto)
  const clienteHotelSet = new Set(reservasRaw.map(r => r.fields['Cliente_Hotel']));
  const abonosClientes: AbonoClienteItem[] = pagosRaw
    .filter(r => clienteHotelSet.has(r.fields['Referencia']))
    .map(r => ({
      id: r.id,
      referencia: r.fields['Referencia'] || '',
      monto: r.fields['Monto'] || 0,
      metodoPago: r.fields['Metodo_Pago'] || '',
      fechaPago: r.fields['Fecha_Pago'] || '',
      notas: '',
    }));

  const reservas: ReservaGrupo[] = reservasRaw.map(r => {
    const f = r.fields;
    const clienteHotel = f['Cliente_Hotel'] || '';
    const totalReservaFinal = f['Total_Reserva_Final'] || f['Total_Reserva_Inicial'] || 0;
    const totalOperador = f['Total_Operador'] || 0;

    const abonadoCliente = abonosClientes
      .filter(a => a.referencia === clienteHotel)
      .reduce((sum, a) => sum + a.monto, 0);

    const pagadoOperador = pagosProveedores
      .filter(p => p.reservaGrupo === clienteHotel)
      .reduce((sum, p) => sum + p.montoPagado, 0);

    return {
      id: r.id,
      clienteHotel,
      cliente: f['Cliente'] || '',
      hotel: f['Hotel'] || '',
      habitaciones: f['Habitaciones'] || [],
      totalPax: f['Total_Pax'] || 0,
      fecha: f['Fecha'] || '',
      totalReservaInicial: f['Total_Reserva_Inicial'] || 0,
      nochesAdicionales: f['Noches_Adicionales'] || 0,
      costoNocheAdicional: f['Costo_Noche_Adicional'] || 0,
      comisionExtra: f['Comision_Extra'] || 0,
      totalReservaFinal,
      totalOperador,
      comisionGuia: f['Comision_Guia'] || 0,
      notas: f['Notas'] || '',
      abonadoCliente,
      saldoCliente: totalReservaFinal - abonadoCliente,
      pagadoOperador,
      saldoOperador: totalOperador - pagadoOperador,
    };
  });

  return { reservas, pagosProveedores, abonosClientes };
}

export async function createReservaGrupo(data: Partial<ReservaGrupo>): Promise<any> {
  const clienteHotel = data.clienteHotel || `${data.cliente || ''} - ${data.hotel || ''}`;
  const fields: Record<string, any> = {
    'Cliente_Hotel': clienteHotel,
    'Cliente': data.cliente,
    'Hotel': data.hotel,
    'Total_Pax': data.totalPax,
    'Fecha': data.fecha,
    'Total_Reserva_Inicial': data.totalReservaInicial,
    'Noches_Adicionales': data.nochesAdicionales,
    'Costo_Noche_Adicional': data.costoNocheAdicional,
    'Comision_Extra': data.comisionExtra,
    'Total_Reserva_Final': data.totalReservaFinal,
    'Total_Operador': data.totalOperador,
    'Comision_Guia': data.comisionGuia,
    'Notas': data.notas,
  };
  if (data.habitaciones && data.habitaciones.length > 0) fields['Habitaciones'] = data.habitaciones;
  Object.keys(fields).forEach(k => (fields[k] === undefined || fields[k] === '') && delete fields[k]);

  const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.RESERVAS_GRUPO)}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!response.ok) throw new Error(`Error ${response.status} creando reserva`);
  return response.json();
}

export async function createPagoProveedor(data: { proveedor: string; reservaGrupo: string; fechaPago: string; montoPagado: number; notas?: string }): Promise<any> {
  const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PAGO_PROVEEDORES)}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      fields: {
        'Proveedor': data.proveedor,
        'Reserva_Grupo': data.reservaGrupo,
        'Fecha_Pago': data.fechaPago,
        'Monto_Pagado': data.montoPagado,
        'Notas': data.notas || '',
      },
      typecast: true,
    }),
  });
  if (!response.ok) throw new Error(`Error ${response.status} creando pago a proveedor`);
  return response.json();
}

export async function createAbonoCliente(data: { referencia: string; monto: number; metodoPago: string; fechaPago: string }): Promise<any> {
  const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PAGOS)}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      fields: {
        'Referencia': data.referencia,
        'Monto': data.monto,
        'Metodo_Pago': data.metodoPago,
        'Estado': 'Aprobado',
        'Fecha_Pago': data.fechaPago,
      },
      typecast: true,
    }),
  });
  if (!response.ok) throw new Error(`Error ${response.status} creando abono de cliente`);
  return response.json();
}
