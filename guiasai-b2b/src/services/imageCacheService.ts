/**
 * GuiaSAI - Image Cache Service
 *
 * Mantiene una caché de URLs de imágenes de Airtable en localStorage.
 * Las URLs de Airtable expiran cada ~2 semanas; este servicio las refresca
 * automáticamente en background la próxima vez que el usuario abre la app.
 *
 * Flujo:
 *  1. Al importar el módulo carga localStorage sincrónicamente.
 *  2. tariffService aplica las URLs cacheadas sobre los datos estáticos.
 *  3. Si las URLs están por expirar, lanza un refresh en background.
 *  4. Al terminar el refresh emite 'guiasai:images-refreshed' para que
 *     App.tsx recargue los datos con las URLs frescas.
 */

const CACHE_KEY = 'guiasai_img_cache_v2'
// Refrescar cuando falten menos de 2 horas para expirar
const SAFETY_MARGIN_MS = 2 * 60 * 60 * 1000

interface ImageCache {
  expiry: number                   // Timestamp ms de expiración de las URLs de Airtable
  images: Record<string, string[]> // serviceId → [url1, url2, ...]
}

// Cache en memoria — se carga sincrónicamente al importar el módulo
let _cache: ImageCache | null = null

function _loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed: ImageCache = JSON.parse(raw)
      // Si las URLs ya expiraron, descartar la caché para forzar refresh
      if (parsed.expiry && Date.now() >= parsed.expiry) {
        localStorage.removeItem(CACHE_KEY)
        _cache = null
      } else {
        _cache = parsed
      }
    }
  } catch {
    _cache = null
  }
}

// Carga inmediata al importar (síncrono, antes de que localDataService compute sus exports)
_loadFromStorage()

/** Retorna URLs cacheadas para un servicio dado su ID, o [] si no hay cache. */
export function getImages(id: string | number): string[] {
  return _cache?.images[String(id)] ?? []
}

/** True si la caché no existe o las URLs están próximas a expirar. */
export function isStale(): boolean {
  if (!_cache) return true
  return Date.now() >= _cache.expiry - SAFETY_MARGIN_MS
}

/** Extrae el timestamp de expiración embebido en una URL de Airtable. */
function _extractExpiry(url: string): number | null {
  // Formato: https://v5.airtableusercontent.com/v3/u/50/50/TIMESTAMP_MS/...
  const match = url.match(/airtableusercontent\.com\/v\d+\/u\/\d+\/\d+\/(\d+)\//)
  if (!match) return null
  return parseInt(match[1])
}

/**
 * Extrae URLs desde el campo de imágenes de Airtable.
 * La API raw devuelve un array de objetos adjuntos: [{ url, filename }, ...]
 * El JSON bundleado usa formato string: "file.jpg (https://...)"
 * Esta función maneja ambos formatos.
 */
function _extractImageUrls(fields: any): string[] {
  // Intentar con múltiples nombres de campo (la API puede variar)
  const attachments = fields?.Imagenurl ?? fields?.ImagenURL ?? fields?.Fotos ?? fields?.Attachments

  // Formato array (respuesta raw de la API de Airtable)
  if (Array.isArray(attachments)) {
    return attachments.filter((a: any) => a?.url).map((a: any) => a.url as string)
  }

  // Formato string (JSON bundleado): "file.jpg (https://...)"
  if (typeof attachments === 'string' && attachments) {
    const urls: string[] = []
    const regex = /\(([^)]+)\)/g
    let match
    while ((match = regex.exec(attachments)) !== null) {
      const url = match[1].trim()
      if (url.startsWith('http')) urls.push(url)
    }
    return urls
  }

  return []
}

/** Construye la URL del proxy (mismo patrón que airtableService.ts). */
function _buildProxyUrl(path: string): string {
  if (import.meta.env.DEV) {
    return `/api/airtable${path}`
  }
  const base = import.meta.env.BASE_URL || '/agencias/'
  return `${base}api/proxy.php?path=${encodeURIComponent(path)}`
}

