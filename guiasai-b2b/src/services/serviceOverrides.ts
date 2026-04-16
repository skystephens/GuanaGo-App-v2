/**
 * GuiaSAI - Service Overrides
 *
 * Permite al SuperAdmin controlar la visibilidad y categoría de servicios
 * de forma permanente. Los cambios se persisten en Airtable (tabla ServiceOverrides)
 * y se cachean en localStorage para acceso offline.
 *
 * También gestiona Paquetes Turísticos creados por el admin.
 */

import axios from 'axios'
// Firebase desactivado temporalmente — se reactiva cuando se implemente auth de agencias
const fbSaveImageOverrides = async (_: any) => {}
const fbSaveServiceOverrides = async (_: any) => {}
const fbSavePaquetes = async (_: any) => {}

const AIRTABLE_BASE_ID = (import.meta as any).env.VITE_AIRTABLE_BASE_ID || ''

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

function airtableRecordUrl(table: string, recordId: string): string {
  return buildProxyUrl(`/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`)
}

const OVERRIDES_TABLE = 'ServiceOverrides'
const PACKAGES_TABLE = 'Paquetes'
const OVERRIDES_CACHE_KEY = 'guiasai_service_overrides_cache'
const PACKAGES_CACHE_KEY = 'guiasai_packages_cache'
const IMAGE_OVERRIDES_KEY = 'guiasai_image_overrides'

// Sin Authorization — el proxy lo agrega server-side
const getHeaders = () => ({ 'Content-Type': 'application/json' })

const isAirtableConfigured = () => Boolean(AIRTABLE_BASE_ID)

// =========================================================
// TIPOS
// =========================================================

export interface ServiceOverride {
  publicado?: boolean
  categoria?: string
  tipoServicio?: string
}

export interface Paquete {
  airtableId?: string
  nombre: string
  descripcion: string
  tipoServicio: string       // Tour, Alojamiento, Paquete, Evento, Otro…
  serviceIds: string[]       // IDs de servicios incluidos (solo si es Paquete)
  serviceNames?: string[]    // Nombres para mostrar
  precioTotal: number
  capacidad?: number
  duracion?: string
  ubicacion?: string
  publicado: boolean
  imagenurl?: string
  slug?: string
}

// =========================================================
// OVERRIDES DE VISIBILIDAD / CATEGORÍA
// =========================================================

/**
 * Obtiene los overrides desde Airtable.
 * Si Airtable no está configurado o falla, usa el caché de localStorage.
 * Retorna un objeto indexado por ServiceID.
 */
export async function getOverrides(): Promise<Record<string, ServiceOverride>> {
  // Si no hay Airtable configurado, usar solo localStorage
  if (!isAirtableConfigured()) {
    return getLocalOverrides()
  }

  // El proxy puede tener token viejo — usamos localStorage directamente
  return getLocalOverrides()
}

/**
 * Lee overrides del localStorage (caché o fallback sin Airtable).
 */
function getLocalOverrides(): Record<string, ServiceOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Guarda o actualiza un override para un servicio.
 * Si ya existe un registro para ese ServiceID, lo actualiza (PATCH).
 * Si no existe, lo crea (POST).
 */
export async function saveOverride(
  serviceId: string,
  serviceName: string,
  override: ServiceOverride
): Promise<void> {
  // Actualizar caché local inmediatamente
  const localOverrides = getLocalOverrides()
  localOverrides[serviceId] = { ...localOverrides[serviceId], ...override }
  localStorage.setItem(OVERRIDES_CACHE_KEY, JSON.stringify(localOverrides))

  // Sync a Firestore en segundo plano
  fbSaveServiceOverrides(localOverrides).catch(() => {})

  if (!isAirtableConfigured()) {
    console.warn('⚠️ Airtable no configurado, override guardado solo en localStorage')
    return
  }

  try {
    // Buscar si ya existe un registro para este ServiceID
    const searchUrl = airtableUrl(OVERRIDES_TABLE)
    const searchResponse = await axios.get(searchUrl, {
      headers: getHeaders(),
      params: {
        filterByFormula: `{ServiceID} = '${serviceId}'`,
        maxRecords: 1,
      },
    })

    const fields: Record<string, any> = {}
    if (override.publicado !== undefined) fields['Publicado'] = override.publicado
    if (override.categoria !== undefined) fields['Categoria'] = override.categoria
    if (override.tipoServicio !== undefined) fields['TipoServicio'] = override.tipoServicio
    fields['ServiceID'] = serviceId
    fields['ServiceName'] = serviceName

    if (searchResponse.data.records.length > 0) {
      // Actualizar registro existente
      const existingId = searchResponse.data.records[0].id
      await axios.patch(
        airtableRecordUrl(OVERRIDES_TABLE, existingId),
        { fields },
        { headers: getHeaders() }
      )
      console.log(`✅ Override actualizado para ${serviceName}`)
    } else {
      // Crear nuevo registro
      await axios.post(searchUrl, { fields }, { headers: getHeaders() })
      console.log(`✅ Override creado para ${serviceName}`)
    }
  } catch (error) {
    console.error('❌ Error guardando override en Airtable:', error)
    // El caché local ya está actualizado, así que la UI responde aunque Airtable falle
  }
}

