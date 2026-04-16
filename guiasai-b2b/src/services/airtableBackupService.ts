/**
 * GuiaSAI - Servicio de Backup de Airtable
 *
 * Descarga y almacena localmente TODA la información de Airtable:
 * - ServiciosTuristicos_SAI (servicios, precios, títulos, imágenes)
 * - CotizacionesGG (cotizaciones B2B)
 * - Leads (prospectos / CRM)
 * - Usuarios_Admins (administradores del sistema)
 *
 * El backup funciona como fallback si Airtable no está disponible.
 * Los datos se guardan en localStorage y se pueden exportar/importar como JSON.
 */

import axios from 'axios'
import {
  fbSaveAirtableCache,
  fbLoadAirtableCache,
  fbGetAirtableCacheMetadata,
} from './firebaseService'

// ── Configuración Airtable (igual que en airtableService.ts) ─────────────────
const AIRTABLE_BASE_ID = (import.meta as any).env.VITE_AIRTABLE_BASE_ID || ''

function buildProxyUrl(airtablePath: string): string {
  if ((import.meta as any).env.DEV) {
    return `/api/airtable${airtablePath}`
  }
  const base = (import.meta as any).env.BASE_URL || '/agencias/'
  return `${base}api/proxy.php?path=${encodeURIComponent(airtablePath)}`
}

function tableUrl(table: string): string {
  return buildProxyUrl(`/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`)
}

const getHeaders = () => ({ 'Content-Type': 'application/json' })

// ── Storage Keys ─────────────────────────────────────────────────────────────
const BACKUP_KEYS = {
  SERVICIOS:       'guiasai_backup_servicios',
  COTIZACIONES:    'guiasai_backup_cotizaciones',
  LEADS:           'guiasai_backup_leads',
  USUARIOS_ADMINS: 'guiasai_backup_usuarios_admins',
  METADATA:        'guiasai_backup_metadata',
} as const

const BACKUP_VERSION = '1.0'
// Cuántas horas antes de considerar el backup "desactualizado"
const STALE_HOURS = 24

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface BackupMetadata {
  lastBackup: string   // ISO date
  version: string
  counts: {
    servicios: number
    cotizaciones: number
    leads: number
    usuariosAdmins: number
  }
}

export interface BackupStatus {
  hasBackup: boolean
  isFresh: boolean          // < STALE_HOURS horas de antigüedad
  ageHours: number | null
  metadata: BackupMetadata | null
  // Firebase cloud sync
  fbSyncedAt: string | null // última vez que se sincronizó a Firebase
  fbAvailable: boolean      // si Firebase está configurado
}

// ── Helper: paginación automática ────────────────────────────────────────────

/**
 * Trae TODOS los registros de una tabla Airtable con paginación automática.
 * Airtable devuelve máximo 100 por página; esta función itera hasta el final.
 */
async function fetchAllRecords(
  tableName: string,
  extraParams: Record<string, any> = {}
): Promise<any[]> {
  const allRecords: any[] = []
  let offset: string | undefined = undefined

  do {
    // eslint-disable-next-line no-await-in-loop
    const res: { data: { records: any[]; offset?: string } } = await axios.get(tableUrl(tableName), {
      headers: getHeaders(),
      params: {
        ...extraParams,
        pageSize: 100,
        ...(offset ? { offset } : {}),
      },
    })
    const records: any[] = res.data.records || []
    allRecords.push(...records)
    offset = res.data.offset // undefined cuando es la última página
  } while (offset)

  return allRecords
}

// ── Funciones principales ─────────────────────────────────────────────────────

/**
 * Crea un backup completo de todas las tablas en localStorage.
 * Guarda los registros RAW de Airtable (con todos los campos tal cual)
 * incluyendo URLs de imágenes (campo Imagenurl / Attachments).
 *
 * @param onProgress Callback opcional para mostrar progreso (mensaje, 0-100)
 */
