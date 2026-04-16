/**
 * GuiaSAI - Firebase Service
 *
 * Todas las operaciones CRUD contra Firestore.
 * Diseño "write-through cache":
 *   1. localStorage se actualiza de inmediato (la UI no espera)
 *   2. Firestore se actualiza en segundo plano (async, sin bloquear)
 *   3. Al arrancar la app, se sincronizan los datos de Firestore → localStorage
 *
 * Si Firebase no está configurado o falla, el sistema sigue funcionando
 * con localStorage solamente (modo offline transparente).
 *
 * Colecciones en Firestore:
 *   cotizaciones/   — una por documento, ID = LocalCotizacion.id
 *   leads/          — una por documento, ID = email (sanitizado)
 *   agencias/       — una por documento, ID = LocalAgencia.id
 *   config/imageOverrides   — documento único con todas las imágenes
 *   config/serviceOverrides — documento único con todos los overrides
 *   config/paquetes         — documento único con array de paquetes
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebaseConfig'
import type { LocalCotizacion, LocalLead, LocalAgencia } from './localStorageService'
import type { ServiceOverride, Paquete } from './serviceOverrides'

// ── Helpers ────────────────────────────────────────────────

/** Convierte un email en un ID válido para Firestore */
const emailToId = (email: string) =>
  email.toLowerCase().replace(/[^a-z0-9]/g, '_')

/** Guard: evita errores si Firebase no está configurado */
function guard(): boolean {
  return isFirebaseConfigured() && db !== null
}

// ── COTIZACIONES ──────────────────────────────────────────

export async function fbSaveCotizacion(cot: LocalCotizacion): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'cotizaciones', cot.id), serializeDates(cot))
  } catch (e) {
    console.warn('Firebase: error guardando cotización', e)
  }
}

export async function fbUpdateCotizacion(
  id: string,
  updates: Partial<LocalCotizacion>
): Promise<void> {
  if (!guard()) return
  try {
    await updateDoc(doc(db!, 'cotizaciones', id), serializeDates(updates))
  } catch (e) {
    console.warn('Firebase: error actualizando cotización', e)
  }
}

export async function fbLoadCotizaciones(): Promise<LocalCotizacion[]> {
  if (!guard()) return []
  try {
    const snap = await getDocs(collection(db!, 'cotizaciones'))
    return snap.docs.map(d => d.data() as LocalCotizacion)
  } catch (e) {
    console.warn('Firebase: error cargando cotizaciones', e)
    return []
  }
}

// ── LEADS ─────────────────────────────────────────────────

export async function fbSaveLead(lead: LocalLead): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'leads', emailToId(lead.email)), lead, { merge: true })
  } catch (e) {
    console.warn('Firebase: error guardando lead', e)
  }
}

export async function fbLoadLeads(): Promise<LocalLead[]> {
  if (!guard()) return []
  try {
    const snap = await getDocs(collection(db!, 'leads'))
    return snap.docs.map(d => d.data() as LocalLead)
  } catch (e) {
    console.warn('Firebase: error cargando leads', e)
    return []
  }
}

// ── AGENCIAS ──────────────────────────────────────────────

export async function fbSaveAgencia(ag: LocalAgencia): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'agencias', ag.id), ag)
  } catch (e) {
    console.warn('Firebase: error guardando agencia', e)
  }
}

export async function fbUpdateAgencia(
  id: string,
  updates: Partial<LocalAgencia>
): Promise<void> {
  if (!guard()) return
  try {
    await updateDoc(doc(db!, 'agencias', id), updates as Record<string, any>)
  } catch (e) {
    console.warn('Firebase: error actualizando agencia', e)
  }
}

export async function fbLoadAgencias(): Promise<LocalAgencia[]> {
  if (!guard()) return []
  try {
    const snap = await getDocs(collection(db!, 'agencias'))
    return snap.docs.map(d => d.data() as LocalAgencia)
  } catch (e) {
    console.warn('Firebase: error cargando agencias', e)
    return []
  }
}

// ── IMAGE OVERRIDES ───────────────────────────────────────

export async function fbSaveImageOverrides(
  overrides: Record<string, string[]>
): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'config', 'imageOverrides'), { data: overrides })
  } catch (e) {
    console.warn('Firebase: error guardando imageOverrides', e)
  }
}

export async function fbLoadImageOverrides(): Promise<Record<string, string[]>> {
  if (!guard()) return {}
  try {
    const snap = await getDoc(doc(db!, 'config', 'imageOverrides'))
    return snap.exists() ? (snap.data()?.data ?? {}) : {}
  } catch (e) {
    console.warn('Firebase: error cargando imageOverrides', e)
    return {}
  }
}

