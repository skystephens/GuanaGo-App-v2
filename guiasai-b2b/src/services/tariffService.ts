/**
 * GuiaSAI - Tariff Service
 *
 * Servicio de tarifas ESTÁTICO que lee desde src/data/servicios.json.
 * Esto elimina las llamadas a Airtable para precios y fotos de servicios.
 *
 * VENTAJAS:
 * - 0 llamadas a API de Airtable
 * - Carga instantánea de datos (import estático)
 * - Funciona sin necesidad de public/data/tarifas.json
 *
 * ACTUALIZACIÓN:
 * - Editar src/data/servicios.json con los datos actualizados
 */

import { serviciosLocales } from './localDataService'
import { getOverrides, applyOverrides, initImageOverrides } from './serviceOverrides'

// Cache en memoria para evitar re-transformaciones
let cachedData: TarifasData | null = null

/** Limpia el cache en memoria para forzar recarga. */
export function clearTariffCache(): void {
  cachedData = null
}

interface TarifasData {
  version: string
  lastUpdated: string
  accommodations: any[]
  tours: any[]
  transports: any[]
  vehicles: any[]
  eventos: any[]
  paquetes: any[]
}

/**
 * Obtiene las tarifas desde el JSON estático local (src/data/servicios.json)
 * Usa caché en memoria para consistencia en la sesión
 */
export async function getTarifasData(_forceRefresh = false): Promise<TarifasData> {
  if (cachedData) {
    console.log('📦 [TariffService] Usando datos en caché')
    return cachedData
  }

  // Cargar image-overrides.json desde /public para que todos los navegadores
  // vean las imágenes configuradas por el admin (no depende del localStorage del admin)
  await initImageOverrides()

  // Limpiar cachés legacy de imageCacheService (ya no se usa)
  localStorage.removeItem('guiasai_img_cache_v1')
  localStorage.removeItem('guiasai_img_cache_v2')

  console.log('📦 [TariffService] Cargando desde servicios.json local...')
  // Las imágenes vienen directamente de servicios.json (campo ImagenWP o Imagenurl)
  // sin ninguna llamada a Airtable en runtime.
  cachedData = serviciosLocales

  // Guardar metadata de última actualización en localStorage
  localStorage.setItem('guiasai_tariff_version', cachedData.version)
  localStorage.setItem('guiasai_tariff_last_update', cachedData.lastUpdated)

  console.log(`✅ [TariffService] Datos cargados: v${cachedData.version}`)
  console.log(`   - Alojamientos: ${cachedData.accommodations.length}`)
  console.log(`   - Tours: ${cachedData.tours.length}`)
  console.log(`   - Transportes: ${cachedData.transports.length}`)

  return cachedData
}

/**
 * Obtiene todos los alojamientos (solo publicados, con overrides aplicados)
 */
export async function getAccommodationsFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.accommodations, overrides).filter((acc: any) => acc.publicado !== false)
}

/**
 * Obtiene todos los tours (solo publicados, con overrides aplicados)
 */
export async function getToursFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.tours, overrides).filter((tour: any) => tour.publicado !== false)
}

/**
 * Obtiene todos los transportes (solo publicados, con overrides aplicados)
 */
export async function getTransportsFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.transports, overrides).filter((trans: any) => trans.publicado !== false)
}

/**
 * Obtiene paquetes turísticos desde servicios.json (solo publicados)
 */
export async function getPaquetesFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.paquetes || [], overrides).filter((p: any) => p.publicado !== false)
}

/**
 * Admin: todos los servicios sin filtro de publicado (para cotizador interno)
 */
export async function getAllAccommodationsAdmin(): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(), getOverrides()])
  return applyOverrides(data.accommodations, overrides)
}

export async function getAllToursAdmin(): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(), getOverrides()])
  return applyOverrides(data.tours, overrides)
}

export async function getAllPaquetesAdmin(): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(), getOverrides()])
  return applyOverrides(data.paquetes || [], overrides)
}

/**
 * Obtiene todos los vehículos de alquiler (solo publicados, con overrides aplicados)
 */
export async function getVehiclesFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.vehicles || [], overrides).filter((v: any) => v.publicado !== false)
}

/**
 * Obtiene todos los eventos (solo publicados, con overrides aplicados)
 */
export async function getEventosFromJSON(forceRefresh = false): Promise<any[]> {
  const [data, overrides] = await Promise.all([getTarifasData(forceRefresh), getOverrides()])
  return applyOverrides(data.eventos || [], overrides).filter((e: any) => e.publicado !== false)
}

/**
 * Retorna TODOS los servicios sin filtrar por publicado (para uso del SuperAdmin).
 * Aplica overrides para que el admin vea el estado actual de visibilidad y categorías.
 */