export async function createAirtableBackup(
  onProgress?: (step: string, pct: number) => void
): Promise<BackupMetadata> {
  if (!AIRTABLE_BASE_ID) {
    throw new Error('Airtable no configurado: falta VITE_AIRTABLE_BASE_ID en .env')
  }

  const counts = { servicios: 0, cotizaciones: 0, leads: 0, usuariosAdmins: 0 }
  let serviciosRaw: any[] = []

  // 1 · Servicios turísticos (catálogo completo: texto, precios, títulos, imágenes)
  onProgress?.('Descargando catálogo de servicios...', 5)
  try {
    serviciosRaw = await fetchAllRecords('ServiciosTuristicos_SAI', {
      sort: [{ field: 'Servicio', direction: 'asc' }],
    })
    counts.servicios = serviciosRaw.length
    _saveToStorage(BACKUP_KEYS.SERVICIOS, serviciosRaw)
    onProgress?.(`Servicios: ${counts.servicios} registros`, 30)
  } catch (err) {
    console.warn('[Backup] Error descargando ServiciosTuristicos_SAI:', err)
    _saveToStorage(BACKUP_KEYS.SERVICIOS, [])
    onProgress?.('Servicios: error (continuando...)', 30)
  }

  // 2 · Cotizaciones GG
  onProgress?.('Descargando cotizaciones...', 35)
  try {
    const cotizacionesRaw = await fetchAllRecords('CotizacionesGG')
    counts.cotizaciones = cotizacionesRaw.length
    _saveToStorage(BACKUP_KEYS.COTIZACIONES, cotizacionesRaw)
    onProgress?.(`Cotizaciones: ${counts.cotizaciones} registros`, 58)
  } catch (err) {
    console.warn('[Backup] Error descargando CotizacionesGG:', err)
    _saveToStorage(BACKUP_KEYS.COTIZACIONES, [])
    onProgress?.('Cotizaciones: error (continuando...)', 58)
  }

  // 3 · Leads / CRM — sin sort para evitar errores si el campo no existe
  onProgress?.('Descargando leads...', 62)
  try {
    const leadsRaw = await fetchAllRecords('Leads')
    counts.leads = leadsRaw.length
    _saveToStorage(BACKUP_KEYS.LEADS, leadsRaw)
    onProgress?.(`Leads: ${counts.leads} registros`, 80)
  } catch (err) {
    console.warn('[Backup] Tabla Leads no disponible o con error:', err)
    counts.leads = 0
    _saveToStorage(BACKUP_KEYS.LEADS, [])
    onProgress?.('Leads: error (continuando...)', 80)
  }

  // 4 · Usuarios Admins (tabla recién creada — puede estar vacía)
  onProgress?.('Descargando administradores...', 83)
  try {
    const adminsRaw = await fetchAllRecords('Usuarios_Admins')
    counts.usuariosAdmins = adminsRaw.length
    _saveToStorage(BACKUP_KEYS.USUARIOS_ADMINS, adminsRaw)
    onProgress?.(`Admins: ${counts.usuariosAdmins} registros`, 96)
  } catch (err) {
    console.warn('[Backup] Tabla Usuarios_Admins no disponible (puede estar vacía):', err)
    counts.usuariosAdmins = 0
    _saveToStorage(BACKUP_KEYS.USUARIOS_ADMINS, [])
  }

  // 5 · Guardar metadata local
  const metadata: BackupMetadata = {
    lastBackup: new Date().toISOString(),
    version: BACKUP_VERSION,
    counts,
  }
  _saveToStorage(BACKUP_KEYS.METADATA, metadata)
  onProgress?.('Sincronizando con Firebase...', 97)

  // 6 · Sincronizar servicios a Firebase en la nube (no bloquea si falla)
  try {
    await fbSaveAirtableCache(serviciosRaw, {
      lastBackup: metadata.lastBackup,
      counts: { ...counts },
    })
    localStorage.setItem('guiasai_backup_fb_synced_at', new Date().toISOString())
    onProgress?.('¡Backup y sincronización completados!', 100)
  } catch (fbErr) {
    console.warn('[Backup] Firebase sync falló (backup local sí guardado):', fbErr)
    onProgress?.('¡Backup local completado! (Firebase no disponible)', 100)
  }

  console.log('✅ [Backup Airtable] Completado:', counts)
  return metadata
}

