/**
 * GuiaSAI - Local Data Service
 *
 * Lee y transforma los datos de src/data/servicios.json
 * (exportación directa de Airtable) al formato interno de la app.
 *
 * Reemplaza la dependencia de Airtable API para datos de servicios.
 */

import serviciosRaw from '../data/servicios.json'
import imageOverridesRaw from '../data/image-overrides.json'

/**
 * Retorna las URLs de WordPress si están definidas en image-overrides.json,
 * o un array vacío si el servicio no tiene overrides aún.
 */
function getOverrideImages(id: string | number): string[] {
  const key = String(id)
  const entry = (imageOverridesRaw as Record<string, { urls?: string[] }>)[key]
  if (!entry || !Array.isArray(entry.urls) || entry.urls.length === 0) return []
  return entry.urls.filter((u: string) => typeof u === 'string' && u.startsWith('http'))
}

// =========================================================
// HELPERS DE TRANSFORMACIÓN
// =========================================================

/**
 * Extrae URLs del campo ImagenWP (URLs permanentes de WordPress).
 * Formato: "https://url1.jpg,https://url2.jpg"
 */
function parseWPImages(imagenwp: string): string[] {
  if (!imagenwp || typeof imagenwp !== 'string') return []
  // Normalizar: ". https://" → ",https://" (corrige separador punto-espacio por coma faltante)
  const normalized = imagenwp.replace(/\.\s+(https?:\/\/)/g, ',$1')
  return normalized
    .split(',')
    .map(u => u.trim().replace(/\.$/, ''))
    .filter(u => u.startsWith('http'))
}

/**
 * Extrae URLs de imágenes del formato de Airtable:
 * "archivo.jpg (https://...),archivo2.jpg (https://...)"
 */
function parseImageUrls(imagenurl: string): string[] {
  if (!imagenurl || typeof imagenurl !== 'string') return []
  const urls: string[] = []
  const regex = /\(([^)]+)\)/g
  let match
  while ((match = regex.exec(imagenurl)) !== null) {
    const url = match[1].trim()
    if (url.startsWith('http')) {
      urls.push(url)
    }
  }
  return urls
}

/**
 * Normaliza el campo Publicado que puede llegar como "checked", true, "TRUE", etc.
 */
function isPublicado(value: unknown): boolean {
  if (value === true || value === 'checked' || value === 'TRUE' || value === 'Sí' || value === 'Si') return true
  if (!value || value === '' || value === false || value === 'false') return false
  return false
}

/**
 * Convierte string de categorías separadas por coma a array
 * "Excursión a Cayos,Aventura y Naturaleza" → ["Excursión a Cayos", "Aventura y Naturaleza"]
 */
function parseCategorias(categoria: string): string[] {
  if (!categoria || typeof categoria !== 'string') return []
  return categoria.split(',').map(c => c.trim()).filter(Boolean)
}

/**
 * Parsea horarios desde strings como "9:00 am", "9:00 AM - 5:30 PM", "09:00, 14:00"
 * Retorna array de strings en formato HH:MM (24h)
 */
