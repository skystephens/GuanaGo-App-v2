/**
 * GuiaSAI - Local Storage Service
 *
 * Persiste cotizaciones, leads y agencias en localStorage (inmediato)
 * y replica a Firebase Firestore en segundo plano (nube, multi-dispositivo).
 * Funciona 100% offline si Firebase no está configurado.
 */

// Firebase desactivado temporalmente — se reactiva cuando se implemente auth de agencias
const fbSaveCotizacion = async (_: any) => {}
const fbUpdateCotizacion = async (_a: any, _b: any) => {}
const fbSaveLead = async (_: any) => {}
const fbSaveAgencia = async (_: any) => {}
const fbUpdateAgencia = async (_a: any, _b: any) => {}

// ── Keys ──────────────────────────────────────────────────
const COTIZACIONES_KEY = 'guiasai_cotizaciones_local'
const LEADS_KEY        = 'guiasai_leads_local'
const AGENCIAS_KEY     = 'guiasai_agencias_local'

// ── Tipos ─────────────────────────────────────────────────

export interface LocalCotizacion {
  id: string
  createdTime: string
  nombre: string
  email: string
  telefono: string
  precioTotal: number
  adultos: number
  ninos: number
  fechaInicio?: string
  fechaFin?: string
  accommodations: any[]
  tours: any[]
  transports: any[]
  resumen: string
  origen: string
  estado: 'borrador' | 'pendiente' | 'confirmada' | 'cancelada'
  notasInternas?: string
}

export interface LocalLead {
  id: string
  createdTime: string
  email: string
  nombre?: string
  telefono?: string
  origen: string
}

export interface LocalAgencia {
  id: string
  createdTime: string
  nombre: string
  email: string
  telefono?: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  origen: string
}

// ── Cotizaciones ──────────────────────────────────────────

export function saveLocalCotizacion(
  data: Omit<LocalCotizacion, 'id' | 'createdTime'>
): LocalCotizacion {
  const cotizaciones = getLocalCotizaciones()
  const newCot: LocalCotizacion = {
    ...data,
    id: `CQ-${Date.now()}`,
    createdTime: new Date().toISOString(),
    estado: data.estado || 'borrador',
  }
  cotizaciones.unshift(newCot)
  try {
    localStorage.setItem(COTIZACIONES_KEY, JSON.stringify(cotizaciones))
  } catch { /* localStorage lleno */ }

  // Sync a Firestore en segundo plano (no bloquea la UI)
  fbSaveCotizacion(newCot).catch(() => {})

  return newCot
}

export function getLocalCotizaciones(): LocalCotizacion[] {
  try {
    const raw = localStorage.getItem(COTIZACIONES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function updateLocalCotizacion(
  id: string,
  updates: Partial<Omit<LocalCotizacion, 'id' | 'createdTime'>>
): boolean {
  const cotizaciones = getLocalCotizaciones()
  const idx = cotizaciones.findIndex(c => c.id === id)
  if (idx < 0) return false
  cotizaciones[idx] = { ...cotizaciones[idx], ...updates }
  try {
    localStorage.setItem(COTIZACIONES_KEY, JSON.stringify(cotizaciones))
  } catch {
    return false
  }

  // Sync a Firestore
  fbUpdateCotizacion(id, updates).catch(() => {})

  return true
}

export function getLocalCotizacionesByEmail(email: string): LocalCotizacion[] {
  return getLocalCotizaciones().filter(
    c => c.email.toLowerCase() === email.toLowerCase()
  )
}

// ── Leads ─────────────────────────────────────────────────

export function saveLocalLead(
  data: Omit<LocalLead, 'id' | 'createdTime'>
): LocalLead {
  const leads = getLocalLeads()
  const idx = leads.findIndex(l => l.email.toLowerCase() === data.email.toLowerCase())
  const lead: LocalLead = {
    ...data,
    id: idx >= 0 ? leads[idx].id : `LD-${Date.now()}`,
    createdTime: idx >= 0 ? leads[idx].createdTime : new Date().toISOString(),
  }
  if (idx >= 0) {
    leads[idx] = lead
  } else {
    leads.unshift(lead)
  }
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads))
  } catch { /* localStorage lleno */ }

  // Sync a Firestore
  fbSaveLead(lead).catch(() => {})

  return lead
}

export function getLocalLeads(): LocalLead[] {
  try {
    const raw = localStorage.getItem(LEADS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Agencias ──────────────────────────────────────────────

export function saveLocalAgencia(
  data: Omit<LocalAgencia, 'id' | 'createdTime'>
): LocalAgencia {
  const agencias = getLocalAgencias()
  const existing = agencias.find(a => a.email.toLowerCase() === data.email.toLowerCase())
  if (existing) return existing

  const newAgencia: LocalAgencia = {
    ...data,
    id: `AG-${Date.now()}`,
    createdTime: new Date().toISOString(),
  }
  agencias.unshift(newAgencia)
  try {
    localStorage.setItem(AGENCIAS_KEY, JSON.stringify(agencias))
  } catch { /* localStorage lleno */ }

  // Sync a Firestore
  fbSaveAgencia(newAgencia).catch(() => {})

  return newAgencia
}

export function getLocalAgencias(): LocalAgencia[] {
  try {
    const raw = localStorage.getItem(AGENCIAS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function updateLocalAgencia(
  id: string,
  updates: Partial<Omit<LocalAgencia, 'id' | 'createdTime'>>
): boolean {
  const agencias = getLocalAgencias()
  const idx = agencias.findIndex(a => a.id === id)
  if (idx < 0) return false
  agencias[idx] = { ...agencias[idx], ...updates }
  try {
    localStorage.setItem(AGENCIAS_KEY, JSON.stringify(agencias))
  } catch {
    return false
  }

  // Sync a Firestore
  fbUpdateAgencia(id, updates).catch(() => {})

  return true
}

// ── Helper: generar resumen de cotización ─────────────────

export function buildResumen(
  accommodations: any[],
  tours: any[],
  transports: any[]
): string {
  const lines: string[] = []
  accommodations.forEach(a => {
    const checkIn  = a.checkIn  ? new Date(a.checkIn).toLocaleDateString('es-CO')  : '?'
    const checkOut = a.checkOut ? new Date(a.checkOut).toLocaleDateString('es-CO') : '?'
    lines.push(`🏨 ${a.hotelName || a.nombre || '?'} — ${checkIn} → ${checkOut} (${a.nights || 1} noche/s) $${(a.total || a.totalPrice || 0).toLocaleString('es-CO')} COP`)
  })
  tours.forEach(t => {
    const fecha = t.date instanceof Date
      ? t.date.toLocaleDateString('es-CO')
      : (t.date ? new Date(t.date).toLocaleDateString('es-CO') : '?')
    lines.push(`🎫 ${t.tourName || t.nombre || '?'} — ${fecha} x${t.quantity || t.people || 1} pax $${(t.total || 0).toLocaleString('es-CO')} COP`)
  })
  transports.forEach(t => {
    const fecha = t.date instanceof Date
      ? t.date.toLocaleDateString('es-CO')
      : (t.date ? new Date(t.date).toLocaleDateString('es-CO') : '?')
    lines.push(`🚕 ${t.vehicleType || t.nombre || '?'} — ${fecha} $${(t.total || t.totalPrice || 0).toLocaleString('es-CO')} COP`)
  })
  return lines.join('\n')
}