/**
 * Retorna la metadata del último backup guardado, o null si no existe.
 */
export function getBackupMetadata(): BackupMetadata | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEYS.METADATA)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Retorna el estado del backup local: si existe, si es reciente, y cuántas horas tiene.
 * El estado de Firebase se obtiene por separado con getFirebaseSyncStatus() (async).
 */
export function getBackupStatus(): BackupStatus {
  const metadata = getBackupMetadata()
  // Lee el último sync a Firebase guardado en localStorage (se actualiza tras cada sync)
  const fbSyncedAt = localStorage.getItem('guiasai_backup_fb_synced_at') ?? null
  const fbAvailable = Boolean(
    (import.meta as any).env.VITE_FIREBASE_API_KEY &&
    (import.meta as any).env.VITE_FIREBASE_PROJECT_ID
  )

  if (!metadata) {
    return { hasBackup: false, isFresh: false, ageHours: null, metadata: null, fbSyncedAt, fbAvailable }
  }

  const ageMs = Date.now() - new Date(metadata.lastBackup).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  const isFresh = ageHours < STALE_HOURS

  return { hasBackup: true, isFresh, ageHours: Math.round(ageHours * 10) / 10, metadata, fbSyncedAt, fbAvailable }
}

/**
 * Consulta Firebase para saber cuándo fue el último sync en la nube.
 * Async — usar solo en la pestaña de backup, no en el arranque de la app.
 */
export async function getFirebaseSyncStatus(): Promise<{
  synced: boolean
  fbSyncedAt: string | null
  serviciosCount: number
}> {
  try {
    const meta = await fbGetAirtableCacheMetadata()
    if (!meta) return { synced: false, fbSyncedAt: null, serviciosCount: 0 }
    return {
      synced: true,
      fbSyncedAt: meta.fbSyncedAt,
      serviciosCount: meta.counts?.servicios ?? 0,
    }
  } catch {
    return { synced: false, fbSyncedAt: null, serviciosCount: 0 }
  }
}

// ── Acceso a datos del Backup ─────────────────────────────────────────────────

/** Retorna los registros RAW de ServiciosTuristicos_SAI del último backup. */
export function getBackupServicios(): any[] {
  return _loadFromStorage(BACKUP_KEYS.SERVICIOS)
}

/** Retorna los registros RAW de CotizacionesGG del último backup. */
export function getBackupCotizaciones(): any[] {
  return _loadFromStorage(BACKUP_KEYS.COTIZACIONES)
}

/** Retorna los registros RAW de Leads del último backup. */
export function getBackupLeads(): any[] {
  return _loadFromStorage(BACKUP_KEYS.LEADS)
}

/** Retorna los registros RAW de Usuarios_Admins del último backup. */
export function getBackupUsuariosAdmins(): any[] {
  return _loadFromStorage(BACKUP_KEYS.USUARIOS_ADMINS)
}

// ── Firebase ↔ Local sync ────────────────────────────────────────────────────

/**
 * Restaura el backup de servicios desde Firebase al localStorage local.
 * Útil cuando:
 *   - El admin abre la app en un dispositivo nuevo
 *   - No hay backup local pero sí hay uno en Firebase
 *   - Se quiere sincronizar sin llamar a Airtable
 *
 * Retorna true si se restauró algo, false si Firebase no tenía datos.
 */