export async function getAllServicesForAdmin(): Promise<{
  tours: any[]
  accommodations: any[]
  transports: any[]
  vehicles: any[]
  eventos: any[]
  paquetes: any[]
}> {
  const [data, overrides] = await Promise.all([getTarifasData(true), getOverrides()])
  return {
    tours: applyOverrides(data.tours, overrides),
    accommodations: applyOverrides(data.accommodations, overrides),
    transports: applyOverrides(data.transports, overrides),
    vehicles: applyOverrides(data.vehicles || [], overrides),
    eventos: applyOverrides(data.eventos || [], overrides),
    paquetes: applyOverrides(data.paquetes || [], overrides),
  }
}

/**
 * Obtiene un alojamiento por ID
 */
export async function getAccommodationById(id: string): Promise<any | null> {
  const accommodations = await getAccommodationsFromJSON()
  return accommodations.find(acc => acc.id === id) || null
}

/**
 * Obtiene un tour por ID
 */
export async function getTourById(id: string): Promise<any | null> {
  const tours = await getToursFromJSON()
  return tours.find(tour => tour.id === id) || null
}

/**
 * Obtiene un transporte por ID
 */
export async function getTransportById(id: string): Promise<any | null> {
  const transports = await getTransportsFromJSON()
  return transports.find(trans => trans.id === id) || null
}

/**
 * Busca servicios por categoría
 */
export async function searchByCategory(category: string, type: 'accommodation' | 'tour' | 'transport'): Promise<any[]> {
  const data = await getTarifasData()

  let items: any[] = []
  if (type === 'accommodation') {
    items = data.accommodations
  } else if (type === 'tour') {
    items = data.tours
  } else {
    items = data.transports
  }

  return items.filter(item =>
    item.categoria?.toLowerCase().includes(category.toLowerCase()) ||
    item.categoriaServicio?.some((c: string) => c.toLowerCase().includes(category.toLowerCase()))
  )
}

/**
 * Obtiene tours destacados
 */
export async function getFeaturedTours(): Promise<any[]> {
  const tours = await getToursFromJSON()
  return tours.filter(tour => tour.destacado === true)
}

/**
 * Obtiene alojamientos destacados
 */
export async function getFeaturedAccommodations(): Promise<any[]> {
  const accommodations = await getAccommodationsFromJSON()
  return accommodations.filter(acc => acc.destacado === true)
}

/**
 * Verifica si hay una nueva versión disponible
 * Con datos locales siempre está actualizado
 */
export async function checkForUpdates(): Promise<{ hasUpdate: boolean; localVersion?: string; serverVersion?: string }> {
  const localVersion = localStorage.getItem('guiasai_tariff_version')
  return { hasUpdate: false, localVersion: localVersion ?? undefined }
}

/**
 * Obtiene la versión actual de las tarifas
 */
export function getCurrentVersion(): string | null {
  return localStorage.getItem('guiasai_tariff_version')
}

/**
 * Obtiene la fecha de última actualización
 */
export function getLastUpdateDate(): string | null {
  return localStorage.getItem('guiasai_tariff_last_update')
}

/**
 * Formatea la fecha de actualización para mostrar al usuario
 */
export function getFormattedLastUpdate(): string {
  const lastUpdate = getLastUpdateDate()
  if (!lastUpdate) return 'Nunca'

  try {
    const date = new Date(lastUpdate)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return lastUpdate
  }
}

/**
 * Exporta las tarifas actuales como CSV para descargar
 * Útil para backup o análisis externo
 */
export function exportToCSV(): string {
  const data = cachedData ?? serviciosLocales

  const rows: string[] = []

  // Header
  rows.push('TIPO,ID,NOMBRE,CATEGORIA,PRECIO,UNIDAD,PUBLICADO')

  // Alojamientos
  data.accommodations.forEach((acc: any) => {
    rows.push([
      'ALOJAMIENTO',
      acc.id,
      `"${acc.nombre?.replace(/"/g, '""') || ''}"`,
      acc.categoria || acc.accommodationType || '',
      acc.precioActualizado || acc.precioBase || 0,
      'noche',
      acc.publicado ? 'Sí' : 'No'
    ].join(','))
  })

  // Tours
  data.tours.forEach((tour: any) => {
    rows.push([
      'TOUR',
      tour.id,
      `"${tour.nombre?.replace(/"/g, '""') || ''}"`,
      tour.categoria || '',
      tour.precioPerPerson || tour.precioBase || 0,
      'persona',
      tour.publicado ? 'Sí' : 'No'
    ].join(','))
  })

  // Transportes
  data.transports.forEach((trans: any) => {
    rows.push([
      'TRANSPORTE',
      trans.id,
      `"${trans.nombre?.replace(/"/g, '""') || ''}"`,
      trans.tipo || '',
      trans.precioPerVehicle || trans.precioBase || 0,
      'vehículo',
      trans.publicado ? 'Sí' : 'No'
    ].join(','))
  })

  return rows.join('\n')
}