function parseHorariosStr(horarioStr: string): string[] {
  if (!horarioStr || typeof horarioStr !== 'string') return []
  const matches = horarioStr.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/gi)
  if (!matches) return []
  return [...new Set(matches.map(h => {
    const parts = h.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i)
    if (!parts) return null
    let hours = parseInt(parts[1])
    const mins = parts[2]
    const meridiem = parts[3]?.toUpperCase()
    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${mins}`
  }).filter((h): h is string => h !== null))].sort()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// =========================================================
// MAPEADORES POR TIPO DE SERVICIO
// =========================================================

function mapToTour(record: Record<string, unknown>) {
  const imagenwp = typeof record['ImagenWP'] === 'string' ? record['ImagenWP'] : ''
  const imagenurl = typeof record['Imagenurl'] === 'string' ? record['Imagenurl'] : ''
  const overrides = getOverrideImages(record['ID'] as string | number ?? record['Slug'] as string | number)
  const wpImages = parseWPImages(imagenwp)
  const imagenes = wpImages.length > 0 ? wpImages : (overrides.length > 0 ? overrides : parseImageUrls(imagenurl))
  const categorias = parseCategorias(typeof record['Categoria'] === 'string' ? record['Categoria'] : '')
  const horarioRaw = typeof record['Horarios'] === 'string' ? record['Horarios'] : ''
  const horarios = parseHorariosStr(horarioRaw)

  const nombre = typeof record['Servicio'] === 'string' ? record['Servicio'] : 'Sin nombre'
  const slugRaw = record['Slug']
  const slugValue = typeof slugRaw === 'string' && slugRaw ? slugRaw : slugify(nombre)

  return {
    id: String(record['ID'] ?? record['Slug'] ?? slugValue),
    nombre,
    descripcion: typeof record['Descripcion'] === 'string' ? record['Descripcion'] : '',
    itinerario: typeof record['Itinerario'] === 'string' ? record['Itinerario'] : '',
    categoria: 'Tour',
    publicado: isPublicado(record['Publicado']),
    precioBase: Number(record['Precio actualizado']) || 0,
    precioPerPerson: Number(record['Precio actualizado']) || 0,
    duracion: typeof record['Duracion'] === 'string' ? record['Duracion'] : '',
    capacidad: Number(record['Capacidad']) || 10,
    ubicacion: typeof record['Ubicacion'] === 'string' ? record['Ubicacion'] : 'San Andrés',
    puntoEncuentro: typeof record['Punto de encuentro - Lugar de recogida "Pickup at hotel'] === 'string'
      ? record['Punto de encuentro - Lugar de recogida "Pickup at hotel'] as string
      : (typeof record['Punto de encuentro'] === 'string' ? record['Punto de encuentro'] as string : ''),
    telefono: typeof record['Telefono Contacto'] === 'string' ? record['Telefono Contacto'] : '',
    email: typeof record['Email contacto'] === 'string' ? record['Email contacto'] : '',
    operador: typeof record['Nombre Operador Aliado'] === 'string' ? record['Nombre Operador Aliado'] : '',
    imageUrl: imagenes[0] || '',
    images: imagenes,
    diasOperacion: typeof record['Dias_Operacion'] === 'string' ? record['Dias_Operacion'] : '',
    horarios,
    horariosDisponibles: horarios,
    horarioInicio: horarios[0] || '08:00',
    horarioFin: horarios[horarios.length - 1] || '18:00',
    incluye: (() => {
      const q = record['que Incluye']
      return typeof q === 'string' && q ? q.split('\n').map(l => l.trim()).filter(Boolean) : []
    })(),
    noIncluye: [],
    dificultad: 'Fácil',
    politicasCancelacion: typeof record['Politicas de cancelacion'] === 'string'
      ? record['Politicas de cancelacion'] : '',
    destacado: isPublicado(record['Destacado']),
    slug: slugValue,
    categoriaServicio: categorias,
    tipoCliente: typeof record['Tipo de Cliente'] === 'string' ? record['Tipo de Cliente'] : '',
  }
}

function mapToAccommodation(record: Record<string, unknown>) {
  const imagenwp = typeof record['ImagenWP'] === 'string' ? record['ImagenWP'] : ''
  const imagenurl = typeof record['Imagenurl'] === 'string' ? record['Imagenurl'] : ''
  const overrides = getOverrideImages(record['ID'] as string | number ?? record['Slug'] as string | number)
  const wpImages = parseWPImages(imagenwp)
  const imagenes = wpImages.length > 0 ? wpImages : (overrides.length > 0 ? overrides : parseImageUrls(imagenurl))
  const categorias = parseCategorias(typeof record['Categoria'] === 'string' ? record['Categoria'] : '')

  const nombre = typeof record['Servicio'] === 'string' ? record['Servicio'] : 'Sin nombre'
  const slugRaw = record['Slug']
  const slugValue = typeof slugRaw === 'string' && slugRaw ? slugRaw : slugify(nombre)
  const tipoAloj = typeof record['Tipo de Alojamiento'] === 'string' ? record['Tipo de Alojamiento'] : 'Hotel'
  const precioBase = Number(record['Precio actualizado']) || 0

  return {
    id: String(record['ID'] ?? record['Slug'] ?? slugValue),
    nombre,
    descripcion: typeof record['Descripcion'] === 'string' ? record['Descripcion'] : '',
    categoria: tipoAloj || 'Alojamiento',
    publicado: isPublicado(record['Publicado']),
    accommodationType: tipoAloj || 'Hotel',
    precioActualizado: precioBase,
    precio1Huesped: Number(record['Precio 1 Huesped']) || precioBase,
    precio2Huespedes: Number(record['Precio 2 Huespedes']) || precioBase,
    precio3Huespedes: Number(record['Precio 3 Huespedes']) || precioBase,
    precio4Huespedes: Number(record['Precio 4+ Huespedes']) || precioBase,
    precioBase,
    precioMin: precioBase,
    precioMax: precioBase,
    capacidad: Number(record['Capacidad Maxima'] || record['Capacidad']) || 4,
    ubicacion: typeof record['Ubicacion'] === 'string' ? record['Ubicacion'] : 'San Andrés',
    telefono: typeof record['Telefono Contacto'] === 'string' ? record['Telefono Contacto'] : '',
    email: typeof record['Email contacto'] === 'string' ? record['Email contacto'] : '',
    imageUrl: imagenes[0] || '',
    images: imagenes,
    estrellas: 0,
    amenities: [] as string[],
    servicios: [] as string[],
    disabledDates: [] as string[],
    horarioCheckIn: '14:00',
    horarioCheckOut: '11:00',
    destacado: isPublicado(record['Destacado']),
    slug: slugValue,
    categoriaServicio: categorias,
    minimoNoches: Number(record['Minimo Noches']) || 1,
  }
}

function mapToTransport(record: Record<string, unknown>) {
  const imagenwp = typeof record['ImagenWP'] === 'string' ? record['ImagenWP'] : ''
  const imagenurl = typeof record['Imagenurl'] === 'string' ? record['Imagenurl'] : ''
  const overrides = getOverrideImages(record['ID'] as string | number ?? record['Slug'] as string | number)
  const wpImages = parseWPImages(imagenwp)
  const imagenes = wpImages.length > 0 ? wpImages : (overrides.length > 0 ? overrides : parseImageUrls(imagenurl))

  const nombre = typeof record['Servicio'] === 'string' ? record['Servicio'] : 'Sin nombre'
  const slugRaw = record['Slug']
  const slugValue = typeof slugRaw === 'string' && slugRaw ? slugRaw : slugify(nombre)

  return {
    id: String(record['ID'] ?? record['Slug'] ?? slugValue),
    nombre,
    descripcion: typeof record['Descripcion'] === 'string' ? record['Descripcion'] : '',
    categoria: 'Transporte',
    publicado: isPublicado(record['Publicado']),
    precioBase: Number(record['Precio actualizado']) || 0,
    precioPerVehicle: Number(record['Precio actualizado']) || 0,
    capacidad: Number(record['Capacidad']) || 4,
    tipo: typeof record['Tipo de Alojamiento'] === 'string' ? record['Tipo de Alojamiento'] : 'Automóvil',
    telefono: typeof record['Telefono Contacto'] === 'string' ? record['Telefono Contacto'] : '',
    email: typeof record['Email contacto'] === 'string' ? record['Email contacto'] : '',
    operador: typeof record['Nombre Operador Aliado'] === 'string' ? record['Nombre Operador Aliado'] : '',
    imageUrl: imagenes[0] || '',
    images: imagenes,
    rutas: [] as string[],
  }
}

function mapToVehicle(record: Record<string, unknown>) {
  const imagenwp = typeof record['ImagenWP'] === 'string' ? record['ImagenWP'] : ''
  const imagenurl = typeof record['Imagenurl'] === 'string' ? record['Imagenurl'] : ''
  const overrides = getOverrideImages(record['ID'] as string | number ?? record['Slug'] as string | number)
  const wpImages = parseWPImages(imagenwp)
  const imagenes = wpImages.length > 0 ? wpImages : (overrides.length > 0 ? overrides : parseImageUrls(imagenurl))

  const nombre = typeof record['Servicio'] === 'string' ? record['Servicio'] : 'Sin nombre'
  const slugRaw = record['Slug']
  const slugValue = typeof slugRaw === 'string' && slugRaw ? slugRaw : slugify(nombre)

  return {
    id: String(record['ID'] ?? record['Slug'] ?? slugValue),
    nombre,
    descripcion: typeof record['Descripcion'] === 'string' ? record['Descripcion'] : '',
    categoria: 'Alquiler Vehiculo',
    tipoServicio: 'Alquiler Vehiculo',
    publicado: isPublicado(record['Publicado']),
    precioBase: Number(record['Precio actualizado']) || 0,
    precioPerVehicle: Number(record['Precio actualizado']) || 0,
    capacidad: Number(record['Capacidad']) || 2,
    tipo: typeof record['Tipo de Alojamiento'] === 'string' ? record['Tipo de Alojamiento'] : 'Vehículo',
    telefono: typeof record['Telefono Contacto'] === 'string' ? record['Telefono Contacto'] : '',
    email: typeof record['Email contacto'] === 'string' ? record['Email contacto'] : '',
    operador: typeof record['Nombre Operador Aliado'] === 'string' ? record['Nombre Operador Aliado'] : '',
    imageUrl: imagenes[0] || '',
    images: imagenes,
    slug: slugValue,
    diasOperacion: typeof record['Dias_Operacion'] === 'string' ? record['Dias_Operacion'] : '',
    ubicacion: typeof record['Ubicacion'] === 'string' ? record['Ubicacion'] : 'San Andrés',
  }
}

function mapToEvento(record: Record<string, unknown>) {
  const imagenwp = typeof record['ImagenWP'] === 'string' ? record['ImagenWP'] : ''
  const imagenurl = typeof record['Imagenurl'] === 'string' ? record['Imagenurl'] : ''
  const overrides = getOverrideImages(record['ID'] as string | number ?? record['Slug'] as string | number)
  const wpImages = parseWPImages(imagenwp)
  const imagenes = wpImages.length > 0 ? wpImages : (overrides.length > 0 ? overrides : parseImageUrls(imagenurl))
  const categorias = parseCategorias(typeof record['Categoria'] === 'string' ? record['Categoria'] : '')
  const horarioRaw = typeof record['Horarios'] === 'string' ? record['Horarios'] : ''
  const horarios = parseHorariosStr(horarioRaw)

  const nombre = typeof record['Servicio'] === 'string' ? record['Servicio'] : 'Sin nombre'
  const slugRaw = record['Slug']
  const slugValue = typeof slugRaw === 'string' && slugRaw ? slugRaw : slugify(nombre)

  return {
    id: String(record['ID'] ?? record['Slug'] ?? slugValue),
    nombre,
    descripcion: typeof record['Descripcion'] === 'string' ? record['Descripcion'] : '',
    itinerario: typeof record['Itinerario'] === 'string' ? record['Itinerario'] : '',
    categoria: 'Evento',
    tipoServicio: 'Evento',
    publicado: isPublicado(record['Publicado']),
    precioBase: Number(record['Precio actualizado']) || 0,
    precioPerPerson: Number(record['Precio actualizado']) || 0,
    duracion: typeof record['Duracion'] === 'string' ? record['Duracion'] : '',
    capacidad: Number(record['Capacidad']) || 20,
    ubicacion: typeof record['Ubicacion'] === 'string' ? record['Ubicacion'] : 'San Andrés',
    telefono: typeof record['Telefono Contacto'] === 'string' ? record['Telefono Contacto'] : '',
    email: typeof record['Email contacto'] === 'string' ? record['Email contacto'] : '',
    operador: typeof record['Nombre Operador Aliado'] === 'string' ? record['Nombre Operador Aliado'] : '',
    imageUrl: imagenes[0] || '',
    images: imagenes,
    horarios,
    horariosDisponibles: horarios,
    diasOperacion: typeof record['Dias_Operacion'] === 'string' ? record['Dias_Operacion'] : '',
    incluye: (() => {
      const q = record['que Incluye']
      return typeof q === 'string' && q ? q.split('\n').map(l => l.trim()).filter(Boolean) : []
    })(),
    noIncluye: [],
    destacado: isPublicado(record['Destacado']),
    slug: slugValue,
    categoriaServicio: categorias,
    politicasCancelacion: typeof record['Politicas de cancelacion'] === 'string'
      ? record['Politicas de cancelacion'] : '',
  }
}

// =========================================================
// TRANSFORMACIÓN PRINCIPAL
// =========================================================

const allRecords = serviciosRaw as Record<string, unknown>[]

export const localTours = allRecords
  .filter(r => r['Tipo de Servicio'] === 'Tour')
  .map(mapToTour)

export const localAccommodations = allRecords
  .filter(r => r['Tipo de Servicio'] === 'Alojamiento')
  .map(mapToAccommodation)

export const localTransports = allRecords
  .filter(r => {
    const tipoServicio = r['Tipo de Servicio']
    const categoria = typeof r['Categoria'] === 'string' ? r['Categoria'] : ''
    return tipoServicio === 'Transporte' || categoria.toLowerCase().includes('transporte')
  })
  .map(mapToTransport)

export const localVehicles = allRecords
  .filter(r => r['Tipo de Servicio'] === 'Alquiler Vehiculo')
  .map(mapToVehicle)

export const localEventos = allRecords
  .filter(r => r['Tipo de Servicio'] === 'Evento')
  .map(mapToEvento)

export const localPaquetes = allRecords
  .filter(r => r['Tipo de Servicio'] === 'Paquete Turístico' || r['Tipo de Servicio'] === 'Paquete')
  .map(mapToTour)

export const serviciosLocales = {
  version: '1.0.local',
  lastUpdated: new Date().toISOString(),
  accommodations: localAccommodations,
  tours: localTours,
  transports: localTransports,
  vehicles: localVehicles,
  eventos: localEventos,
  paquetes: localPaquetes,
}