// ── SERVICE OVERRIDES ─────────────────────────────────────

export async function fbSaveServiceOverrides(
  overrides: Record<string, ServiceOverride>
): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'config', 'serviceOverrides'), { data: overrides })
  } catch (e) {
    console.warn('Firebase: error guardando serviceOverrides', e)
  }
}

export async function fbLoadServiceOverrides(): Promise<Record<string, ServiceOverride>> {
  if (!guard()) return {}
  try {
    const snap = await getDoc(doc(db!, 'config', 'serviceOverrides'))
    return snap.exists() ? (snap.data()?.data ?? {}) : {}
  } catch (e) {
    console.warn('Firebase: error cargando serviceOverrides', e)
    return {}
  }
}

// ── PAQUETES ──────────────────────────────────────────────

export async function fbSavePaquetes(paquetes: Paquete[]): Promise<void> {
  if (!guard()) return
  try {
    await setDoc(doc(db!, 'config', 'paquetes'), { data: paquetes })
  } catch (e) {
    console.warn('Firebase: error guardando paquetes', e)
  }
}

export async function fbLoadPaquetes(): Promise<Paquete[]> {
  if (!guard()) return []
  try {
    const snap = await getDoc(doc(db!, 'config', 'paquetes'))
    return snap.exists() ? (snap.data()?.data ?? []) : []
  } catch (e) {
    console.warn('Firebase: error cargando paquetes', e)
    return []
  }
}

// ── SYNC GLOBAL (al arrancar la app) ──────────────────────

const COTIZACIONES_KEY  = 'guiasai_cotizaciones_local'
const LEADS_KEY         = 'guiasai_leads_local'
const AGENCIAS_KEY      = 'guiasai_agencias_local'
const OVERRIDES_KEY     = 'guiasai_service_overrides_cache'
const IMAGE_KEY         = 'guiasai_image_overrides'
const PACKAGES_KEY      = 'guiasai_packages_cache'

/**
 * Descarga todos los datos de Firestore y los fusiona con localStorage.
 * Firestore es la fuente de verdad — prevalece sobre localStorage.
 * Llamar una sola vez al inicio de la app.
 */
export async function syncFromFirestore(): Promise<void> {
  if (!guard()) return

  console.log('🔄 Sincronizando desde Firestore...')

  try {
    const [fbCots, fbLeads, fbAgs, fbImgs, fbOvrs, fbPkgs] = await Promise.all([
      fbLoadCotizaciones(),
      fbLoadLeads(),
      fbLoadAgencias(),
      fbLoadImageOverrides(),
      fbLoadServiceOverrides(),
      fbLoadPaquetes(),
    ])

    // Cotizaciones: merge por ID (Firestore gana)
    if (fbCots.length > 0) {
      const localRaw = localStorage.getItem(COTIZACIONES_KEY)
      const local: LocalCotizacion[] = localRaw ? JSON.parse(localRaw) : []
      const fbIds = new Set(fbCots.map(c => c.id))
      const localOnly = local.filter(c => !fbIds.has(c.id))
      const merged = [...fbCots, ...localOnly].sort(
        (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      )
      localStorage.setItem(COTIZACIONES_KEY, JSON.stringify(merged))
    }

    // Leads: merge por email (Firestore gana)
    if (fbLeads.length > 0) {
      const localRaw = localStorage.getItem(LEADS_KEY)
      const local: LocalLead[] = localRaw ? JSON.parse(localRaw) : []
      const fbEmails = new Set(fbLeads.map(l => l.email.toLowerCase()))
      const localOnly = local.filter(l => !fbEmails.has(l.email.toLowerCase()))
      localStorage.setItem(LEADS_KEY, JSON.stringify([...fbLeads, ...localOnly]))
    }

    // Agencias: merge por ID (Firestore gana)
    if (fbAgs.length > 0) {
      const localRaw = localStorage.getItem(AGENCIAS_KEY)
      const local: LocalAgencia[] = localRaw ? JSON.parse(localRaw) : []
      const fbIds = new Set(fbAgs.map(a => a.id))
      const localOnly = local.filter(a => !fbIds.has(a.id))
      localStorage.setItem(AGENCIAS_KEY, JSON.stringify([...fbAgs, ...localOnly]))
    }

    // Image overrides: merge (Firestore es base, localStorage puede agregar)
    if (Object.keys(fbImgs).length > 0) {
      const localRaw = localStorage.getItem(IMAGE_KEY)
      const local = localRaw ? JSON.parse(localRaw) : {}
      localStorage.setItem(IMAGE_KEY, JSON.stringify({ ...fbImgs, ...local }))
    }

    // Service overrides: Firestore gana
    if (Object.keys(fbOvrs).length > 0) {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(fbOvrs))
    }

    // Paquetes: Firestore gana
    if (fbPkgs.length > 0) {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(fbPkgs))
    }

    console.log(`✅ Sync completo: ${fbCots.length} cotizaciones, ${fbLeads.length} leads, ${fbAgs.length} agencias`)
  } catch (e) {
    console.warn('⚠️ Error en sync desde Firestore, usando datos locales:', e)
  }
}

