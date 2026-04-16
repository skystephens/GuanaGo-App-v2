/**
 * GuiaSAI Services - Integración con Airtable
 * Trae datos de ServiciosTuristicos_SAI para cotizaciones
 *
 * 🆕 OPTIMIZACIÓN: Ahora usa JSON estático como fuente principal para:
 * - Alojamientos, Tours y Transportes (precios y fotos)
 * - Reduce llamadas a Airtable a CERO para datos estáticos
 * - Airtable solo se usa para: Cotizaciones, Agencias, Leads
 */

import axios from 'axios'
import {
  getAccommodationsFromJSON,
  getToursFromJSON,
  getTransportsFromJSON,
} from './tariffService'

const AIRTABLE_BASE_ID = (import.meta as any).env.VITE_AIRTABLE_BASE_ID || ''

/**
 * Construye la URL del proxy según el entorno:
 * - Dev:  /api/airtable/v0/BASE/TABLE  → interceptado por Vite proxy (auth en servidor)
 * - Prod: /agencias/api/proxy.php?path=/v0/BASE/TABLE → PHP proxy en WordPress
 * La API key NUNCA viaja al browser.
 */
function buildProxyUrl(airtablePath: string): string {
  if ((import.meta as any).env.DEV) {
    return `/api/airtable${airtablePath}`
  }
  const base = (import.meta as any).env.BASE_URL || '/agencias/'
  return `${base}api/proxy.php?path=${encodeURIComponent(airtablePath)}`
}

function airtableUrl(table: string): string {
  return buildProxyUrl(`/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`)
}

// Reservada para futuras operaciones de PATCH/DELETE por ID de registro
export function airtableRecordUrl(table: string, recordId: string): string {
  return buildProxyUrl(`/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`)
}

// Modo de operación: 'json' (datos estáticos locales) o 'airtable' (API en tiempo real)
// 'json' usa src/data/servicios.json — sin llamadas a Airtable para servicios
// 'airtable' requiere proxy funcionando (Vite en dev / proxy.php en prod)
const DATA_SOURCE_MODE: 'json' | 'airtable' = 'json'

const TABLES = {
  SERVICIOS: 'ServiciosTuristicos_SAI',
  ALOJAMIENTOS: 'Alojamientos_Solicitudes',
  TIQUETES_AEREOS: 'Tiquetes_Aereos',
  TRASLADOS: 'Taxis_Traslados',
  COTIZACIONES: 'CotizacionesGG',
  COTIZACIONES_ITEMS: 'Cotizaciones_Items',
  AGENCIAS: 'Agencias',
  LEADS: 'Leads',
  RESERVAS: 'Reservas',
}

// Sin Authorization — el proxy (Vite en dev / PHP en prod) lo agrega server-side
const getHeaders = () => ({
  'Content-Type': 'application/json',
})

// Normaliza valores que podrían llegar como texto o array a un array de strings
function normalizeToArray(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return [value].filter(Boolean)
  return []
}

// Nombres de campo de imagen que se buscan en orden de prioridad
const IMAGE_FIELD_NAMES = [
  'Imagenurl', 'ImagenURL', 'imagenurl', 'imageUrl',
  'Imagen', 'Imagenes', 'imagen', 'imagenes',
  'Fotos', 'Foto', 'fotos', 'foto',
  'Photos', 'Photo', 'photos', 'photo',
  'Attachments', 'attachments', 'Files', 'files', 'Media', 'media',
]

/**
 * Extrae las URLs de imágenes de los campos de un registro de Airtable.
 * Intenta múltiples nombres de campo para ser compatible con distintas tablas.
 * Los adjuntos de Airtable pueden ser objetos { url, filename } o strings directos.
 */
function extractImages(fields: Record<string, any>): string[] {
  for (const fieldName of IMAGE_FIELD_NAMES) {
    const value = fields[fieldName]
    if (!value) continue

    if (Array.isArray(value) && value.length > 0) {
      const urls = value
        .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
        .filter((url: string) => url.startsWith('http'))
      if (urls.length > 0) return urls
    }

    if (typeof value === 'string' && value.startsWith('http')) {
      return [value]
    }
  }

  // Debug: si no se encontraron imágenes, loguear los campos disponibles (solo primera vez)
  if (!(extractImages as any)._logged) {
    ;(extractImages as any)._logged = true
    const fieldKeys = Object.keys(fields)
    console.warn('⚠️ [Airtable] No se encontraron imágenes. Campos disponibles en el registro:', fieldKeys)
  }

  return []
}

// Cache Keys
const CACHE_KEYS = {
  ACCOMMODATIONS: 'guiasai_accommodations',
  TOURS: 'guiasai_tours',
  TRANSPORTS: 'guiasai_transports',
  LAST_UPDATE: 'guiasai_last_update'
}

// Las URLs firmadas de Airtable expiran — el caché dura máximo 2 horas
const CACHE_TTL_MS = 2 * 60 * 60 * 1000

function isCacheValid(): boolean {
  const lastUpdate = localStorage.getItem(CACHE_KEYS.LAST_UPDATE)
  if (!lastUpdate) return false
  return Date.now() - new Date(lastUpdate).getTime() < CACHE_TTL_MS
}

export function getLastUpdateDate(): string | null {
  return localStorage.getItem(CACHE_KEYS.LAST_UPDATE)
}

/**
 * Obtiene la fecha de última actualización de tarifas
 * 🆕 Funciona con ambos modos (JSON y Airtable)
 */
export function getTariffLastUpdate(): string | null {
  return localStorage.getItem('guiasai_tariff_last_update')
}

/**
 * Fuerza la actualización de datos
 * 🆕 En modo JSON, recarga desde el archivo estático
 * En modo Airtable, llama a la API
 */
export async function forceRefreshData() {
  console.log('🔄 Forzando actualización de datos...')
  try {
    const [acc, tours, trans] = await Promise.all([
      getAccommodations(true),
      getTours(true),
      getTransports(true)
    ])

    const count = acc.length + tours.length + trans.length
    console.log(`✅ Actualización completada: ${count} servicios`)

    return { success: true, count }
  } catch (error) {
    console.error('Error actualizando datos:', error)
    return { success: false, error }
  }
}

// =========================================================
// 🔧 HELPERS
// =========================================================

/**
 * Parsea el campo Dias_Operacion o Horarios de Operacion para extraer horarios
 * Soporta múltiples formatos:
 * - "Lun-Vie: 09:00, 14:00 | Sab: 10:00"
 * - "09:00, 14:00, 18:00"
 * - "6:00 PM - 8:00 PM" (formato 12h)
 * Retorna array de horarios únicos: ["09:00", "14:00", "18:00"]
 */
function parseHorarios(diasOperacion: string): string[] {
  if (!diasOperacion || typeof diasOperacion !== 'string') return []
  
  try {
    // 1. Intentar primero formato 12h (XX:XX AM/PM) para preservar la tarde/noche
    const horariosMatch12 = diasOperacion.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/gi)
    
    if (horariosMatch12 && horariosMatch12.length > 0) {
      const convertidos = horariosMatch12.map(h => {
        const parts = h.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i)
        if (parts) {
          let hours = parseInt(parts[1])
          const mins = parts[2]
          const meridiem = parts[3].toUpperCase()
          
          if (meridiem === 'PM' && hours !== 12) hours += 12
          if (meridiem === 'AM' && hours === 12) hours = 0
          
          return `${String(hours).padStart(2, '0')}:${mins}`
        }
        return null
      }).filter(Boolean) as string[]
      
      if (convertidos.length > 0) {
        const unicos = [...new Set(convertidos)]
        return unicos.sort()
      }
    }
    
    // 2. Si no hay AM/PM, buscar formato 24h (HH:MM)
    const horariosMatch = diasOperacion.match(/\d{1,2}:\d{2}/g)
    
    if (horariosMatch && horariosMatch.length > 0) {
      // Normalizar a HH:MM (padding)
      const normalizados = horariosMatch.map(h => {
        const [hh, mm] = h.split(':')
        return `${hh.padStart(2, '0')}:${mm}`
      })
      
      const unicos = [...new Set(normalizados)]
      return unicos.sort()
    }
    
    return []
  } catch (error) {
    console.warn('Error parseando horarios:', error)
    return []
  }
}

/**
 * Calcula el precio de un alojamiento según tipo y número de huéspedes
 * 
 * Lógica:
 * - Hotel/Casa/Villa/Finca/Apartamentos/Aparta Hotel: Precio fijo por noche (no depende de huéspedes)
 * - Habitación: Precio según # huéspedes
 * 
 * @param accommodation Objeto del alojamiento
 * @param numHuespedes Número total de huéspedes (adultos + niños)
 * @returns Precio por noche en COP
 */
export function calculateAccommodationPrice(accommodation: any, numHuespedes: number): number {
  const tipo = accommodation.accommodationType || 'Hotel'
  
  // Tipos que cobran precio fijo por noche (no depende de cantidad de huéspedes)
  const tiposPrecioFijo = ['Hotel', 'Casa', 'Villa', 'Finca', 'Posada Nativa', 'Hotel boutique', 'Apartamentos', 'Aparta Hotel']
  
  if (tiposPrecioFijo.includes(tipo)) {
    // Precio fijo por noche, sin importar cantidad de huéspedes
    return accommodation.precioActualizado || accommodation.precioBase || 0
  }
  
  // Habitación: cobrar según # huéspedes (usa campos específicos por cantidad)
  if (numHuespedes === 1) {
    return accommodation.precio1Huesped || accommodation.precioActualizado || 0
  } else if (numHuespedes === 2) {
    return accommodation.precio2Huespedes || accommodation.precioActualizado || 0
  } else if (numHuespedes === 3) {
    return accommodation.precio3Huespedes || accommodation.precioActualizado || 0
  } else if (numHuespedes >= 4) {
    return accommodation.precio4Huespedes || accommodation.precioActualizado || 0
  }
  
  return accommodation.precioActualizado || accommodation.precioBase || 0
}