/**
 * Aplica los overrides sobre un array de servicios.
 * Modifica publicado y/o categoria según lo que haya en overrides.
 */
export function applyOverrides<T extends { id: string }>(
  items: T[],
  overrides: Record<string, ServiceOverride>
): T[] {
  const imageOverrides = getLocalImageOverrides()
  return items.map(item => {
    const override = overrides[item.id]
    const imgs = imageOverrides[item.id]
    if (!override && !imgs?.length) return item
    const result = { ...item }
    if (override?.publicado !== undefined) (result as any).publicado = override.publicado
    if (override?.categoria !== undefined) (result as any).categoria = override.categoria
    if (override?.tipoServicio !== undefined) (result as any).tipoServicio = override.tipoServicio
    if (imgs && imgs.length > 0) {
      (result as any).images = imgs
      ;(result as any).imageUrl = imgs[0]
    }
    return result
  })
}

// =========================================================
// IMAGE OVERRIDES (localStorage)
// =========================================================

/**
 * Lee los overrides de imágenes desde localStorage.
 * Retorna un objeto { [serviceId]: string[] }
 */
export function getLocalImageOverrides(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(IMAGE_OVERRIDES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Guarda (o borra) las URLs de imágenes de un servicio en localStorage.
 * Pasar array vacío elimina las imágenes override para ese servicio.
 */
export function saveLocalImageOverride(serviceId: string, images: string[]): void {
  const current = getLocalImageOverrides()
  if (images.length === 0) {
    delete current[serviceId]
  } else {
    current[serviceId] = images.filter(u => u.startsWith('http'))
  }
  localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(current))

  // Sync a Firestore en segundo plano
  fbSaveImageOverrides(current).catch(() => {})
}

/**
 * Exporta todos los image overrides como JSON descargable.
 * Coloca el archivo descargado en /public/image-overrides.json antes de hacer build.
 */
export function exportImageOverridesAsJSON(): string {
  const overrides = getLocalImageOverrides()
  return JSON.stringify(overrides, null, 2)
}

/**
 * Carga image-overrides.json desde /public (incluido en el build/dist).
 * Merge con los overrides de localStorage, priorizando localStorage (admin local).
 * Llamar al inicio de la app para que todos los navegadores vean las imágenes.
 */
export async function initImageOverrides(): Promise<void> {
  try {
    const response = await fetch('./image-overrides.json?v=' + Date.now(), {
      cache: 'no-store',
    })
    if (!response.ok) return

    const bundled: Record<string, string[]> = await response.json()
    if (!bundled || typeof bundled !== 'object') return

    const isEmpty = Object.keys(bundled).length === 0
    if (isEmpty) return

    // El archivo bundled es autoritativo. Merge: bundled gana sobre local stale.
    // Filtramos URLs de Airtable del local (pueden estar caducadas).
    const local = getLocalImageOverrides()
    const merged: Record<string, string[]> = { ...bundled }
    for (const [id, urls] of Object.entries(local)) {
      if (merged[id]) continue // bundled ya tiene este servicio, no sobreescribir
      const validUrls = (urls as string[]).filter((u: string) => !u.includes('airtableusercontent.com'))
      if (validUrls.length > 0) merged[id] = validUrls
    }
    localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(merged))

    const count = Object.keys(bundled).length
    console.log(`🖼️ [ImageOverrides] ${count} servicio(s) con imágenes cargados desde image-overrides.json`)
  } catch {
    // Silencioso — si no existe el archivo o falla la red, usa solo localStorage
  }
}

// =========================================================
// PAQUETES TURÍSTICOS
// =========================================================

/**
 * Obtiene los paquetes turísticos creados por el admin desde localStorage.
 * Los paquetes son creados en la app y guardados localmente (y en Firestore).
 * No usan una tabla Paquetes en Airtable — los datos de servicios vienen de ServiciosTuristicos_SAI.
 */
export async function getPaquetes(): Promise<Paquete[]> {
  return getLocalPaquetes()
}