/**
 * Realiza una petición paginada a Airtable para obtener URLs de imágenes.
 * Intenta primero via proxy.php (seguro, token oculto).
 * Si el proxy falla con 403/404, cae en llamada directa usando VITE_AIRTABLE_API_KEY
 * (igual que GuanaGO — la clave queda en el bundle pero las imágenes siempre funcionan).
 */
async function _fetchImageRecords(basePath: string): Promise<any[]> {
  const directKey = (import.meta.env.VITE_AIRTABLE_API_KEY || '') as string

  // Directo a Airtable — como GuanaGO, siempre funciona
  if (directKey) {
    try {
      console.log('[ImageCache] Llamando directamente a Airtable...')
      const directUrl = `https://api.airtable.com${basePath}`
      const resp = await fetch(directUrl, {
        headers: { 'Authorization': `Bearer ${directKey}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        console.log(`[ImageCache] Airtable directo OK — ${data.records?.length ?? 0} registros`)
        return data.records ?? []
      }
      console.warn(`[ImageCache] Airtable directo devolvió ${resp.status}`)
    } catch (err) {
      console.warn('[ImageCache] Error en llamada directa a Airtable:', err)
    }
  }

  // Fallback: proxy.php (si el directo falla por CORS u otro motivo)
  try {
    const resp = await fetch(_buildProxyUrl(basePath), {
      headers: { 'Content-Type': 'application/json' },
    })
    if (resp.ok) return (await resp.json()).records ?? []
    console.warn(`[ImageCache] Proxy también falló: ${resp.status}`)
  } catch (err) {
    console.warn('[ImageCache] Proxy no disponible:', err)
  }

  throw new Error('No se pudo obtener registros — ni directo ni proxy')
}

/**
 * Descarga URLs frescas de Airtable y actualiza localStorage.
 * Usa proxy.php si está disponible; si no, llama directamente a Airtable.
 * Al terminar emite el evento 'guiasai:images-refreshed'.
 */
export async function refresh(): Promise<boolean> {
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID
  if (!baseId) {
    console.warn('[ImageCache] VITE_AIRTABLE_BASE_ID no definido — omitiendo refresh')
    return false
  }

  try {
    const table = 'ServiciosTuristicos_SAI'
    // Sin fields[] — traer todos los campos como hace refresh-servicios.js
    // Filtrar por fields[] causa 422 si algún nombre no coincide exactamente
    const basePath = `/v0/${baseId}/${encodeURIComponent(table)}?pageSize=100`

    const images: Record<string, string[]> = {}
    let minExpiry = Date.now() + 14 * 24 * 60 * 60 * 1000

    // pageSize=100 cubre los 92 registros actuales en una sola petición
    const records = await _fetchImageRecords(basePath)

    for (const record of records) {
      const id = String(record.fields?.ID ?? record.fields?.Slug ?? record.id ?? '')
      if (!id) continue

      // Priorizar ImagenWP (permanentes) sobre Airtable (expiran)
      const wpRaw: string = record.fields?.ImagenWP || ''
      const wpUrls = typeof wpRaw === 'string'
        ? wpRaw.split(',').map((u: string) => u.trim()).filter((u: string) => u.startsWith('http'))
        : []

      if (wpUrls.length > 0) {
        images[id] = wpUrls
        continue // WP URLs no expiran — no afectan minExpiry
      }

      const urls = _extractImageUrls(record.fields)
      if (urls.length > 0) {
        images[id] = urls
        const expiry = _extractExpiry(urls[0])
        if (expiry && expiry < minExpiry) minExpiry = expiry
      }
    }

    _cache = { expiry: minExpiry, images }
    localStorage.setItem(CACHE_KEY, JSON.stringify(_cache))

    console.log(
      `✅ [ImageCache] ${Object.keys(images).length} servicios actualizados.` +
      ` Expiran: ${new Date(minExpiry).toLocaleString()}`
    )
    window.dispatchEvent(new CustomEvent('guiasai:images-refreshed'))
    return true
  } catch (err) {
    console.warn('[ImageCache] Error al refrescar imágenes:', err)
    return false
  }
}