/**
 * Calcula el precio total de un tour según el número de pasajeros
 * 
 * Lógica especial:
 * - Jetski (30 y 60 minutos): Precio fijo para 2 pasajeros (capacidad = 2)
 * - Otros tours: Precio por persona x número de pasajeros
 * 
 * @param tour Objeto del tour
 * @param numPasajeros Número de pasajeros
 * @returns Precio total en COP
 */
export function calculateTourPrice(tour: any, numPasajeros: number): number {
  const tourName = (tour.nombre || '').toLowerCase()
  
  // 🚤 Jetski: tiene capacidad para 2 personas y se cobra una tarifa fija
  if (tourName.includes('jetski') || tourName.includes('jet ski')) {
    // El precio en 'precioPerPerson' es la tarifa para los 2 pasajeros
    // No multiplicar por número de pasajeros, es el precio total por unidad
    const precioJetski = tour.precioPerPerson || tour.precioBase || 0
    
    // Si son más de 2 pasajeros, cobrar múltiples jetskis
    // Ej: 4 pasajeros = 2 jetskis
    if (numPasajeros > 2) {
      const jetkisNecesarios = Math.ceil(numPasajeros / 2)
      return precioJetski * jetkisNecesarios
    }
    
    return precioJetski
  }
  
  // 🎫 Otros tours: cobrar por persona
  const precioPerPerson = tour.precioPerPerson || tour.precioBase || 0
  return precioPerPerson * numPasajeros
}

// =========================================================
// 🆕 COTIZACIONES (CREACIÓN B2B → Airtable)
// =========================================================

export async function createCotizacionGG(payload: {
  nombre: string
  email: string
  telefono: string
  fechaInicio?: string
  fechaFin?: string
  adultos?: number
  ninos?: number
  bebes?: number
  precioTotal: number
  notasInternas?: string
  // 🆕 Nuevos campos para el resumen
  cotizacionItems?: string  // Resumen de tours/alojamientos seleccionados
  accommodations?: any[]    // Items de alojamientos
  tours?: any[]            // Items de tours
  transports?: any[]       // Items de transportes
}) {
  if (!AIRTABLE_BASE_ID) {
    throw new Error('Airtable no está configurado (VITE_AIRTABLE_BASE_ID)')
  }

  try {
    const url = airtableUrl(TABLES.COTIZACIONES)
    const fields: Record<string, any> = {}

    // 🆕 Generar ID único de cotización en el formato requerido
    const timestamp = Date.now()
    const cotizacionId = `Cotización QT-${timestamp}`

    // Campos obligatorios
    if (payload.nombre) fields.Nombre = payload.nombre
    if (payload.email) fields.Email = payload.email
    if (payload.telefono) fields.Telefono = payload.telefono
    if (payload.precioTotal !== undefined) fields['Precio total'] = payload.precioTotal

    // Campos opcionales
    if (payload.fechaInicio) fields['Fecha Inicio'] = payload.fechaInicio
    if (payload.fechaFin) fields['Fecha Fin'] = payload.fechaFin
    if (payload.adultos !== undefined && payload.adultos > 0) fields['Adultos 18 - 99 años'] = payload.adultos
    if (payload.ninos !== undefined && payload.ninos > 0) fields['Niños 4 - 17 años'] = payload.ninos
    if (payload.bebes !== undefined && payload.bebes > 0) fields['Bebes 0 - 3 años'] = payload.bebes

    // 🆕 Generar resumen detallado de los items seleccionados
    let resumenCompleto = ''
    if (payload.accommodations || payload.tours || payload.transports) {
      const resumen = generateCotizacionSummary({
        accommodations: payload.accommodations || [],
        tours: payload.tours || [],
        transports: payload.transports || []
      })
      resumenCompleto = resumen
      fields['Cotizaciones_Items'] = resumen  // 🆕 Campo para el resumen de items
    }

    // 🆕 Incluir ID de cotización en las notas internas
    const notasConId = `${cotizacionId}

${payload.notasInternas || 'Generada desde portal de agencias (B2B)'}

RESUMEN DE SERVICIOS:
${resumenCompleto}`

    fields['Notas internas'] = notasConId

    console.log('📤 Enviando cotización a Airtable CotizacionesGG con campos:', JSON.stringify(fields, null, 2))
    const response = await axios.post(url, { fields }, { headers: getHeaders() })
    console.log('✅ Cotización creada con ID:', response.data?.id, '| Cotización:', cotizacionId)
    
    // Retornar tanto el ID de Airtable como el ID de la cotización
    return {
      airtableId: response.data?.id as string,
      cotizacionId: cotizacionId
    }
  } catch (error: any) {
    console.error('❌ Error detallado en createCotizacionGG:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: JSON.stringify(error?.response?.data),
      message: error?.message,
    })
    throw error
  }
}

// 🆕 Obtener historial de cotizaciones por email (Para el Panel de Agencia)
export async function getCotizacionesByEmail(email: string) {
  if (!AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado')
    return []
  }

  try {
    const url = airtableUrl(TABLES.COTIZACIONES)
    const filterByFormula = `{Email} = '${email}'`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        'sort[0][field]': 'Created',
        'sort[0][direction]': 'desc',
      },
    })

    return response.data.records.map((record: any) => ({
      id: record.id,
      ...record.fields,
      createdTime: record.createdTime
    }))
  } catch (error) {
    console.error('❌ Error obteniendo historial de cotizaciones:', error)
    return []
  }
}

// 🆕 SUPER ADMIN: Obtener TODAS las cotizaciones
export async function getAllCotizaciones() {
  if (!AIRTABLE_BASE_ID) return []

  try {
    const url = airtableUrl(TABLES.COTIZACIONES)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        maxRecords: 100,
      },
    })

    return response.data.records.map((record: any) => ({
      id: record.id,
      ...record.fields,
      createdTime: record.createdTime
    }))
  } catch (error) {
    console.error('❌ Error obteniendo todas las cotizaciones:', error)
    return []
  }
}

// 🆕 SUPER ADMIN: Obtener todas las agencias
export async function getAllAgencies() {
  if (!AIRTABLE_BASE_ID) return []

  try {
    const url = airtableUrl(TABLES.AGENCIAS)
    const response = await axios.get(url, { headers: getHeaders() })
    return response.data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }))
  } catch (error) {
    console.error('❌ Error obteniendo agencias:', error)
    return []
  }
}

// 🆕 SUPER ADMIN: Obtener todos los leads
export async function getAllLeads() {
  if (!AIRTABLE_BASE_ID) return []

  try {
    const url = airtableUrl(TABLES.LEADS)
    const response = await axios.get(url, {
        headers: getHeaders(),
        params: {
            'sort[0][field]': 'Fecha',
            'sort[0][direction]': 'desc',
            maxRecords: 50,
        }
    })
    return response.data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }))
  } catch (error) {
    console.error('❌ Error obteniendo leads:', error)
    return []
  }
}

// 🆕 Función para generar el resumen detallado de la cotización
function generateCotizacionSummary(data: {
  accommodations: any[]
  tours: any[]
  transports: any[]
}): string {
  let resumen = []

  // 🏨 ALOJAMIENTOS
  if (data.accommodations && data.accommodations.length > 0) {
    resumen.push("🏨 ALOJAMIENTOS:")
    data.accommodations.forEach((acc, index) => {
      let checkIn: string
      if (acc.checkIn instanceof Date) {
        checkIn = acc.checkIn.toLocaleDateString('es-CO')
      } else {
        const [y, m, d] = String(acc.checkIn).split('-').map(Number)
        checkIn = new Date(y, m - 1, d).toLocaleDateString('es-CO')
      }
      let checkOut: string
      if (acc.checkOut instanceof Date) {
        checkOut = acc.checkOut.toLocaleDateString('es-CO')
      } else {
        const [y, m, d] = String(acc.checkOut).split('-').map(Number)
        checkOut = new Date(y, m - 1, d).toLocaleDateString('es-CO')
      }
      
      resumen.push(`${index + 1}. ${acc.hotelName}`)
      resumen.push(`   • Categoría: ${acc.categoria || acc.roomType}`)
      if (acc.capacidad && acc.capacidad > 0) {
        resumen.push(`   • Capacidad máxima: ${acc.capacidad} persona(s)`)
      }
      resumen.push(`   • Fechas: ${checkIn} al ${checkOut}`)
      resumen.push(`   • Noches: ${acc.nights}`)
      resumen.push(`   • Habitaciones: ${acc.quantity}`)
      resumen.push(`   • Huéspedes: ${acc.adults} adultos${acc.children ? `, ${acc.children} niños` : ''}`)
      resumen.push(`   • Precio: $${acc.total.toLocaleString('es-CO')} COP`)
      resumen.push('')
    })
  }

  // 🎫 TOURS
  if (data.tours && data.tours.length > 0) {
    resumen.push("🎫 TOURS:")
    data.tours.forEach((tour, index) => {
      const fecha = tour.date instanceof Date ? tour.date.toLocaleDateString('es-CO') : new Date(tour.date).toLocaleDateString('es-CO')
      
      resumen.push(`${index + 1}. ${tour.tourName}`)
      resumen.push(`   • Fecha: ${fecha}`)
      if (tour.schedule) {
        resumen.push(`   • Horario: ${tour.schedule}`)
      }
      resumen.push(`   • Duración: ${tour.duration}`)
      resumen.push(`   • Participantes: ${tour.quantity} personas`)
      if (tour.included && tour.included.length > 0) {
        resumen.push(`   • Incluye: ${tour.included.slice(0, 3).join(', ')}${tour.included.length > 3 ? '...' : ''}`)
      }
      resumen.push(`   • Precio: $${tour.total.toLocaleString('es-CO')} COP`)
      resumen.push('')
    })
  }

  // 🚕 TRANSPORTES
  if (data.transports && data.transports.length > 0) {
    resumen.push("🚕 TRANSPORTES:")
    data.transports.forEach((transport, index) => {
      const fecha = transport.date instanceof Date ? transport.date.toLocaleDateString('es-CO') : new Date(transport.date).toLocaleDateString('es-CO')
      
      resumen.push(`${index + 1}. ${transport.vehicleType}`)
      resumen.push(`   • Ruta: ${transport.origin} → ${transport.destination}`)
      resumen.push(`   • Fecha: ${fecha}`)
      if (transport.time) {
        resumen.push(`   • Hora: ${transport.time}`)
      }
      resumen.push(`   • Vehículos: ${transport.quantity}`)
      resumen.push(`   • Pasajeros: ${transport.totalPassengers}`)
      resumen.push(`   • Precio: $${transport.total.toLocaleString('es-CO')} COP`)
      resumen.push('')
    })
  }

  return resumen.join('\n')
}