function getLocalPaquetes(): Paquete[] {
  try {
    const raw = localStorage.getItem(PACKAGES_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function slugifyPaquete(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Crea un nuevo paquete turístico en Airtable.
 */
export async function createPaquete(paquete: Omit<Paquete, 'airtableId'>): Promise<void> {
  // Guardar en caché local primero
  const local = getLocalPaquetes()
  const newPaquete = { ...paquete, slug: paquete.slug || slugifyPaquete(paquete.nombre) }
  local.push(newPaquete)
  localStorage.setItem(PACKAGES_CACHE_KEY, JSON.stringify(local))

  // Sync a Firestore en segundo plano
  fbSavePaquetes(local).catch(() => {})

  if (!isAirtableConfigured()) {
    console.warn('⚠️ Airtable no configurado, paquete guardado solo en localStorage')
    return
  }

  try {
    const url = airtableUrl(PACKAGES_TABLE)
    const fields: Record<string, any> = {
      Nombre: paquete.nombre,
      Descripcion: paquete.descripcion,
      TipoServicio: paquete.tipoServicio || 'Paquete',
      ServiceIDs: JSON.stringify(paquete.serviceIds),
      ServiceNames: JSON.stringify(paquete.serviceNames || []),
      PrecioTotal: paquete.precioTotal,
      Publicado: paquete.publicado,
      Imagenurl: paquete.imagenurl || '',
      Slug: paquete.slug || slugifyPaquete(paquete.nombre),
    }
    if (paquete.capacidad !== undefined) fields['Capacidad'] = paquete.capacidad
    if (paquete.duracion) fields['Duracion'] = paquete.duracion
    if (paquete.ubicacion) fields['Ubicacion'] = paquete.ubicacion
    await axios.post(url, { fields }, { headers: getHeaders() })
    console.log(`✅ Paquete "${paquete.nombre}" creado en Airtable`)
    // Refrescar caché desde Airtable
    await getPaquetes()
  } catch (error) {
    console.error('❌ Error creando paquete en Airtable:', error)
  }
}

/**
 * Actualiza un paquete existente en Airtable.
 */
export async function updatePaquete(
  airtableId: string,
  data: Partial<Omit<Paquete, 'airtableId'>>
): Promise<void> {
  // Actualizar caché local
  const local = getLocalPaquetes()
  const idx = local.findIndex((p: any) => p.airtableId === airtableId)
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...data }
    localStorage.setItem(PACKAGES_CACHE_KEY, JSON.stringify(local))

    // Sync a Firestore en segundo plano
    fbSavePaquetes(local).catch(() => {})
  }

  if (!isAirtableConfigured()) return

  try {
    const url = airtableRecordUrl(PACKAGES_TABLE, airtableId)
    const fields: Record<string, any> = {}
    if (data.nombre !== undefined) fields['Nombre'] = data.nombre
    if (data.descripcion !== undefined) fields['Descripcion'] = data.descripcion
    if (data.tipoServicio !== undefined) fields['TipoServicio'] = data.tipoServicio
    if (data.serviceIds !== undefined) fields['ServiceIDs'] = JSON.stringify(data.serviceIds)
    if (data.serviceNames !== undefined) fields['ServiceNames'] = JSON.stringify(data.serviceNames)
    if (data.precioTotal !== undefined) fields['PrecioTotal'] = data.precioTotal
    if (data.capacidad !== undefined) fields['Capacidad'] = data.capacidad
    if (data.duracion !== undefined) fields['Duracion'] = data.duracion
    if (data.ubicacion !== undefined) fields['Ubicacion'] = data.ubicacion
    if (data.publicado !== undefined) fields['Publicado'] = data.publicado
    if (data.imagenurl !== undefined) fields['Imagenurl'] = data.imagenurl
    if (data.slug !== undefined) fields['Slug'] = data.slug
    await axios.patch(url, { fields }, { headers: getHeaders() })
    console.log(`✅ Paquete actualizado`)
    await getPaquetes()
  } catch (error) {
    console.error('❌ Error actualizando paquete:', error)
  }
}

/**
 * Elimina un paquete de Airtable.
 */
export async function deletePaquete(airtableId: string): Promise<void> {
  // Eliminar del caché local
  const local = getLocalPaquetes()
  const filtered = local.filter((p: any) => p.airtableId !== airtableId)
  localStorage.setItem(PACKAGES_CACHE_KEY, JSON.stringify(filtered))

  // Sync a Firestore en segundo plano
  fbSavePaquetes(filtered).catch(() => {})

  if (!isAirtableConfigured()) return

  try {
    const url = airtableRecordUrl(PACKAGES_TABLE, airtableId)
    await axios.delete(url, { headers: getHeaders() })
    console.log(`✅ Paquete eliminado`)
  } catch (error) {
    console.error('❌ Error eliminando paquete:', error)
  }
}