export async function syncBackupFromFirebase(): Promise<boolean> {
  try {
    const cache = await fbLoadAirtableCache()
    if (!cache || cache.servicios.length === 0) return false

    // Guardar en localStorage
    _saveToStorage(BACKUP_KEYS.SERVICIOS, cache.servicios)

    // Actualizar metadata con la fecha del cache de Firebase
    const existingMeta = getBackupMetadata()
    const metadata: BackupMetadata = {
      lastBackup:  cache.savedAt ?? new Date().toISOString(),
      version:     existingMeta?.version ?? BACKUP_VERSION,
      counts: {
        servicios:      cache.count,
        cotizaciones:   existingMeta?.counts.cotizaciones   ?? 0,
        leads:          existingMeta?.counts.leads          ?? 0,
        usuariosAdmins: existingMeta?.counts.usuariosAdmins ?? 0,
      },
    }
    _saveToStorage(BACKUP_KEYS.METADATA, metadata)
    localStorage.setItem('guiasai_backup_fb_synced_at', cache.savedAt ?? new Date().toISOString())

    console.log(`✅ [Backup] ${cache.count} servicios restaurados desde Firebase`)
    return true
  } catch (e) {
    console.warn('[Backup] No se pudo restaurar desde Firebase:', e)
    return false
  }
}

// ── Verificación de conectividad ──────────────────────────────────────────────

/**
 * Verifica si Airtable está accesible actualmente haciendo una petición mínima.
 * Útil para decidir si mostrar datos del backup o datos en vivo.
 */
export async function isAirtableAvailable(): Promise<boolean> {
  if (!AIRTABLE_BASE_ID) return false
  try {
    await axios.get(tableUrl('ServiciosTuristicos_SAI'), {
      headers: getHeaders(),
      params: { maxRecords: 1, fields: ['Servicio'] },
      timeout: 5000,
    })
    return true
  } catch {
    return false
  }
}

// ── Exportar / Importar ───────────────────────────────────────────────────────

/**
 * Exporta el backup completo como archivo JSON descargable.
 * Incluye todos los registros RAW + metadata.
 */
export function exportBackupAsJSON(): void {
  const servicios = getBackupServicios()
  const cotizaciones = getBackupCotizaciones()
  const leads = getBackupLeads()
  const usuariosAdmins = getBackupUsuariosAdmins()
  const metadata = getBackupMetadata()

  const payload = {
    _info: 'GuiaSAI Airtable Backup — No editar manualmente',
    exportedAt: new Date().toISOString(),
    metadata,
    servicios,
    cotizaciones,
    leads,
    usuariosAdmins,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `guiasai-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Importa un backup desde un archivo JSON y lo restaura en localStorage.
 * Permite trabajar sin conexión a Airtable usando datos previos.
 */
export async function importBackupFromJSON(file: File): Promise<BackupMetadata> {
  const text = await file.text()
  const data = JSON.parse(text)

  if (data.servicios)       _saveToStorage(BACKUP_KEYS.SERVICIOS, data.servicios)
  if (data.cotizaciones)    _saveToStorage(BACKUP_KEYS.COTIZACIONES, data.cotizaciones)
  if (data.leads)           _saveToStorage(BACKUP_KEYS.LEADS, data.leads)
  if (data.usuariosAdmins)  _saveToStorage(BACKUP_KEYS.USUARIOS_ADMINS, data.usuariosAdmins)

  const metadata: BackupMetadata = data.metadata ?? {
    lastBackup: new Date().toISOString(),
    version: BACKUP_VERSION,
    counts: {
      servicios:      (data.servicios      ?? []).length,
      cotizaciones:   (data.cotizaciones   ?? []).length,
      leads:          (data.leads          ?? []).length,
      usuariosAdmins: (data.usuariosAdmins ?? []).length,
    },
  }
  _saveToStorage(BACKUP_KEYS.METADATA, metadata)

  console.log('✅ [Backup] Importado desde archivo:', metadata)
  return metadata
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function _saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`[Backup] No se pudo guardar "${key}" en localStorage (¿lleno?):`, e)
    throw new Error(`Error al guardar backup en localStorage: ${e}`)
  }
}

function _loadFromStorage(key: string): any[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