export async function createCotizacionItemGG(payload: {
  cotizacionId: string
  servicioId: string
  fechaInicio: string
  fechaFin?: string
  adultos?: number
  ninos?: number
  bebes?: number
  precioUnitario?: number
  subtotal: number
}) {
  if (!AIRTABLE_BASE_ID) {
    throw new Error('Airtable no está configurado (VITE_AIRTABLE_BASE_ID)')
  }

  const url = airtableUrl(TABLES.COTIZACIONES_ITEMS)
  const fields: Record<string, any> = {}

  try {
    // 🆕 Por ahora omitimos los campos de vínculo hasta conocer la estructura exacta
    // Incluimos la información como referencia en las notas
    let notasItem = `Cotización ID: ${payload.cotizacionId}\nServicio ID: ${payload.servicioId}`

    // Fechas - solo si existen
    if (payload.fechaInicio) {
      fields['Fecha Inicio'] = payload.fechaInicio
    }
    if (payload.fechaFin) {
      fields['Fecha Fin'] = payload.fechaFin
    }

    // Precios - incluir aunque sean 0
    if (payload.precioUnitario !== undefined) {
      fields['Precio Unitario'] = payload.precioUnitario
    }
    if (payload.subtotal !== undefined) {
      fields['Precio Subtotal'] = payload.subtotal
    }

    // Pasajeros - incluir solo si > 0
    if (payload.adultos !== undefined && payload.adultos > 0) {
      fields['Adultos 18 - 99 años'] = payload.adultos
    }
    if (payload.ninos !== undefined && payload.ninos > 0) {
      fields['Niños 4 - 17 años'] = payload.ninos
    }
    if (payload.bebes !== undefined && payload.bebes > 0) {
      fields['Bebes 0 - 3 años'] = payload.bebes
    }

    // 🆕 Agregar notas con los IDs de referencia
    if (fields['Notas internas']) {
      fields['Notas internas'] = fields['Notas internas'] + '\n\n' + notasItem
    } else {
      fields['Notas internas'] = notasItem
    }

    console.log('📤 Enviando item a Airtable cotizaciones_Items con campos:', JSON.stringify(fields, null, 2))
    console.log('📋 Payload original:', JSON.stringify(payload, null, 2))
    const response = await axios.post(url, { fields }, { headers: getHeaders() })
    console.log('✅ Item creado con ID:', response.data?.id)
    return response.data?.id as string
  } catch (error: any) {
    const airtableError = error?.response?.data?.error
    console.error('❌ Error detallado en createCotizacionItemGG:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      airtableError,
      errorMessage: airtableError?.message,
      invalidFields: airtableError?.invalidFields,
      fields,
      payload
    })
    console.error('🔍 Airtable full response:', JSON.stringify(error?.response?.data, null, 2))
    
    // 🆕 Intentar crear el item sin los campos de vínculo si fallan
    if (airtableError?.message?.includes('Value is not an array of record IDs')) {
      console.warn('⚠️ Reintentando sin campos de vínculo...')
      try {
        const fieldsWithoutLinks = { ...fields }
        delete fieldsWithoutLinks['CotizacionesGG']
        delete fieldsWithoutLinks['ServiciosTuristicos_SAI']
        
        const fallbackResponse = await axios.post(url, { fields: fieldsWithoutLinks }, { headers: getHeaders() })
        console.log('✅ Item creado sin vínculos con ID:', fallbackResponse.data?.id)
        return fallbackResponse.data?.id as string
      } catch (fallbackError) {
        console.error('❌ También falló el fallback:', fallbackError)
      }
    }
    
    throw error
  }
}

// =========================================================
// 🏨 ALOJAMIENTOS
// =========================================================

/**
 * Obtiene alojamientos
 * 🆕 Ahora usa JSON estático por defecto para reducir llamadas a Airtable
 */
export async function getAccommodations(forceRefresh = false) {
  // Modo JSON (por defecto) - SIN llamadas a Airtable
  if (DATA_SOURCE_MODE === 'json') {
    try {
      return await getAccommodationsFromJSON(forceRefresh)
    } catch (error) {
      console.error('❌ Error leyendo alojamientos desde JSON:', error)
      return getMockAccommodations()
    }
  }

  // Modo Airtable (legacy) - Solo si se necesita sincronización en tiempo real
  try {
    if (!forceRefresh && isCacheValid()) {
      const cached = localStorage.getItem(CACHE_KEYS.ACCOMMODATIONS)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }

    if (!AIRTABLE_BASE_ID) {
      console.warn('⚠️ Airtable no configurado')
      return getMockAccommodations()
    }

    const url = airtableUrl(TABLES.SERVICIOS)
    // Nota: en la API de Airtable los campos checkbox retornan true (booleano), no 'checked'
    const filterByFormula = `AND({Tipo de Servicio} = 'Alojamiento', {Publicado} = TRUE())`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 50,
      },
    })

    const mappedData = response.data.records.map((record: any) => ({
      id: record.id,
      nombre: record.fields.Servicio || record.fields.Nombre || 'Sin nombre',
      descripcion: record.fields.Descripcion || '',
      categoria: record.fields.Categoria || record.fields['Tipo de Alojamiento'] || 'Alojamiento',
      publicado: record.fields.Publicado === 'checked',
      accommodationType: record.fields['Tipo de Alojamiento'] || 'Hotel',
      precioActualizado: parseFloat(record.fields.Precio || record.fields['Precio actualizado'] || 0),
      precio1Huesped: parseFloat(record.fields['Precio 1 Huesped'] || record.fields.Precio || 0),
      precio2Huespedes: parseFloat(record.fields['Precio 2 Huespedes'] || record.fields.Precio || 0),
      precio3Huespedes: parseFloat(record.fields['Precio 3 Huespedes'] || record.fields.Precio || 0),
      precio4Huespedes: parseFloat(record.fields['Precio 4+ Huespedes'] || record.fields.Precio || 0),
      precioBase: parseFloat(record.fields.Precio || record.fields.PrecioBase || 0),
      precioMin: parseFloat(record.fields.PrecioMin || record.fields.Precio || 0),
      precioMax: parseFloat(record.fields.PrecioMax || record.fields.Precio || 0),
      capacidad: parseInt(record.fields['Capacidad Maxima'] || record.fields.Capacidad || 0),
      ubicacion: record.fields.Ubicacion || '',
      telefono: record.fields['Telefono Contacto'] || record.fields.Telefono || '',
      email: record.fields['Email Contacto'] || record.fields.Email || '',
      imageUrl: extractImages(record.fields)[0] || '',
      images: extractImages(record.fields),
      estrellas: parseInt(record.fields.Rating || record.fields.Estrellas || 0),
      amenities: record.fields.Amenities || [],
      servicios: record.fields.Servicios || record.fields.Amenities || [],
      disabledDates: record.fields.FechasDeshabilitadas || [],
      horarioCheckIn: record.fields.HorarioCheckIn || '14:00',
      horarioCheckOut: record.fields.HorarioCheckOut || '11:00',
      destacado: record.fields.Destacado === 'checked',
      slug: String(record.fields.Slug || record.fields.slug || ''),
      categoriaServicio: normalizeToArray(record.fields.Categoria),
    }))

    if (mappedData.length > 0) {
      const sample = response.data.records[0]?.fields || {}
      console.log('🔍 [Airtable Alojamientos] Campos del primer registro:', Object.keys(sample))
      console.log('🔍 [Airtable Alojamientos] Valor de Imagenurl:', sample['Imagenurl'])
      console.log('🔍 [Airtable Alojamientos] imageUrl mapeado:', mappedData[0].imageUrl)
    }

    localStorage.setItem(CACHE_KEYS.ACCOMMODATIONS, JSON.stringify(mappedData))
    localStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString())

    return mappedData
  } catch (error) {
    console.error('❌ Error obteniendo alojamientos:', error)
    return getMockAccommodations()
  }
}

// =========================================================
// 🎫 TOURS
// =========================================================

/**
 * Obtiene tours
 * 🆕 Ahora usa JSON estático por defecto para reducir llamadas a Airtable
 */