// ── AIRTABLE CACHE (mirror en la nube) ────────────────────
//
// Guarda el catálogo completo de Airtable en Firestore para que:
//   • Otros dispositivos lean la info sin llamar a Airtable
//   • La app funcione si Airtable no está disponible
//
// Colección: airtableCache/
//   servicios   → catálogo ServiciosTuristicos_SAI (compactado)
//   metadata    → timestamps y conteos
//
// LÍMITE Firestore: 1 MB por documento.
// La función compacta los adjuntos (elimina miniaturas) para reducir tamaño.
// Estimado real: ~70 servicios × ~4 KB = ~280 KB → seguro.

/** Elimina objetos thumbnail de los adjuntos de Airtable para reducir tamaño */
function _compactAirtableFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, val] of Object.entries(fields)) {
    // Adjuntos de Airtable: array de objetos con url + thumbnails (los thumbnails pesan mucho)
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0]?.url) {
      out[key] = val.map((att: any) => ({
        url:      att.url      ?? '',
        filename: att.filename ?? '',
        type:     att.type     ?? '',
        width:    att.width    ?? 0,
        height:   att.height   ?? 0,
      }))
    } else {
      out[key] = val
    }
  }
  return out
}

/**
 * Guarda el catálogo de servicios de Airtable en Firestore.
 * Se llama desde el backup service tras descargar la info de Airtable.
 * Compacta los registros para cumplir el límite de 1MB de Firestore.
 */
export async function fbSaveAirtableCache(
  servicios: any[],
  backupMeta: { lastBackup: string; counts: Record<string, number> }
): Promise<void> {
  if (!guard()) return
  try {
    const compact = servicios.map(rec => ({
      id:          rec.id,
      createdTime: rec.createdTime,
      fields:      _compactAirtableFields(rec.fields ?? {}),
    }))

    await Promise.all([
      setDoc(doc(db!, 'airtableCache', 'servicios'), {
        records:    compact,
        savedAt:    new Date().toISOString(),
        count:      compact.length,
        backupMeta,
      }),
      setDoc(doc(db!, 'airtableCache', 'metadata'), {
        ...backupMeta,
        fbSyncedAt: new Date().toISOString(),
        serviciosCount: compact.length,
      }),
    ])
    console.log(`✅ Firebase: ${compact.length} servicios sincronizados en airtableCache`)
  } catch (e) {
    console.warn('Firebase: error guardando airtableCache/servicios', e)
    throw e
  }
}

/**
 * Carga el catálogo de servicios almacenado en Firestore.
 * Retorna null si no hay caché en la nube.
 */
export async function fbLoadAirtableCache(): Promise<{
  servicios: any[]
  savedAt: string | null
  count: number
} | null> {
  if (!guard()) return null
  try {
    const snap = await getDoc(doc(db!, 'airtableCache', 'servicios'))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      servicios: data.records  ?? [],
      savedAt:   data.savedAt  ?? null,
      count:     data.count    ?? 0,
    }
  } catch (e) {
    console.warn('Firebase: error cargando airtableCache/servicios', e)
    return null
  }
}

/**
 * Retorna la metadata del cache de Airtable en Firestore (cuándo fue el último sync).
 */
export async function fbGetAirtableCacheMetadata(): Promise<{
  fbSyncedAt: string | null
  lastBackup: string | null
  counts: Record<string, number>
} | null> {
  if (!guard()) return null
  try {
    const snap = await getDoc(doc(db!, 'airtableCache', 'metadata'))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      fbSyncedAt: data.fbSyncedAt ?? null,
      lastBackup: data.lastBackup ?? null,
      counts:     data.counts     ?? {},
    }
  } catch {
    return null
  }
}

// ── Utilidad: serializar Dates a ISO strings ───────────────

function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(serializeDates)
  if (typeof obj === 'object') {
    const out: any = {}
    for (const key of Object.keys(obj)) {
      out[key] = serializeDates(obj[key])
    }
    return out
  }
  return obj
}