export async function getTours(forceRefresh = false) {
  // Modo JSON (por defecto) - SIN llamadas a Airtable
  if (DATA_SOURCE_MODE === 'json') {
    try {
      return await getToursFromJSON(forceRefresh)
    } catch (error) {
      console.error('❌ Error leyendo tours desde JSON:', error)
      return getMockTours()
    }
  }

  // Modo Airtable (legacy) - Solo si se necesita sincronización en tiempo real
  try {
    if (!forceRefresh && isCacheValid()) {
      const cached = localStorage.getItem(CACHE_KEYS.TOURS)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }

    if (!AIRTABLE_BASE_ID) {
      console.warn('⚠️ Airtable no configurado')
      return getMockTours()
    }

    const url = airtableUrl(TABLES.SERVICIOS)
    // Nota: en la API de Airtable los campos checkbox retornan true (booleano), no 'checked'
    const filterByFormula = `AND({Tipo de Servicio} = 'Tour', {Publicado} = TRUE())`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 50,
      },
    })

    const mappedTours = response.data.records.map((record: any) => {
      const getHorarioValue = () => {
        const priorityFields = [
          'Horarios_Operacion', 'Horarios de Operacion', 'Horario de Operacion',
          'Horarios de Operación', 'Horario de Operación', 'HorariosOperacion',
          'Horario', 'Horarios', 'Horario Salida', 'Hora Salida', 'Hora'
        ]
        for (const field of priorityFields) {
          const val = record.fields[field]
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) return val.join(', ')
            return String(val)
          }
        }
        return ''
      }

      const getDiasValue = () => {
        const fields = ['Dias_Operacion', 'DiasOperacion', 'Días de Operación', 'Dias de Operacion', 'Days of Operation']
        for (const field of fields) {
          const val = record.fields[field]
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) return val.join(', ')
            return String(val)
          }
        }
        return ''
      }

      const horariosCampo = getHorarioValue()
      const diasCampo = getDiasValue()
      const horariosExtraidos = parseHorarios(horariosCampo)
      const diasOperacionTexto = diasCampo || horariosCampo

      return {
        id: record.id,
        nombre: record.fields.Servicio || record.fields.Nombre || 'Sin nombre',
        descripcion: record.fields.Descripcion || record.fields.Itinerario || '',
        categoria: record.fields['Tipo de Servicio'] || record.fields.Categoria || 'Tour',
        publicado: record.fields.Publicado === 'checked',
        precioBase: parseFloat(record.fields['Precio actualizado'] || record.fields.Precio || record.fields.PrecioBase || 0),
        precioPerPerson: parseFloat(record.fields['Precio actualizado'] || record.fields.Precio || record.fields.PrecioPerPerson || 0),
        duracion: record.fields.Duracion || '4 horas',
        capacidad: parseInt(record.fields.Capacidad || 10),
        ubicacion: record.fields.Ubicacion || '',
        telefono: record.fields['Telefono Contacto'] || record.fields.Telefono || '',
        email: record.fields['Email Contacto'] || record.fields.Email || '',
        imageUrl: extractImages(record.fields)[0] || '',
        images: extractImages(record.fields),
        diasOperacion: diasOperacionTexto,
        horarios: horariosExtraidos,
        horariosDisponibles: horariosExtraidos,
        horariosOperacion: horariosCampo,
        horarioInicio: record.fields.HorarioInicio || record.fields['Horario Inicio'] || '08:00',
        horarioFin: record.fields.HorarioFin || record.fields['Horario Fin'] || '16:00',
        incluye: normalizeToArray(record.fields.Incluye || record.fields['que Incluye']),
        noIncluye: normalizeToArray(record.fields.NoIncluye),
        dificultad: record.fields.Dificultad || 'Fácil',
        destacado: record.fields.Destacado === 'checked',
        slug: String(record.fields.Slug || record.fields.slug || ''),
        categoriaServicio: normalizeToArray(record.fields.Categoria),
      }
    })

    localStorage.setItem(CACHE_KEYS.TOURS, JSON.stringify(mappedTours))
    localStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString())

    return mappedTours
  } catch (error) {
    console.error('❌ Error obteniendo tours:', error)
    return getMockTours()
  }
}

// =========================================================
// 🚕 TRASLADOS
// =========================================================

/**
 * Obtiene transportes
 * 🆕 Ahora usa JSON estático por defecto para reducir llamadas a Airtable
 */
export async function getTransports(forceRefresh = false) {
  // Modo JSON (por defecto) - SIN llamadas a Airtable
  if (DATA_SOURCE_MODE === 'json') {
    try {
      return await getTransportsFromJSON(forceRefresh)
    } catch (error) {
      console.error('❌ Error leyendo transportes desde JSON:', error)
      return getMockTransports()
    }
  }

  // Modo Airtable (legacy) - Solo si se necesita sincronización en tiempo real
  try {
    if (!forceRefresh && isCacheValid()) {
      const cached = localStorage.getItem(CACHE_KEYS.TRANSPORTS)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }

    if (!AIRTABLE_BASE_ID) {
      console.warn('⚠️ Airtable no configurado')
      return getMockTransports()
    }

    const url = airtableUrl(TABLES.SERVICIOS)
    const filterByFormula = `AND({Categoria} = 'Transporte', {Publicado} = TRUE())`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 50,
      },
    })

    const mappedData = response.data.records.map((record: any) => ({
      id: record.id,
      nombre: record.fields.Servicio || record.fields.Nombre || 'Sin nombre',
      descripcion: record.fields.Descripcion || '',
      categoria: record.fields.Categoria,
      publicado: record.fields.Publicado === 'checked',
      precioBase: parseFloat(record.fields['Precio actualizado'] || record.fields.PrecioBase || 0),
      precioPerVehicle: parseFloat(record.fields['Precio actualizado'] || record.fields.PrecioPerVehicle || 0),
      capacidad: parseInt(record.fields.Capacidad || 5),
      tipo: record.fields.Tipo || 'Automóvil',
      telefono: record.fields.Telefono || '',
      email: record.fields.Email || '',
      operador: record.fields.Operador || '',
      rutas: record.fields.Rutas || ['Aeropuerto-Hotel', 'Hotel-Hotel'],
    }))

    localStorage.setItem(CACHE_KEYS.TRANSPORTS, JSON.stringify(mappedData))
    localStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString())

    return mappedData
  } catch (error) {
    console.error('❌ Error obteniendo transportes:', error)
    return getMockTransports()
  }
}

// =========================================================
// 📊 EXPORTACIÓN DE DATOS (CSV/EXCEL)
// =========================================================

export function downloadRatesAsCSV(
  accommodations: any[],
  tours: any[],
  transports: any[]
) {
  // Definir cabeceras del CSV
  const headers = ['TIPO_SERVICIO', 'NOMBRE', 'CATEGORIA', 'UBICACION', 'PRECIO_BASE_COP', 'CAPACIDAD_MAX', 'DIAS_OPERACION', 'DESCRIPCION']
  const rows = [headers]

  // Procesar Alojamientos
  accommodations.forEach(acc => {
    rows.push([
      'ALOJAMIENTO',
      `"${acc.nombre.replace(/"/g, '""')}"`, // Escapar comillas
      acc.accommodationType || acc.categoria,
      `"${acc.ubicacion}"`,
      (acc.precioActualizado || acc.precioBase || 0).toString(),
      (acc.capacidad || 0).toString(),
      'Todos los días',
      `"${(acc.descripcion || '').replace(/"/g, '""').substring(0, 100)}..."`
    ])
  })

  // Procesar Tours
  tours.forEach(tour => {
    rows.push([
      'TOUR',
      `"${tour.nombre.replace(/"/g, '""')}"`,
      tour.categoria,
      `"${tour.ubicacion}"`,
      (tour.precioPerPerson || 0).toString(),
      (tour.capacidad || 0).toString(),
      `"${tour.diasOperacion || 'Consultar'}"`,
      `"${(tour.descripcion || '').replace(/"/g, '""').substring(0, 100)}..."`
    ])
  })

  // Procesar Transportes
  transports.forEach(trans => {
    rows.push([
      'TRANSPORTE',
      `"${trans.nombre.replace(/"/g, '""')}"`,
      trans.tipo,
      'San Andrés',
      (trans.precioPerVehicle || 0).toString(),
      (trans.capacidad || 0).toString(),
      'Todos los días',
      `"${(trans.descripcion || '').replace(/"/g, '""').substring(0, 100)}..."`
    ])
  })

  // Generar Blob y descargar
  const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n") // \uFEFF es BOM para que Excel reconozca UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `Tarifario_GuiaSAI_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// =========================================================
// 🔐 AUTENTICACIÓN Y CRM (AGENCIAS & LEADS)
// =========================================================

export async function checkAgencyStatus(email: string) {
  if (!AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable no configurado, simulando respuesta')
    return { exists: false, approved: false }
  }

  try {
    const url = airtableUrl(TABLES.AGENCIAS)
    // Buscamos por email exacto
    const filterByFormula = `{Email} = '${email}'`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 1,
      },
    })

    if (response.data.records.length > 0) {
      const record = response.data.records[0]
      // Verificamos si el campo Approved está marcado (true o 'Approved')
      const isApproved = record.fields.Approved === true || record.fields.Approved === 'Approved'
      return { 
        exists: true, 
        approved: isApproved, 
        name: record.fields.Nombre || record.fields.Agencia || 'Agencia' 
      }
    }

    return { exists: false, approved: false }
  } catch (error: any) {
    // Si la tabla no existe (403/404) o tiene campos inválidos (422), no bloqueamos el acceso
    const status = error?.response?.status
    if (status === 403 || status === 404 || status === 422) {
      console.warn(`⚠️ Tabla Agencias no disponible (HTTP ${status}) — login sin validación de agencia`)
      return { exists: false, approved: false }
    }
    console.error('❌ Error verificando agencia:', error)
    return { exists: false, approved: false }
  }
}

/**
 * Verifica credenciales contra la tabla Usuarios_Admins de Airtable.
 * Acepta variantes de nombre de campo (Password/Contraseña/Clave, Nombre/Name, Activo/Estado).
 * Retorna { valid: true, name, rol } si las credenciales son correctas, o { valid: false } si no.
 */
export async function checkUsuariosAdmins(
  email: string,
  password?: string
): Promise<{ valid: boolean; name?: string; rol?: string }> {
  if (!AIRTABLE_BASE_ID) return { valid: false }
  try {
    const url = airtableUrl('Usuarios_Admins')
    const filterByFormula = `{Email} = '${email.replace(/'/g, "\\'")}'`
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: { filterByFormula, maxRecords: 1 },
    })
    if (!response.data.records?.length) return { valid: false }
    const f = response.data.records[0].fields

    // Verificar contraseña (varios nombres de campo posibles)
    if (password) {
      const stored = f.Password ?? f.Contraseña ?? f.Clave ?? f.password ?? ''
      if (stored && stored !== password) {
        console.warn('[Usuarios_Admins] Contraseña incorrecta para:', email)
        return { valid: false }
      }
    }

    // Verificar que la cuenta esté activa
    const activo = f.Activo !== false && f.Activo !== 0 && f.Estado !== 'Inactivo'
    if (!activo) return { valid: false }

    return {
      valid: true,
      name: f.Nombre ?? f.Name ?? f.nombre ?? email,
      rol: f.Rol ?? f.rol ?? 'admin',
    }
  } catch (error: any) {
    console.warn('[Usuarios_Admins] Error al verificar:', error?.response?.status ?? error)
    return { valid: false }
  }
}

export async function registerLead(email: string, tipoCliente: string = 'Agencia Nacional', nombre?: string, telefono?: string, origen: string = 'Intento Login B2B') {
  try {
    const url = airtableUrl(TABLES.LEADS)
    const fields: any = {
      Email: email,
      Fecha: new Date().toISOString().split('T')[0],
      Origen: origen,
      Estado: 'Nuevo',
      Tipo_Cliente: tipoCliente // 🆕 Campo Tipo_Cliente (Agencia Nacional, Agencia Internacional, etc.)
    }
    
    if (nombre) fields.Nombre = nombre
    if (telefono) fields.Telefono = telefono

    await axios.post(url, { fields }, { headers: getHeaders() })
    console.log('✅ Lead registrado en Airtable:', email)
  } catch (error) {
    console.error('❌ Error registrando lead:', error)
    // No lanzamos error para no interrumpir el flujo de UI
  }
}

export async function sendSupportMessage(email: string, message: string, agencyName?: string) {
  try {
    const url = airtableUrl(TABLES.LEADS)
    // Usamos la tabla Leads para centralizar contactos, marcándolo como Soporte
    const fields = {
      Email: email,
      Nombre: agencyName || 'Agencia Registrada',
      Fecha: new Date().toISOString().split('T')[0],
      Origen: 'Soporte B2B Dashboard',
      Estado: 'Soporte', // Estado especial para diferenciar de leads comerciales
      Tipo_Cliente: 'Agencia - Consulta',
      Notas: message // Guardamos el mensaje en notas
    }
    await axios.post(url, { fields }, { headers: getHeaders() })
    return true
  } catch (error) {
    console.error('❌ Error enviando mensaje de soporte:', error)
    throw error
  }
}

// =========================================================
// 🔄 SINCRONIZACIÓN CON GUANAGO (B2C)
// =========================================================

/**
 * Verifica si hay disponibilidad real consultando las reservas existentes
 * (Tanto las de GuanaGo B2C como las de GuíaSAI B2B)
 */
export async function checkAvailability(serviceId: string, date: string) {
  if (!AIRTABLE_BASE_ID) return true // Asumir disponible si no hay conexión

  try {
    const url = airtableUrl(TABLES.RESERVAS)
    // Buscar reservas confirmadas para ese servicio en esa fecha
    // Nota: Ajustar nombres de campos según tu estructura real en GuanaGo
    const filterByFormula = `AND({ServicioId} = '${serviceId}', {Fecha} = '${date}', {Estado} = 'Confirmada')`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 100
      }
    })

    // Aquí podrías sumar la cantidad de pax reservados y comparar con la capacidad total
    const reservas = response.data.records
    console.log(`🔎 Verificando disponibilidad B2B/B2C para ${serviceId} en ${date}: ${reservas.length} reservas encontradas`)
    
    return reservas // Retorna las reservas para calcular cupos restantes
  } catch (error) {
    console.warn('⚠️ No se pudo verificar disponibilidad cruzada con GuanaGo:', error)
    return []
  }
}

// =========================================================
// 📦 MOCK DATA (para desarrollo)
// =========================================================

function getMockAccommodations() {
  return [
    {
      id: 'hotel-1',
      nombre: 'Hotel Las Palmeras',
      descripcion: 'Hotel 4 estrellas frente al mar con piscina infinity',
      categoria: 'Hotel',
      publicado: true,
      accommodationType: 'Hotel',
      precioActualizado: 500000,
      precio1Huesped: 450000,
      precio2Huespedes: 500000,
      precio3Huespedes: 600000,
      precio4Huespedes: 700000,
      precioBase: 500000,
      precioMin: 450000,
      precioMax: 750000,
      capacidad: 4,
      ubicacion: 'Playa Spratt Bight',
      telefono: '+57 8 5128888',
      email: 'reservas@laspalmeras.com',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400'
      ],
      estrellas: 4,
      amenities: ['WiFi', 'Aire acondicionado', 'Mini bar', 'TV Cable', 'Piscina'],
      servicios: ['WiFi', 'Aire acondicionado', 'Mini bar', 'TV Cable', 'Piscina'],
      horarioCheckIn: '14:00',
      horarioCheckOut: '11:00',
    },
    {
      id: 'hotel-2',
      nombre: 'Hotel Decameron San Luis',
      categoria: 'Hotel',
      publicado: true,
      accommodationType: 'Hotel',
      precioActualizado: 800000,
      precio1Huesped: 700000,
      precio2Huespedes: 800000,
      precio3Huespedes: 950000,
      precio4Huespedes: 1100000,
      precioBase: 800000,
      precioMin: 700000,
      precioMax: 1000000,
      capacidad: 6,
      ubicacion: 'San Luis',
      telefono: '+57 8 5100200',
      email: 'reservas@decameron.com',
      imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400'
      ],
      estrellas: 5,
      amenities: ['All Inclusive', 'Playas privadas', 'Restaurantes', 'Animación', 'Spa', 'Gym'],
      servicios: ['All Inclusive', 'Playas privadas', 'Restaurantes', 'Animación', 'Spa', 'Gym'],
      horarioCheckIn: '15:00',
      horarioCheckOut: '12:00',
    },
    {
      id: 'hotel-3',
      nombre: 'Apartamento Miss Mary',
      descripcion: 'Apartamento acogedor con cocina equipada',
      categoria: 'Apartamentos',
      publicado: true,
      accommodationType: 'Apartamentos',
      precioActualizado: 150000,
      precio1Huesped: 150000,
      precio2Huespedes: 200000,
      precio3Huespedes: 250000,
      precio4Huespedes: 300000,
      precioBase: 200000,
      precioMin: 150000,
      precioMax: 300000,
      capacidad: 4,
      ubicacion: 'Centro',
      telefono: '+57 8 5124567',
      email: 'info@missmary.com',
      imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
      ],
      estrellas: 3,
      amenities: ['WiFi', 'Cocina equipada', 'Aire acondicionado', 'TV Cable'],
      servicios: ['WiFi', 'Cocina equipada', 'Aire acondicionado', 'TV Cable'],
      horarioCheckIn: '14:00',
      horarioCheckOut: '10:00',
    },
  ]
}

function getMockTours() {
  return [
    {
      id: 'tour-1',
      nombre: 'Coco Art Workshop',
      descripcion: 'Taller artesanal de arte con coco donde aprenderas tecnicas ancestrales raizales. Una experiencia unica que conecta con la cultura islena a traves del arte manual con materiales naturales de la isla.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 85000,
      duracion: '3 horas',
      capacidad: 12,
      ubicacion: 'San Andres - Barrio Obrero',
      telefono: '+57 8 5150000',
      email: 'cocoart@guiasai.com',
      diasOperacion: 'Mar-Sab: 09:00, 14:00',
      horarios: ['09:00', '14:00'],
      horariosDisponibles: ['09:00', '14:00'],
      horarioInicio: '09:00',
      horarioFin: '17:00',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
      images: [
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
        'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
        'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      incluye: ['Materiales de trabajo', 'Instructor raizal', 'Pieza artesanal para llevar', 'Bebida de bienvenida'],
      noIncluye: ['Transporte desde hotel', 'Almuerzo'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'coco-art-workshop',
      categoriaServicio: ['Cultura'],
      operador: 'Artesanos Raizales SAI',
      puntoEncuentro: 'Barrio Obrero, frente a la iglesia',
      itinerario: 'Bienvenida y contexto cultural\nDemostracion de tecnicas\nCreacion de tu pieza artesanal\nExposicion de trabajos y fotos',
      politicasCancelacion: 'Cancelacion gratuita hasta 24 horas antes.\nCancelacion con menos de 24 horas: 50% de cargo.\nNo show: sin reembolso.',
    },
    {
      id: 'tour-2',
      nombre: 'Preparacion Sopa de Cangrejo',
      descripcion: 'Aprende a preparar la autentica Sopa de Cangrejo raizal con una familia local. Conoce los ingredientes tradicionales, la historia detras de este plato emblematico y disfruta de una degustacion completa.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 120000,
      duracion: '4 horas',
      capacidad: 8,
      ubicacion: 'San Andres - La Loma',
      telefono: '+57 8 5150001',
      email: 'gastronomia@guiasai.com',
      diasOperacion: 'Lun, Mie, Vie: 10:00',
      horarios: ['10:00'],
      horariosDisponibles: ['10:00'],
      horarioInicio: '10:00',
      horarioFin: '14:00',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      images: [
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'
      ],
      incluye: ['Ingredientes frescos', 'Clase de cocina', 'Degustacion completa', 'Recetario para llevar'],
      noIncluye: ['Transporte', 'Bebidas alcoholicas'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'preparacion-sopa-cangrejo',
      categoriaServicio: ['Gastronomia'],
      operador: 'Familia Robinson - La Loma',
      puntoEncuentro: 'La Loma, casa de la familia Robinson',
      itinerario: 'Recepcion y bienvenida con jugo natural\nHistoria del plato y sus ingredientes\nPreparacion paso a paso\nDegustacion y sobremesa cultural',
      politicasCancelacion: 'Cancelacion gratuita hasta 48 horas antes.\nCancelacion con menos de 48 horas: 50% de cargo.\nNo show: sin reembolso.',
    },
    {
      id: 'tour-3',
      nombre: 'Caribbean Night Cover + Transporte + Degustacion',
      descripcion: 'Noche caribena completa con musica en vivo, transporte incluido y degustacion de platos tipicos. Vive la autentica vida nocturna raizal con artistas locales en un ambiente unico.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 200000,
      duracion: '5 horas',
      capacidad: 20,
      ubicacion: 'Centro Cultural San Andres',
      telefono: '+57 8 5150002',
      email: 'caribbean@guiasai.com',
      diasOperacion: 'Jue-Sab: 18:00',
      horarios: ['18:00'],
      horariosDisponibles: ['18:00'],
      horarioInicio: '18:00',
      horarioFin: '23:00',
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
      images: [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400'
      ],
      incluye: ['Cover entrada', 'Transporte ida y vuelta', 'Degustacion 3 platos', 'Bebida de bienvenida', 'Musica en vivo'],
      noIncluye: ['Bebidas adicionales', 'Propinas'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'caribbean-night',
      categoriaServicio: ['Entretenimiento'],
      operador: 'Caribbean Events SAI',
      puntoEncuentro: 'Recogida en hotel (transporte incluido)',
      itinerario: 'Recogida en hotel\nLlegada al venue y bebida de bienvenida\nDegustacion gastronomica\nShow de musica en vivo\nRegreso al hotel',
      politicasCancelacion: 'Cancelacion gratuita hasta 24 horas antes.\nNo show: sin reembolso.',
    },
    {
      id: 'tour-4',
      nombre: 'Museo Miss Triniel con Desayuno',
      descripcion: 'Visita al Museo Miss Triniel, un tesoro cultural raizal que preserva la memoria historica de la isla. Incluye desayuno tipico isleno preparado por la familia custodio del museo.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 75000,
      duracion: '3 horas',
      capacidad: 10,
      ubicacion: 'San Andres - San Luis',
      telefono: '+57 8 5150003',
      email: 'museo@guiasai.com',
      diasOperacion: 'Lun-Sab: 08:00, 10:00',
      horarios: ['08:00', '10:00'],
      horariosDisponibles: ['08:00', '10:00'],
      horarioInicio: '08:00',
      horarioFin: '13:00',
      imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400',
      images: [
        'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400'
      ],
      incluye: ['Entrada al museo', 'Guia especializado', 'Desayuno tipico raizal', 'Fotos permitidas'],
      noIncluye: ['Transporte desde hotel'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'museo-miss-triniel',
      categoriaServicio: ['Cultura'],
      operador: 'Familia Triniel',
      puntoEncuentro: 'Museo Miss Triniel, San Luis',
      itinerario: 'Llegada y desayuno tipico raizal\nRecorrido guiado por el museo\nHistorias y anecdotas de la isla\nFotos y despedida',
      politicasCancelacion: 'Cancelacion gratuita hasta 24 horas antes.\nNo show: sin reembolso.',
    },
    {
      id: 'tour-5',
      nombre: 'Museo Pirata The Persistence',
      descripcion: 'Descubre la fascinante historia pirata del Caribe en el Museo The Persistence. Artefactos originales, historias de corsarios y la conexion de San Andres con las rutas piratas del siglo XVII.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 65000,
      duracion: '2 horas',
      capacidad: 15,
      ubicacion: 'San Andres - Centro',
      telefono: '+57 8 5150004',
      email: 'persistence@guiasai.com',
      diasOperacion: 'Lun-Dom: 09:00, 11:00, 14:00, 16:00',
      horarios: ['09:00', '11:00', '14:00', '16:00'],
      horariosDisponibles: ['09:00', '11:00', '14:00', '16:00'],
      horarioInicio: '09:00',
      horarioFin: '18:00',
      imageUrl: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=400',
      images: [
        'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=400',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400'
      ],
      incluye: ['Entrada al museo', 'Guia bilingue', 'Mapa del tesoro souvenir'],
      noIncluye: ['Transporte', 'Alimentos'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'museo-the-persistence',
      categoriaServicio: ['Cultura'],
      operador: 'The Persistence Museum',
      puntoEncuentro: 'Centro de San Andres, Avenida Colombia',
      itinerario: 'Bienvenida e introduccion historica\nRecorrido por salas del museo\nExhibicion de artefactos originales\nTienda de souvenirs',
      politicasCancelacion: 'Cancelacion gratuita hasta 12 horas antes.\nNo show: sin reembolso.',
    },
    {
      id: 'tour-6',
      nombre: 'Visita Primera Iglesia Bautista',
      descripcion: 'Conoce la Primera Iglesia Bautista de San Andres, un icono de la fe y la cultura raizal. Arquitectura historica, cantos espirituales y la historia religiosa de la isla.',
      categoria: 'Tour',
      publicado: true,
      precioPerPerson: 45000,
      duracion: '2 horas',
      capacidad: 20,
      ubicacion: 'San Andres - La Loma',
      telefono: '+57 8 5150005',
      email: 'iglesia@guiasai.com',
      diasOperacion: 'Lun-Sab: 09:00, 15:00',
      horarios: ['09:00', '15:00'],
      horariosDisponibles: ['09:00', '15:00'],
      horarioInicio: '09:00',
      horarioFin: '17:00',
      imageUrl: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=400',
      images: [
        'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=400',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
      ],
      incluye: ['Guia local', 'Recorrido historico', 'Explicacion arquitectonica'],
      noIncluye: ['Transporte', 'Alimentos'],
      dificultad: 'Facil',
      destacado: true,
      slug: 'primera-iglesia-bautista',
      categoriaServicio: ['Cultura'],
      operador: 'GuiaSAI Cultural Tours',
      puntoEncuentro: 'Primera Iglesia Bautista, La Loma',
      itinerario: 'Llegada y contexto historico\nRecorrido por la iglesia\nHistoria de la comunidad raizal\nFotos y despedida',
      politicasCancelacion: 'Cancelacion gratuita hasta 12 horas antes.',
    },
  ]
}

function getMockTransports() {
  return [
    {
      id: 'trans-1',
      nombre: 'Coop de Taxis Unidos',
      descripcion: 'Servicio de taxis con choferes certificados',
      categoria: 'Transporte',
      publicado: true,
      precioPerVehicle: 200000,
      capacidad: 4,
      tipo: 'Automóvil',
      telefono: '+57 8 5180000',
      email: 'reservas@taximun.com',
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
      operador: 'Coop Taxis',
      rutas: ['Aeropuerto-Hotel', 'Hotel-Hotel', 'Tours'],
    },
    {
      id: 'trans-2',
      nombre: 'Minivan Premium',
      descripcion: 'Servicio de minivanes con aire acondicionado',
      categoria: 'Transporte',
      publicado: true,
      precioPerVehicle: 350000,
      capacidad: 8,
      tipo: 'Minivan',
      telefono: '+57 8 5180001',
      email: 'minivans@guiasai.com',
      imageUrl: 'https://images.unsplash.com/photo-1552799446-159ba9523315?w=400',
      operador: 'TransGO',
      rutas: ['Aeropuerto-Hotel', 'Grupos'],
    },
    {
      id: 'trans-3',
      nombre: 'Lancha Privada',
      descripcion: 'Transporte acuático a Old Providence',
      categoria: 'Transporte',
      publicado: true,
      precioPerVehicle: 500000,
      capacidad: 12,
      tipo: 'Lancha',
      telefono: '+57 8 5180002',
      email: 'lanchas@guiasai.com',
      imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400',
      operador: 'Caribbean Boats',
      rutas: ['San Andrés-Providencia'],
    },
  ]
}

// =========================================================
// SLUGIFY & SERVICE BY SLUG
// =========================================================

/**
 * Convierte un nombre de servicio a slug URL-friendly
 * "Preparación Sopa de Cangrejo" → "preparacion-sopa-cangrejo"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')    // quitar caracteres especiales
    .replace(/\s+/g, '-')            // espacios a guiones
    .replace(/-+/g, '-')             // guiones múltiples
    .replace(/^-|-$/g, '')           // guiones inicio/fin
}

/**
 * Busca un servicio por slug en Airtable
 * Primero busca en el campo Slug de Airtable, si no encuentra, genera slugs y compara
 */
export async function getServiceBySlug(slug: string): Promise<any | null> {
  try {
    if (!AIRTABLE_BASE_ID) {
      console.warn('⚠️ Airtable no configurado, buscando en mock data')
      return getServiceBySlugFromMock(slug)
    }

    // Estrategia 1: Buscar en los datos ya mapeados de tours y alojamientos
    // Esto usa el mismo mapeo que getTours/getAccommodations, asegurando consistencia de slugs
    const [tours, accommodations] = await Promise.all([
      getTours(),
      getAccommodations(),
    ])
    const allServices = [...tours, ...accommodations]

    for (const service of allServices) {
      const serviceSlug = service.slug || slugify(service.nombre || '')
      if (serviceSlug === slug || slugify(service.nombre || '') === slug) {
        return service
      }
    }

    // Estrategia 2: Buscar directamente en Airtable con mapeo completo
    const url = airtableUrl(TABLES.SERVICIOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula: `{Publicado} = 1`,
        maxRecords: 100,
      },
    })

    for (const record of response.data.records) {
      const nombre = record.fields.Servicio || record.fields.Nombre || ''
      const recordSlug = record.fields.Slug || record.fields.slug || slugify(nombre)

      if (recordSlug === slug || slugify(nombre) === slug) {
        return mapRecordToService(record)
      }
    }

    return null
  } catch (error) {
    console.error('❌ Error buscando servicio por slug:', error)
    return getServiceBySlugFromMock(slug)
  }
}

function mapRecordToService(record: any): any {
  const fields = record.fields
  return {
    id: record.id,
    nombre: fields.Servicio || fields.Nombre || 'Sin nombre',
    descripcion: fields.Descripcion || '',
    itinerario: fields.Itinerario || '',
    categoria: fields['Tipo de Servicio'] || fields.Categoria || 'Tour',
    publicado: fields.Publicado === true,
    precioBase: parseFloat(fields['Precio actualizado'] || fields.Precio || fields.PrecioBase || 0),
    precioPerPerson: parseFloat(fields['Precio actualizado'] || fields.Precio || 0),
    precioActualizado: parseFloat(fields['Precio actualizado'] || fields.Precio || 0),
    duracion: fields.Duracion || '',
    capacidad: parseInt(fields.Capacidad || 0),
    ubicacion: fields.Ubicacion || '',
    puntoEncuentro: fields['Punto de encuentro'] || fields.PuntoEncuentro || '',
    telefono: fields['Telefono Contacto'] || fields.Telefono || '',
    email: fields['Email Contacto'] || fields.Email || '',
    operador: fields['Nombre Operador Aliado'] || fields.Operador || '',
    imageUrl: extractImages(fields)[0] || '',
    images: extractImages(fields),
    diasOperacion: fields.Dias_Operacion || fields['Días de Operación'] || fields.Horarios_Operacion || '',
    horarios: parseHorarios(fields.Horarios_Operacion || fields['Horarios de Operacion'] || ''),
    incluye: normalizeToArray(fields.Incluye || fields['que Incluye']),
    noIncluye: normalizeToArray(fields.NoIncluye),
    dificultad: fields.Dificultad || '',
    politicasCancelacion: fields['Politicas de cancelacion'] || fields.PoliticasCancelacion || '',
    destacado: fields.Destacado === true,
    slug: fields.Slug || slugify(fields.Servicio || fields.Nombre || ''),
    categoriaServicio: normalizeToArray(fields.Categoria),
  } as any
}

// ─────────────────────────────────────────────────────────────────────────────
// VOUCHERS — Base: "Reservas seguimiento" (appij4vUx7GZEwf5x)
// Tabla: Generador_vouchers (tblX8O6bNt4fsJlUR)
// ─────────────────────────────────────────────────────────────────────────────

const VOUCHER_BASE_ID = 'appij4vUx7GZEwf5x'
const VOUCHER_TABLE = 'Generador_vouchers'

function voucherUrl(recordId?: string): string {
  const path = recordId
    ? `/v0/${VOUCHER_BASE_ID}/${encodeURIComponent(VOUCHER_TABLE)}/${recordId}`
    : `/v0/${VOUCHER_BASE_ID}/${encodeURIComponent(VOUCHER_TABLE)}`
  return buildProxyUrl(path)
}

export interface VoucherRecord {
  id: string
  titular: string
  reservaNum: string
  pax: string
  fecha: string
  hora: string
  puntoEncuentro: string
  observaciones: string
  notasAdicionales: string
  tourName: string
  estado: string
  estadoVoucher: string
  ultimaModificacion: string
}

function mapVoucherRecord(record: any): VoucherRecord {
  const f = record.fields
  return {
    id: record.id,
    titular: f['Nombre del Cliente'] || '',
    reservaNum: f['Reserva #'] || '',
    pax: f['Numero de Personas '] || f['Numero de Personas'] || '',
    fecha: f['Fecha de Inicio'] || '',
    hora: f['Hora de Cita'] || '',
    puntoEncuentro: f['Punto de Encuentro'] || '',
    observaciones: f['Observaciones Especiales'] || '',
    notasAdicionales: f['Notas adicionales'] || '',
    tourName: f['Nombre del tour texto'] || (Array.isArray(f['Nombre del Servicio (from Tipo de Tour)']) ? f['Nombre del Servicio (from Tipo de Tour)'][0] : '') || '',
    estado: f['Estado de la Reserva'] || f['Estado'] || '',
    estadoVoucher: f['Estado_Voucher'] || '',
    ultimaModificacion: f['ultima modificacion'] || record.createdTime || '',
  }
}

export async function getVouchers(limit = 50): Promise<VoucherRecord[]> {
  try {
    const url = voucherUrl()
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        maxRecords: limit,
        'sort[0][field]': 'ultima modificacion',
        'sort[0][direction]': 'desc',
      },
    })
    return response.data.records.map(mapVoucherRecord)
  } catch (error) {
    console.error('❌ Error obteniendo vouchers:', error)
    return []
  }
}

export async function getVoucherById(recordId: string): Promise<VoucherRecord | null> {
  try {
    const url = voucherUrl(recordId)
    const response = await axios.get(url, { headers: getHeaders() })
    return mapVoucherRecord(response.data)
  } catch (error) {
    console.error('❌ Error obteniendo voucher:', error)
    return null
  }
}

export interface VoucherFormData {
  titular: string
  telefono: string
  email: string
  pax: string
  fecha: string
  hora: string
  puntoEncuentro: string
  observaciones: string
  notasAdicionales: string
  tourId: string   // record ID de Servicios Turisticos
  estado: string
}

export async function createVoucher(data: VoucherFormData): Promise<VoucherRecord | null> {
  try {
    const url = voucherUrl()
    const fields: Record<string, any> = {
      'Nombre del Cliente': data.titular,
      'Teléfono': data.telefono,
      'Email': data.email,
      'Numero de Personas ': data.pax,
      'Fecha de Inicio': data.fecha,
      'Hora de Cita': data.hora,
      'Observaciones Especiales': data.observaciones,
      'Notas adicionales': data.notasAdicionales,
      'Estado de la Reserva': data.estado || 'PENDIENTE',
    }
    if (data.puntoEncuentro) fields['Punto de Encuentro'] = data.puntoEncuentro
    if (data.tourId) fields['Tipo de Tour'] = [{ id: data.tourId }]

    const response = await axios.post(url, { fields }, { headers: getHeaders() })
    return mapVoucherRecord(response.data)
  } catch (error) {
    console.error('❌ Error creando voucher:', error)
    return null
  }
}

export interface ServicioTuristico {
  id: string
  nombre: string
}

export async function getServiciosTuristicosVoucher(): Promise<ServicioTuristico[]> {
  try {
    const path = `/v0/${VOUCHER_BASE_ID}/${encodeURIComponent('Servicios Turisticos')}`
    const url = buildProxyUrl(path)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: { maxRecords: 100, 'sort[0][field]': 'Nombre del Servicio', 'sort[0][direction]': 'asc' },
    })
    return response.data.records.map((r: any) => ({
      id: r.id,
      nombre: r.fields['Nombre del Servicio'] || '',
    }))
  } catch (error) {
    console.error('❌ Error obteniendo servicios:', error)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function getServiceBySlugFromMock(slug: string): any | null {
  const allMock = [...getMockTours(), ...getMockAccommodations(), ...getMockTransports()]
  return allMock.find((s: any) => s.slug === slug || slugify(s.nombre || '') === slug) || null
}

// =========================================================
// 🏨 PROPUESTA DE ALOJAMIENTOS — página pública para clientes
// =========================================================

/**
 * Obtiene alojamientos de AlojamientosTuristicos_SAI para la propuesta al cliente.
 * Si se pasan IDs específicos, filtra por ellos. Si no, retorna todos los publicados.
 */
export async function getCotizadorAlojamientosSAI(ids?: string[]): Promise<any[]> {
  try {
    const url = airtableUrl('AlojamientosTuristicos_SAI')
    const filterByFormula = ids && ids.length > 0
      ? `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`
      : `{Publicado} = TRUE()`

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula,
        maxRecords: 50,
        'sort[0][field]': 'Servicio',
        'sort[0][direction]': 'asc',
      },
    })

    return response.data.records.map((record: any) => {
      const f = record.fields
      // Imagen: preferir WordPress (no expira) sobre adjunto Airtable
      const imgWP = typeof f['ImagenWP'] === 'string' ? f['ImagenWP'].split(',')[0].trim() : ''
      const imgAt = extractImages(f)[0] || ''
      return {
        id: record.id,
        nombre: f['Servicio'] || f['Nombre alternativo'] || 'Sin nombre',
        descripcion: f['Descripcion'] || f['Itinerario'] || '',
        tipo: f['Tipo de Alojamiento'] || '',
        ubicacion: f['Ubicacion'] || 'San Andrés',
        imageUrl: imgWP || imgAt,
        // Precios
        precioBase: parseFloat(f['Precio actualizado'] || 0),
        precio2Huespedes: parseFloat(f['Precio 2 Huespedes'] || 0),
        precio3Huespedes: parseFloat(f['Precio 3 Huespedes'] || 0),
        precio4Huespedes: parseFloat(f['Precio 4+ Huespedes'] || 0),
        // Capacidad
        capacidadMax: parseInt(f['Capacidad Maxima'] || 0),
        minimoNoches: parseInt(f['Minimo Noches'] || 1),
        // Camas
        camasSencillas: parseInt(f['Camas Sencillas'] || 0),
        camasDobles: parseInt(f['Camas Dobles'] || 0),
        camaQueen: parseInt(f['Cama Queen'] || 0),
        camaKing: parseInt(f['Cama King'] || 0),
        // Amenidades
        vistaMar: f['Vista al mar'] === true,
        accesoPiscina: f['Acceso Piscina'] === true,
        accesoJacuzzi: f['Acceso a Jacuzzi'] === true,
        accesoBar: f['Acceso a Bar'] === true,
        tieneCocina: f['Tiene Cocina'] === true,
        aceptaBebes: f['Acepta Bebes'] === true,
        // Políticas
        politicaCancelacion: f['Politicas de cancelacion'] || '',
        queIncluye: f['que Incluye'] || '',
        // Contacto operador
        telefono: f['Telefono Contacto'] || '',
        operador: normalizeToArray(f['Nombre Operador Aliado'])[0] || '',
        publicado: f['Publicado'] === true,
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo alojamientos SAI para propuesta:', error?.response?.data || error)
    return []
  }
}

// =========================================================
// 🎫 COTIZADOR — Tours, Paquetes, Alojamientos, Tiquetes, Traslados
// Funciones usadas por AdminCotizacionBuilder (siempre desde Airtable)
// =========================================================

/**
 * Obtiene tours desde ServiciosTuristicos_SAI (para el cotizador admin)
 */
export async function getCotizadorTours(): Promise<any[]> {
  try {
    const url = airtableUrl(TABLES.SERVICIOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula: `{Tipo de Servicio} = 'Tour'`,
        maxRecords: 100,
        'sort[0][field]': 'Servicio',
        'sort[0][direction]': 'asc',
      },
    })
    return response.data.records.map((record: any) => {
      const f = record.fields
      const horarioCampo = f['Horarios de Operacion'] || f['Dias_Operacion'] || ''
      const horarios = parseHorarios(horarioCampo)
      return {
        id: record.id,
        nombre: f['Servicio'] || f['Nombre'] || 'Sin nombre',
        descripcion: f['Descripcion'] || f['Itinerario'] || '',
        categoria: f['Tipo de Servicio'] || 'Tour',
        categoriaServicio: normalizeToArray(f['Categoria']),
        precioBase: parseFloat(f['Precio actualizado'] || f['Precio'] || 0),
        precioPerPerson: parseFloat(f['Precio actualizado'] || f['Precio'] || 0),
        duracion: f['Duracion'] || '',
        capacidad: parseInt(f['Capacidad'] || 10),
        ubicacion: f['Ubicacion'] || '',
        telefono: f['Telefono Contacto'] || '',
        imageUrl: extractImages(f)[0] || '',
        images: extractImages(f),
        diasOperacion: horarioCampo,
        horarios: horarios,
        horariosDisponibles: horarios,
        incluye: normalizeToArray(f['que Incluye'] || f['Incluye']),
        publicado: f['Publicado'] === true,
        slug: String(f['Slug'] || f['slug'] || ''),
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo tours del cotizador:', error?.response?.data || error)
    return []
  }
}

/**
 * Obtiene paquetes desde ServiciosTuristicos_SAI (para el cotizador admin)
 */
export async function getCotizadorPaquetes(): Promise<any[]> {
  try {
    const url = airtableUrl(TABLES.SERVICIOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula: `AND({Tipo de Servicio} = 'Paquete', {Publicado} = TRUE())`,
        maxRecords: 50,
        'sort[0][field]': 'Servicio',
        'sort[0][direction]': 'asc',
      },
    })
    return response.data.records.map((record: any) => {
      const f = record.fields
      return {
        id: record.id,
        nombre: f['Servicio'] || f['Nombre'] || 'Sin nombre',
        descripcion: f['Descripcion'] || f['Itinerario'] || '',
        precioBase: parseFloat(f['Precio actualizado'] || f['Precio'] || 0),
        duracion: f['Duracion'] || '',
        imageUrl: extractImages(f)[0] || '',
        images: extractImages(f),
        incluye: normalizeToArray(f['que Incluye'] || f['Incluye']),
        publicado: f['Publicado'] === true,
        slug: String(f['Slug'] || f['slug'] || ''),
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo paquetes del cotizador:', error?.response?.data || error)
    return []
  }
}

/**
 * Obtiene todos los alojamientos desde Alojamientos_Solicitudes (para el cotizador admin)
 */
export async function getCotizadorAlojamientos(): Promise<any[]> {
  try {
    const url = airtableUrl(TABLES.ALOJAMIENTOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        filterByFormula: `{Publicado} = TRUE()`,
        maxRecords: 100,
        'sort[0][field]': 'Servicio',
        'sort[0][direction]': 'asc',
      },
    })
    return response.data.records.map((record: any) => {
      const f = record.fields
      return {
        id: record.id,
        nombre: f['Servicio'] || f['Nombre alternativo'] || 'Sin nombre',
        descripcion: f['Descripcion'] || '',
        categoria: normalizeToArray(f['Categoria']),
        accommodationType: f['Tipo de Alojamiento'] || 'Hotel',
        precioBase: parseFloat(f['Precio actualizado'] || f['Precio Costo'] || 0),
        precioActualizado: parseFloat(f['Precio actualizado'] || 0),
        precio2Huespedes: parseFloat(f['Precio 2 Huespedes'] || 0),
        precio3Huespedes: parseFloat(f['Precio 3 Huespede'] || 0),
        precio4Huespedes: parseFloat(f['Precio 4+ Huespedes'] || 0),
        capacidad: parseInt(f['Capacidad Maxima'] || f['Capacidad'] || 0),
        minimoNoches: parseInt(f['Minimo Noches'] || 1),
        ubicacion: f['Ubicacion'] || '',
        telefono: f['Telefono Contacto'] || '',
        email: f['Email contacto'] || '',
        imageUrl: extractImages(f)[0] || '',
        images: extractImages(f),
        publicado: f['Publicado'] === true,
        estado: f['Estado'] || '',
        camasSencillas: parseInt(f['Camas Sencillas'] || 0),
        camasDobles: parseInt(f['Camas Dobles'] || 0),
        camaQueen: parseInt(f['Cama Queen'] || 0),
        camaKing: parseInt(f['Cama King'] || 0),
        tieneCocina: f['Tiene Cocina'] === true,
        accesoJacuzzi: f['Acceso a Jacuzzi'] === true,
        accesoPiscina: f['Acceso a Piscina'] === true,
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo alojamientos del cotizador:', error?.response?.data || error)
    return []
  }
}

/**
 * Obtiene tiquetes aéreos desde Tiquetes_Aereos
 */
export async function getCotizadorTiquetes(): Promise<any[]> {
  try {
    const url = airtableUrl(TABLES.TIQUETES_AEREOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        maxRecords: 100,
        'sort[0][field]': 'Nombre',
        'sort[0][direction]': 'asc',
      },
    })
    // Filtra client-side: excluye registros con datos corruptos (Nombre contiene comas)
    const validRecords = response.data.records.filter((r: any) => {
      const nombre = r.fields['Nombre'] || ''
      return !nombre.includes(',') && nombre.length < 80
    })
    return validRecords.map((record: any) => {
      const f = record.fields
      return {
        id: record.id,
        nombre: f['Nombre'] || 'Sin nombre',
        descripcion: f['Descripcion'] || '',
        origen: f['Origen'] || '',
        destino: f['Destino'] || '',
        aerolinea: f['Aerolinea'] || '',
        tipoVuelo: f['Tipo_Vuelo'] || 'Directo',
        precioAdulto: parseFloat(f['Precio_Adulto'] || 0),
        tasasAdulto: parseFloat(f['Tasas_Adulto'] || 0),
        precioNino: parseFloat(f['Precio_Nino'] || 0),
        tasasNino: parseFloat(f['Tasas_Nino'] || 0),
        precioBebe: parseFloat(f['Precio_Bebe'] || 0),
        incluyeEquipaje: f['Incluye_Equipaje'] === true || f['Incluye_Equipaje'] === 'TRUE',
        equipajeBodegaKG: parseInt(f['Equipaje_Bodega_KG'] || 0),
        horarioSalida: f['Horario_Salida'] || '',
        duracionVuelo: f['Duracion_Vuelo'] || '',
        diasOperacion: f['Dias_Operacion'] || '',
        moneda: f['Moneda'] || 'COP',
        operadorAliado: f['Operador_Aliado'] || '',
        telefono: f['Telefono_Contacto'] || '',
        publicado: f['Publicado'] === true || f['Publicado'] === 'TRUE',
        precioBase: parseFloat(f['Precio_Adulto'] || 0),
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo tiquetes:', error?.response?.data || error)
    return []
  }
}

/**
 * Obtiene traslados desde Traslados
 */
export async function getCotizadorTraslados(): Promise<any[]> {
  try {
    const url = airtableUrl(TABLES.TRASLADOS)
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: {
        maxRecords: 100,
        'sort[0][field]': 'Nombre',
        'sort[0][direction]': 'asc',
      },
    })
    // Filtra client-side: excluye registros con datos corruptos (Nombre contiene comas)
    const validRecords = response.data.records.filter((r: any) => {
      const nombre = r.fields['Nombre'] || ''
      return !nombre.includes(',') && nombre.length < 80
    })
    return validRecords.map((record: any) => {
      const f = record.fields
      return {
        id: record.id,
        nombre: f['Nombre'] || 'Sin nombre',
        descripcion: f['Descripcion'] || '',
        tipo: f['Tipo'] || 'Taxi',
        origen: f['Origen'] || '',
        destino: f['Destino'] || '',
        precioBase: parseFloat(f['Precio_Base'] || 0),
        precioPorPersona: parseFloat(f['Precio_Por_Persona'] || 0),
        capacidadMax: parseInt(f['Capacidad_Max_Pasajeros'] || 4),
        tipoVehiculo: f['Tipo_Vehiculo'] || 'Taxi',
        disponibilidad24h: f['Disponibilidad_24h'] === true || f['Disponibilidad_24h'] === 'TRUE',
        diasOperacion: f['Dias_Operacion'] || '',
        tiempoEstimado: f['Tiempo_Estimado'] || '',
        incluyeEquipaje: f['Incluye_Equipaje'] === true || f['Incluye_Equipaje'] === 'TRUE',
        operadorAliado: f['Operador_Aliado'] || '',
        telefono: f['Telefono_Contacto'] || '',
        publicado: f['Publicado'] === true || f['Publicado'] === 'TRUE',
      }
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo traslados:', error?.response?.data || error)
    return []
  }
}
