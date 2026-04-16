import { useEffect, useState, useMemo } from 'react'
import { AdminCotizacionBuilder } from '../components/AdminCotizacionBuilder'
import { useNavigate } from 'react-router-dom'
import { useQuotationStore } from '../stores/quotationStore'
import { NavigationBar } from '../components/NavigationBar'
import { forceRefreshData } from '../services/airtableService'
import {
  getLocalCotizaciones, getLocalLeads, getLocalAgencias,
  updateLocalCotizacion, getLocalCotizacionesByEmail,
  saveLocalLead, saveLocalAgencia,
} from '../services/localStorageService'
import type { LocalCotizacion } from '../services/localStorageService'
import { getAllServicesForAdmin } from '../services/tariffService'
import { saveOverride, getPaquetes, createPaquete, updatePaquete, deletePaquete, saveLocalImageOverride, getLocalImageOverrides, exportImageOverridesAsJSON } from '../services/serviceOverrides'
import type { Paquete } from '../services/serviceOverrides'
import { getTaxiTariffs, saveTaxiTariffs } from '../constants/taxiZones'
import type { TaxiZone } from '../constants/taxiZones'
import {
  createAirtableBackup,
  exportBackupAsJSON,
  importBackupFromJSON,
  getBackupStatus,
  getFirebaseSyncStatus,
  syncBackupFromFirebase,
} from '../services/airtableBackupService'
import type { BackupStatus } from '../services/airtableBackupService'
import '../styles/guiasai-theme.css'

// =========================================================
// TIPOS
// =========================================================

type MainTab = 'dashboard' | 'quotes' | 'nueva-cotizacion' | 'leads' | 'services' | 'backup'
type ServicesSubTab = 'catalog' | 'packages' | 'tariffs'
type VisibilityFilter = 'all' | 'published' | 'hidden'

const TYPE_COLORS: Record<string, string> = {
  Tour: '#10b981',
  Alojamiento: '#3b82f6',
  'Alquiler Vehiculo': '#f59e0b',
  Evento: '#8b5cf6',
  Paquete: '#FF6600',
  Transporte: '#64748b',
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

export const SuperAdminPanel = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isSuperAdmin, logout, mockQuotation } = useQuotationStore()

  // Tabs principales
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard')

  // Datos pestañas existentes
  const [stats, setStats] = useState({ quotes: 0, agencies: 0, leads: 0 })
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // --- Servicios ---
  const [servicesSubTab, setServicesSubTab] = useState<ServicesSubTab>('catalog')
  const [allServices, setAllServices] = useState<any[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [editingService, setEditingService] = useState<any | null>(null)
  const [editCategoria, setEditCategoria] = useState('')
  const [editTipo, setEditTipo] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [editNewImageUrl, setEditNewImageUrl] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // --- Paquetes / Servicios admin ---
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [paquetesLoading, setPaquetesLoading] = useState(false)
  const [showPaqueteForm, setShowPaqueteForm] = useState(false)
  const [editingPaquete, setEditingPaquete] = useState<Paquete | null>(null)
  const [paqueteForm, setPaqueteForm] = useState({
    nombre: '',
    descripcion: '',
    tipoServicio: 'Paquete',
    precioTotal: 0,
    publicado: true,
    imagenurl: '',
    selectedIds: [] as string[],
  })

  // --- Modal Detalle Cotización ---
  const [selectedCotizacion, setSelectedCotizacion] = useState<LocalCotizacion | null>(null)
  const [editEstado, setEditEstado] = useState<string>('borrador')
  const [editNotas, setEditNotas] = useState<string>('')
  const [relatedQuotes, setRelatedQuotes] = useState<LocalCotizacion[]>([])
  const [detailMsg, setDetailMsg] = useState('')

  // --- Backup Airtable ---
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(() => getBackupStatus())
  const [backupRunning, setBackupRunning] = useState(false)
  const [backupProgress, setBackupProgress] = useState({ step: '', pct: 0 })
  const [backupMsg, setBackupMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [fbSyncStatus, setFbSyncStatus] = useState<{ loading: boolean; synced: boolean; fbSyncedAt: string | null; serviciosCount: number }>({ loading: true, synced: false, fbSyncedAt: null, serviciosCount: 0 })
  const [fbRestoring, setFbRestoring] = useState(false)

  // --- Tarifas de Transporte ---
  const [taxiZones, setTaxiZones] = useState<TaxiZone[]>(() => getTaxiTariffs())
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [tariffDraft, setTariffDraft] = useState<Record<string, { priceSmall: number; priceLarge: number }>>({})
  const [tariffSaved, setTariffSaved] = useState(false)

  // Protección de ruta
  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin) navigate('/')
  }, [isAuthenticated, isSuperAdmin, navigate])

  // Cargar datos según pestaña activa
  useEffect(() => {
    if (activeTab === 'services') {
      loadAllServices()
      return
    }
    const loadData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'dashboard') {
          const q = getLocalCotizaciones()
          const a = getLocalAgencias()
          const l = getLocalLeads()
          setStats({ quotes: q.length, agencies: a.length, leads: l.length })
        } else if (activeTab === 'quotes') {
          // Solo local — incluir objeto completo para el modal de detalle
          const local = getLocalCotizaciones().map(lq => ({
            ...lq,
            _source: 'local',
            _original: lq,
          }))
          setData(local)
        } else if (activeTab === 'nueva-cotizacion') {
          setData([])
        } else if (false) {
          const local = getLocalAgencias().map(ag => ({
            id: ag.id,
            createdTime: ag.createdTime,
            Nombre: ag.nombre,
            Email: ag.email,
            Telefono: ag.telefono || '',
            Approved: ag.estado === 'aprobada',
            Estado: ag.estado,
            Origen: ag.origen,
            _source: 'local',
            _original: ag,
          }))
          setData(local)
        } else if (activeTab === 'leads') {
          const local = getLocalLeads().map(ll => ({
            id: ll.id,
            createdTime: ll.createdTime,
            Email: ll.email,
            Nombre: ll.nombre || '',
            Telefono: ll.telefono || '',
            Origen: ll.origen,
            Fecha: new Date(ll.createdTime).toLocaleDateString('es-CO'),
            Estado: 'Nuevo',
            _source: 'local',
          }))
          setData(local)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [activeTab])

  // Cargar paquetes cuando se muestra el sub-tab
  useEffect(() => {
    if (activeTab === 'services' && servicesSubTab === 'packages') {
      loadPaquetes()
    }
  }, [activeTab, servicesSubTab])

  const loadAllServices = async () => {
    setServicesLoading(true)
    try {
      const [raw, adminPaquetes] = await Promise.all([getAllServicesForAdmin(), getPaquetes()])
      const all = [
        ...raw.tours.map(s => ({ ...s, _tipoServicio: 'Tour', _source: 'json' })),
        ...raw.accommodations.map(s => ({ ...s, _tipoServicio: 'Alojamiento', _source: 'json' })),
        ...raw.vehicles.map(s => ({ ...s, _tipoServicio: 'Alquiler Vehiculo', _source: 'json' })),
        ...raw.eventos.map(s => ({ ...s, _tipoServicio: 'Evento', _source: 'json' })),
        ...raw.transports.map(s => ({ ...s, _tipoServicio: 'Transporte', _source: 'json' })),
        ...adminPaquetes.map(p => ({
          id: p.airtableId || `admin-${p.nombre}`,
          nombre: p.nombre,
          descripcion: p.descripcion,
          categoria: p.tipoServicio,
          publicado: p.publicado,
          precioBase: p.precioTotal,
          imageUrl: p.imagenurl || '',
          _tipoServicio: p.tipoServicio || 'Paquete',
          _source: 'admin',
          _paquete: p,
        })),
      ]
      setAllServices(all)
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setServicesLoading(false)
    }
  }

  const loadPaquetes = async () => {
    setPaquetesLoading(true)
    try {
      setPaquetes(await getPaquetes())
    } catch (error) {
      console.error('Error cargando paquetes:', error)
    } finally {
      setPaquetesLoading(false)
    }
  }

  // Filtrado de servicios
  const filteredServices = useMemo(() => {
    return allServices.filter(s => {
      const matchSearch = !searchTerm || s.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchType = typeFilter === 'all' || s._tipoServicio === typeFilter
      const isPublished = s.publicado !== false
      const matchVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'published' && isPublished) ||
        (visibilityFilter === 'hidden' && !isPublished)
      return matchSearch && matchType && matchVisibility
    })
  }, [allServices, searchTerm, typeFilter, visibilityFilter])

  // Stats de servicios
  const serviceStats = useMemo(() => {
    const total = allServices.length
    const published = allServices.filter(s => s.publicado !== false).length
    const byType: Record<string, number> = {}
    allServices.forEach(s => {
      byType[s._tipoServicio] = (byType[s._tipoServicio] || 0) + 1
    })
    return { total, published, hidden: total - published, byType }
  }, [allServices])

  // Cargar estado de Firebase cuando se abre la pestaña backup
  useEffect(() => {
    if (activeTab !== 'backup') return
    setFbSyncStatus(s => ({ ...s, loading: true }))
    getFirebaseSyncStatus().then(res => {
      setFbSyncStatus({ loading: false, synced: res.synced, fbSyncedAt: res.fbSyncedAt, serviciosCount: res.serviciosCount })
    })
  }, [activeTab])

  // ── Handlers Backup ───────────────────────────────────────────────────────
  const handleRunBackup = async () => {
    setBackupRunning(true)
    setBackupMsg(null)
    setBackupProgress({ step: 'Iniciando backup...', pct: 0 })
    try {
      await createAirtableBackup((step, pct) => {
        setBackupProgress({ step, pct })
      })
      setBackupStatus(getBackupStatus())
      // Refrescar estado de Firebase tras el backup
      getFirebaseSyncStatus().then(res => {
        setFbSyncStatus({ loading: false, synced: res.synced, fbSyncedAt: res.fbSyncedAt, serviciosCount: res.serviciosCount })
      })
      setBackupMsg({ text: '✅ Backup completado y sincronizado con Firebase', ok: true })
    } catch (err: any) {
      setBackupMsg({ text: `❌ Error: ${err?.message || 'No se pudo conectar con Airtable'}`, ok: false })
    } finally {
      setBackupRunning(false)
      setBackupProgress({ step: '', pct: 0 })
    }
  }

  const handleRestoreFromFirebase = async () => {
    setFbRestoring(true)
    setBackupMsg(null)
    try {
      const restored = await syncBackupFromFirebase()
      if (restored) {
        setBackupStatus(getBackupStatus())
        setBackupMsg({ text: '✅ Datos restaurados desde Firebase correctamente', ok: true })
      } else {
        setBackupMsg({ text: '⚠️ Firebase no tiene datos de servicios guardados aún. Haz un backup primero.', ok: false })
      }
    } catch {
      setBackupMsg({ text: '❌ Error al conectar con Firebase', ok: false })
    } finally {
      setFbRestoring(false)
      setTimeout(() => setBackupMsg(null), 5000)
    }
  }

  const handleExportBackup = () => {
    try {
      exportBackupAsJSON()
      setBackupMsg({ text: '✅ Archivo de backup descargado', ok: true })
    } catch {
      setBackupMsg({ text: '❌ No hay backup para exportar. Haz un backup primero.', ok: false })
    }
    setTimeout(() => setBackupMsg(null), 3000)
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackupFromJSON(file)
      setBackupStatus(getBackupStatus())
      setBackupMsg({ text: '✅ Backup importado correctamente', ok: true })
    } catch {
      setBackupMsg({ text: '❌ Error al leer el archivo. ¿Es un backup válido de GuiaSAI?', ok: false })
    }
    e.target.value = ''
    setTimeout(() => setBackupMsg(null), 4000)
  }

  // Handlers
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleForceUpdate = async () => {
    if (confirm('¿Actualizar caché de servicios globalmente?')) {
      await forceRefreshData()
      alert('Servicios actualizados')
    }
  }

  const handleTogglePublicado = async (service: any) => {
    const newPublicado = service.publicado === false ? true : false
    setSavingId(service.id)
    // Actualizar UI inmediatamente
    setAllServices(prev =>
      prev.map(s => s.id === service.id ? { ...s, publicado: newPublicado } : s)
    )
    await saveOverride(service.id, service.nombre, { publicado: newPublicado })
    setSavingId(null)
  }

  const handleOpenEdit = (service: any) => {
    setEditingService(service)
    setEditCategoria(service.categoria || '')
    setEditTipo(service._tipoServicio || '')
    setEditNewImageUrl('')
    // Cargar imágenes: primero override local, luego las del servicio
    const localImgs = getLocalImageOverrides()
    setEditImages(localImgs[service.id] ?? service.images ?? [])
  }

  const handleAddImageUrl = () => {
    const url = editNewImageUrl.trim()
    if (!url || !url.startsWith('http')) return
    if (editImages.includes(url)) return
    setEditImages(prev => [...prev, url])
    setEditNewImageUrl('')
  }

  const handleRemoveImage = (idx: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveServiceEdit = async () => {
    if (!editingService) return
    setSavingId(editingService.id)
    saveLocalImageOverride(editingService.id, editImages)
    setAllServices(prev =>
      prev.map(s => s.id === editingService.id
        ? { ...s, categoria: editCategoria, _tipoServicio: editTipo, images: editImages, imageUrl: editImages[0] || s.imageUrl }
        : s
      )
    )
    await saveOverride(editingService.id, editingService.nombre, { categoria: editCategoria, tipoServicio: editTipo })
    setEditingService(null)
    setSavingId(null)
  }

  const handleExportImageOverrides = () => {
    const json = exportImageOverridesAsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'image-overrides.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handlers paquetes
  const openNewPaquete = () => {
    setEditingPaquete(null)
    setPaqueteForm({ nombre: '', descripcion: '', tipoServicio: 'Paquete', precioTotal: 0, publicado: true, imagenurl: '', selectedIds: [] })
    setShowPaqueteForm(true)
  }

  const openEditPaquete = (p: Paquete) => {
    setEditingPaquete(p)
    setPaqueteForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      tipoServicio: p.tipoServicio || 'Paquete',
      precioTotal: p.precioTotal,
      publicado: p.publicado,
      imagenurl: p.imagenurl || '',
      selectedIds: p.serviceIds,
    })
    setShowPaqueteForm(true)
  }

  const handleSavePaquete = async () => {
    const selectedServices = allServices.filter(s => paqueteForm.selectedIds.includes(s.id))
    const serviceNames = selectedServices.map(s => s.nombre)
    const autoPrice = selectedServices.reduce((sum, s) => sum + (s.precioBase || s.precioPerPerson || 0), 0)

    const payload = {
      nombre: paqueteForm.nombre,
      descripcion: paqueteForm.descripcion,
      tipoServicio: paqueteForm.tipoServicio,
      serviceIds: paqueteForm.selectedIds,
      serviceNames,
      precioTotal: paqueteForm.precioTotal || autoPrice,
      publicado: paqueteForm.publicado,
      imagenurl: paqueteForm.imagenurl,
    }

    if (editingPaquete?.airtableId) {
      await updatePaquete(editingPaquete.airtableId, payload)
    } else {
      await createPaquete(payload)
    }
    setShowPaqueteForm(false)
    await loadPaquetes()
    await loadAllServices() // refrescar catálogo para ver el nuevo servicio
  }

  const handleDeletePaquete = async (p: Paquete) => {
    if (!p.airtableId) return
    if (confirm(`¿Eliminar el paquete "${p.nombre}"?`)) {
      await deletePaquete(p.airtableId)
      await loadPaquetes()
    }
  }

  const toggleServiceInPaquete = (id: string) => {
    setPaqueteForm(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(x => x !== id)
        : [...prev.selectedIds, id],
    }))
  }

  // Handlers tarifas
  const handleStartEditZone = (zone: TaxiZone) => {
    setEditingZone(zone.id)
    setTariffDraft(prev => ({
      ...prev,
      [zone.id]: { priceSmall: zone.priceSmall, priceLarge: zone.priceLarge },
    }))
    setTariffSaved(false)
  }

  const handleSaveTariffs = () => {
    const updated = taxiZones.map(z =>
      tariffDraft[z.id]
        ? { ...z, priceSmall: tariffDraft[z.id].priceSmall, priceLarge: tariffDraft[z.id].priceLarge }
        : z
    )
    setTaxiZones(updated)
    saveTaxiTariffs(updated)
    setEditingZone(null)
    setTariffSaved(true)
    setTimeout(() => setTariffSaved(false), 3000)
  }

  const handleCancelEditZone = () => {
    setEditingZone(null)
  }

  // ── Handlers Modal Detalle Cotización ─────────────────────────
  const handleOpenDetail = (cot: LocalCotizacion) => {
    setSelectedCotizacion(cot)
    setEditEstado(cot.estado || 'borrador')
    setEditNotas(cot.notasInternas || '')
    setRelatedQuotes(getLocalCotizacionesByEmail(cot.email))
    setDetailMsg('')
  }

  const handleSaveDetail = () => {
    if (!selectedCotizacion) return
    updateLocalCotizacion(selectedCotizacion.id, {
      estado: editEstado as LocalCotizacion['estado'],
      notasInternas: editNotas,
    })
    const updated = { ...selectedCotizacion, estado: editEstado as LocalCotizacion['estado'], notasInternas: editNotas }
    setSelectedCotizacion(updated)
    setData(prev => prev.map((d: any) =>
      d.id === selectedCotizacion.id ? { ...d, estado: editEstado, notasInternas: editNotas, _original: updated } : d
    ))
    setRelatedQuotes(prev => prev.map(q => q.id === selectedCotizacion.id ? updated : q))
    setDetailMsg('✅ Cambios guardados')
    setTimeout(() => setDetailMsg(''), 2500)
  }

  const handleRegisterAsLead = () => {
    if (!selectedCotizacion) return
    saveLocalLead({
      email: selectedCotizacion.email,
      nombre: selectedCotizacion.nombre,
      telefono: selectedCotizacion.telefono,
      origen: `Cotización ${selectedCotizacion.id}`,
    })
    setDetailMsg('✅ Registrado en Leads CRM')
    setTimeout(() => setDetailMsg(''), 2500)
  }

  const handleRegisterAsAgency = () => {
    if (!selectedCotizacion) return
    saveLocalAgencia({
      nombre: selectedCotizacion.nombre,
      email: selectedCotizacion.email,
      telefono: selectedCotizacion.telefono,
      estado: 'pendiente',
      origen: `Cotización ${selectedCotizacion.id}`,
    })
    setDetailMsg('✅ Registrado como Agencia (pendiente)')
    setTimeout(() => setDetailMsg(''), 2500)
  }

  const fmtDate = (val: any): string => {
    if (!val) return '?'
    try {
      // Airtable date fields return "YYYY-MM-DD" (no time). Parsing them as UTC
      // midnight shifts the date back one day in UTC-5 timezone. Adding T12:00:00
      // forces local-noon interpretation so the date displays correctly.
      const s = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val + 'T12:00:00' : val
      return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return String(val) }
  }

  const fmtPrice = (val: any): string =>
    `$${Number(val || 0).toLocaleString('es-CO')} COP`

  const estadoColor: Record<string, string> = {
    borrador: '#94a3b8',
    pendiente: '#f59e0b',
    confirmada: '#10b981',
    cancelada: '#ef4444',
  }

  if (!isAuthenticated || !isSuperAdmin) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', paddingBottom: '4rem' }}>
      <NavigationBar
        activeSectionId="admin"
        userInitials="SA"
        userName="Super Admin"
        onProfileClick={() => {}}
        onLogout={handleLogout}
        isAuthenticated={true}
        quotationCount={mockQuotation.accommodations.length + mockQuotation.tours.length}
        onQuotationClick={() => navigate('/')}
        panelLabel="Admin Panel"
      />

      <div className="container" style={{ marginTop: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0 }}>Panel de Control Global</h1>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '0.4rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#FF6600',
                fontSize: '0.88rem',
                fontWeight: 600,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ← Volver al Inicio
            </button>
          </div>
          <button onClick={handleForceUpdate} className="btn" style={{ width: 'auto', backgroundColor: '#333' }}>
            🔄 Actualizar Servicios
          </button>
        </div>

        {/* Tabs de Navegación */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '📊 Resumen' },
            { id: 'quotes', label: '📝 Cotizaciones' },
            { id: 'nueva-cotizacion', label: '✏️ Nueva Cotización' },
            { id: 'leads', label: '👥 Leads CRM' },
            { id: 'services', label: '🗂️ Servicios' },
            { id: 'backup', label: backupStatus.hasBackup && !backupStatus.isFresh ? '⚠️ Backup' : '💾 Backup' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainTab)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#FF6600' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => navigate('/vouchers')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              border: '2px solid #2FA9B8',
              backgroundColor: 'transparent',
              color: '#2FA9B8',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🎫 Vouchers
          </button>
        </div>

        {/* Contenido */}
        {loading && activeTab !== 'services' ? (
          <div className="spinner" style={{ margin: '3rem auto' }}></div>
        ) : (
          <>
            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <h3 style={{ fontSize: '3rem', color: '#FF6600', margin: 0 }}>{stats.quotes}</h3>
                  <p style={{ color: '#64748b' }}>Cotizaciones Totales</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <h3 style={{ fontSize: '3rem', color: '#10b981', margin: 0 }}>{stats.agencies}</h3>
                  <p style={{ color: '#64748b' }}>Agencias Registradas</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <h3 style={{ fontSize: '3rem', color: '#3b82f6', margin: 0 }}>{stats.leads}</h3>
                  <p style={{ color: '#64748b' }}>Leads Potenciales</p>
                </div>
              </div>
            )}

            {/* ── COTIZACIONES ── */}
            {activeTab === 'quotes' && (
              <div className="card" style={{ overflowX: 'auto' }}>
                {data.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p>No hay cotizaciones guardadas aún.</p>
                    <p style={{ fontSize: '0.85rem' }}>Las cotizaciones creadas desde el panel de agencia aparecerán aquí.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '1rem' }}>Fecha</th>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>Cliente</th>
                        <th style={{ padding: '1rem' }}>Email</th>
                        <th style={{ padding: '1rem' }}>Total</th>
                        <th style={{ padding: '1rem' }}>Estado</th>
                        <th style={{ padding: '1rem' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row: any) => {
                        const cot: LocalCotizacion = row._original || row
                        const estado = cot.estado || 'borrador'
                        const serviceCount = (cot.accommodations?.length || 0) + (cot.tours?.length || 0) + (cot.transports?.length || 0)
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.875rem' }}>
                              {new Date(row.createdTime).toLocaleDateString('es-CO')}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {row.id}
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                              {cot.nombre}
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>
                                {serviceCount > 0 ? `${serviceCount} servicio(s)` : 'Sin servicios'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{cot.email}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              ${(cot.precioTotal || 0).toLocaleString('es-CO')}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.7rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: `${estadoColor[estado]}20`,
                                color: estadoColor[estado],
                                textTransform: 'capitalize',
                              }}>
                                {estado}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button
                                className="btn-small"
                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', backgroundColor: '#FF6600', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => handleOpenDetail(cot)}
                              >
                                👁️ Ver / Editar
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── NUEVA COTIZACIÓN ── */}
            {activeTab === 'nueva-cotizacion' && (
              <AdminCotizacionBuilder />
            )}

            {/* ── LEADS ── */}
            {activeTab === 'leads' && (
              <div className="card">
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {data.map((lead: any) => (
                    <li key={lead.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: lead._source === 'local' ? '#fffbf5' : 'white' }}>
                      <div>
                        <strong>{lead['Nombre'] || lead.nombre || lead['Email']}</strong>
                        {lead['Nombre'] && <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>{lead['Email']}</span>}
                        {lead['Telefono'] && <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.85rem' }}>• {lead['Telefono']}</span>}
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                          {lead['Origen']} • {lead['Fecha'] || new Date(lead.createdTime || 0).toLocaleDateString('es-CO')}
                          {lead._source === 'local' && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', backgroundColor: '#fff3e0', color: '#e65c00', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>
                              📱 Local
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${lead._source === 'local' ? 'badge-warning' : 'badge-primary'}`}>{lead['Estado'] || 'Nuevo'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── SERVICIOS ── */}
            {activeTab === 'services' && (
              <div>
                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {[
                    { id: 'catalog', label: '📋 Catálogo JSON' },
                    { id: 'packages', label: '📦 Paquetes Turísticos' },
                    { id: 'tariffs', label: '🚕 Tarifas Transporte' },
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => setServicesSubTab(st.id as ServicesSubTab)}
                      style={{
                        padding: '0.4rem 1.2rem',
                        borderRadius: '16px',
                        border: `2px solid ${servicesSubTab === st.id ? '#FF6600' : '#e2e8f0'}`,
                        backgroundColor: servicesSubTab === st.id ? '#fff5f0' : 'white',
                        color: servicesSubTab === st.id ? '#FF6600' : '#64748b',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* ── CATÁLOGO JSON ── */}
                {servicesSubTab === 'catalog' && (
                  <>
                    {/* Stats */}
                    {!servicesLoading && (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {[
                          { label: 'Total', value: serviceStats.total, color: '#1e293b' },
                          { label: 'Publicados', value: serviceStats.published, color: '#10b981' },
                          { label: 'Ocultos', value: serviceStats.hidden, color: '#ef4444' },
                        ].map(s => (
                          <div key={s.label} className="card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '110px' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
                          </div>
                        ))}
                        {Object.entries(serviceStats.byType).map(([tipo, count]) => (
                          <div key={tipo} className="card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '110px' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: TYPE_COLORS[tipo] || '#64748b' }}>{count as number}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tipo}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Exportar fotos */}
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#92400e', flex: 1, minWidth: '260px' }}>
                        <strong>📸 ¿Cómo hacer que las fotos persistan en todos los dispositivos?</strong>
                        <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                          <li>Agrega URLs de imágenes a cada servicio con el botón ✏️ Editar</li>
                          <li>Haz clic en <strong>⬇️ Exportar fotos</strong> → descarga <code>image-overrides.json</code></li>
                          <li>Coloca ese archivo en la carpeta <code>/public/</code> del proyecto y reconstruye con <code>npm run build</code></li>
                          <li><strong>Atajo sin reconstruir:</strong> sube el archivo <code>image-overrides.json</code> directamente a la carpeta raíz de <code>/dist/</code> en el servidor (junto a <code>index.html</code>)</li>
                        </ol>
                      </div>
                      <button
                        onClick={handleExportImageOverrides}
                        title="Descarga image-overrides.json — colócalo en /public/ antes del build o en /dist/ en el servidor"
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #FF6600', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem', color: '#FF6600', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
                      >
                        ⬇️ Exportar fotos
                      </button>
                    </div>

                    {/* Controles de filtro */}
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="🔍 Buscar por nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: '1', minWidth: '200px' }}
                      />
                      <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                      >
                        <option value="all">Todos los tipos</option>
                        <option value="Tour">Tour</option>
                        <option value="Alojamiento">Alojamiento</option>
                        <option value="Alquiler Vehiculo">Alquiler Vehículo</option>
                        <option value="Evento">Evento</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Paquete">Paquete</option>
                      </select>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {(['all', 'published', 'hidden'] as VisibilityFilter[]).map(v => (
                          <button
                            key={v}
                            onClick={() => setVisibilityFilter(v)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '12px',
                              border: 'none',
                              backgroundColor: visibilityFilter === v ? '#FF6600' : '#f1f5f9',
                              color: visibilityFilter === v ? 'white' : '#64748b',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: visibilityFilter === v ? 'bold' : 'normal',
                            }}
                          >
                            {v === 'all' ? 'Todos' : v === 'published' ? '✅ Publicados' : '🚫 Ocultos'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tabla de servicios */}
                    {servicesLoading ? (
                      <div className="spinner" style={{ margin: '3rem auto' }}></div>
                    ) : (
                      <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                              <th style={{ padding: '0.75rem 1rem' }}>Imagen</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Nombre</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Categoría</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Precio</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Visible</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredServices.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                  No se encontraron servicios con los filtros seleccionados
                                </td>
                              </tr>
                            ) : filteredServices.map(service => {
                              const isPublished = service.publicado !== false
                              const isSaving = savingId === service.id
                              const precio = service.precioBase || service.precioActualizado || service.precioPerPerson || service.precioPerVehicle || 0
                              return (
                                <tr
                                  key={service.id}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    opacity: isPublished ? 1 : 0.55,
                                    transition: 'opacity 0.2s',
                                  }}
                                >
                                  {/* Imagen */}
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    {service.imageUrl ? (
                                      <img
                                        src={service.imageUrl}
                                        alt={service.nombre}
                                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                      />
                                    ) : (
                                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        {service._tipoServicio === 'Tour' ? '🎫' : service._tipoServicio === 'Alojamiento' ? '🏨' : service._tipoServicio === 'Alquiler Vehiculo' ? '🚗' : service._tipoServicio === 'Evento' ? '🎉' : '🚕'}
                                      </div>
                                    )}
                                  </td>
                                  {/* Nombre */}
                                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', maxWidth: '220px' }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.nombre}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {service.id}</div>
                                  </td>
                                  {/* Tipo */}
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      backgroundColor: `${TYPE_COLORS[service._tipoServicio] || '#64748b'}20`,
                                      color: TYPE_COLORS[service._tipoServicio] || '#64748b',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {service._tipoServicio}
                                    </span>
                                  </td>
                                  {/* Categoría */}
                                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.875rem', maxWidth: '150px' }}>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                      {service.categoria || '—'}
                                    </span>
                                  </td>
                                  {/* Precio */}
                                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                    {precio > 0 ? `$${precio.toLocaleString('es-CO')}` : '—'}
                                  </td>
                                  {/* Toggle visible */}
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleTogglePublicado(service)}
                                      disabled={isSaving}
                                      title={isPublished ? 'Ocultar servicio' : 'Publicar servicio'}
                                      style={{
                                        width: '44px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: isPublished ? '#10b981' : '#cbd5e1',
                                        cursor: isSaving ? 'wait' : 'pointer',
                                        position: 'relative',
                                        transition: 'background-color 0.2s',
                                        opacity: isSaving ? 0.6 : 1,
                                      }}
                                    >
                                      <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: isPublished ? '22px' : '2px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                      }} />
                                    </button>
                                  </td>
                                  {/* Acciones */}
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleOpenEdit(service)}
                                      title="Editar tipo y categoría"
                                      style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      ✏️ Editar
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                          Mostrando {filteredServices.length} de {allServices.length} servicios
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── PAQUETES TURÍSTICOS ── */}
                {servicesSubTab === 'packages' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#1e293b' }}>Servicios Creados por Admin</h3>
                      <button
                        onClick={openNewPaquete}
                        style={{
                          padding: '0.5rem 1.2rem',
                          borderRadius: '20px',
                          border: 'none',
                          backgroundColor: '#FF6600',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        + Crear Servicio
                      </button>
                    </div>

                    {paquetesLoading ? (
                      <div className="spinner" style={{ margin: '3rem auto' }}></div>
                    ) : paquetes.length === 0 ? (
                      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        <p>No hay servicios creados aún. Crea tours, alojamientos, paquetes u otros.</p>
                        <button
                          onClick={openNewPaquete}
                          style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', backgroundColor: '#FF6600', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Crear primer servicio
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {paquetes.map((p, i) => (
                          <div key={p.airtableId || i} className="card" style={{ padding: '1.25rem', opacity: p.publicado ? 1 : 0.6 }}>
                            {p.imagenurl && (
                              <img src={p.imagenurl} alt={p.nombre} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }} />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ margin: 0, color: '#1e293b' }}>{p.nombre}</h4>
                              <span style={{ fontWeight: 'bold', color: '#FF6600', whiteSpace: 'nowrap' }}>
                                ${p.precioTotal.toLocaleString('es-CO')}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>{p.descripcion}</p>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                              {p.serviceIds.length} servicio(s) incluido(s) •{' '}
                              <span style={{ color: p.publicado ? '#10b981' : '#ef4444' }}>
                                {p.publicado ? '✅ Publicado' : '🚫 Oculto'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => openEditPaquete(p)}
                                style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleDeletePaquete(p)}
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
                {/* ── TARIFAS TRANSPORTE ── */}
                {servicesSubTab === 'tariffs' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>Tarifas de Taxi por Zona</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                          Modifica las tarifas de cada zona. Los cambios se aplican de inmediato y se guardan en el dispositivo.
                        </p>
                      </div>
                      {tariffSaved && (
                        <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          ✅ Tarifas guardadas
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {taxiZones.map(zone => {
                        const isEditing = editingZone === zone.id
                        const draft = tariffDraft[zone.id] || { priceSmall: zone.priceSmall, priceLarge: zone.priceLarge }
                        return (
                          <div key={zone.id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${zone.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{zone.name}</div>
                                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{zone.sectors}</div>
                              </div>

                              {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                      🚗 Tarifa 1–4 pax (COP)
                                    </label>
                                    <input
                                      type="number"
                                      value={draft.priceSmall}
                                      min={0}
                                      step={1000}
                                      onChange={e => setTariffDraft(prev => ({
                                        ...prev,
                                        [zone.id]: { ...draft, priceSmall: Number(e.target.value) },
                                      }))}
                                      style={{ width: '140px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid #FF6600', fontSize: '0.95rem', fontWeight: 600 }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                      🚐 Tarifa 5+ pax (COP)
                                    </label>
                                    <input
                                      type="number"
                                      value={draft.priceLarge}
                                      min={0}
                                      step={1000}
                                      onChange={e => setTariffDraft(prev => ({
                                        ...prev,
                                        [zone.id]: { ...draft, priceLarge: Number(e.target.value) },
                                      }))}
                                      style={{ width: '140px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid #3b82f6', fontSize: '0.95rem', fontWeight: 600 }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                                    <button
                                      onClick={handleSaveTariffs}
                                      style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: '#FF6600', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={handleCancelEditZone}
                                      style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>🚗 1–4 pax</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>
                                      ${zone.priceSmall.toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>🚐 5+ pax</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>
                                      ${zone.priceLarge.toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleStartEditZone(zone)}
                                    style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}
                                  >
                                    ✏️ Editar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                      💡 Las tarifas modificadas se guardan localmente en este dispositivo. Si usas varios dispositivos, edita las tarifas en cada uno.
                    </p>
                  </>
                )}
          </>
        )}

        {/* ── BACKUP AIRTABLE ── */}
        {activeTab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Encabezado */}
            <div>
              <h2 style={{ margin: '0 0 0.4rem', color: '#1e293b', fontSize: '1.4rem' }}>
                💾 Backup de Airtable
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Descarga y guarda localmente toda la información de Airtable (servicios, precios, imágenes, cotizaciones, leads y admins).
                La app usará este backup si Airtable no está disponible.
              </p>
            </div>

            {/* Estado del backup */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.2rem', color: '#1e293b', fontSize: '1.05rem' }}>
                Estado del Backup Local
              </h3>
              {backupStatus.hasBackup && backupStatus.metadata ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {/* Fecha */}
                  <div style={{ padding: '1rem', backgroundColor: backupStatus.isFresh ? '#f0fdf4' : '#fff7ed', borderRadius: '10px', border: `1px solid ${backupStatus.isFresh ? '#bbf7d0' : '#fed7aa'}` }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Último backup</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                      {new Date(backupStatus.metadata.lastBackup).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {new Date(backupStatus.metadata.lastBackup).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: backupStatus.isFresh ? '#16a34a' : '#ea580c' }}>
                      {backupStatus.isFresh ? '✅ Actualizado' : `⚠️ Hace ${backupStatus.ageHours}h — Actualizar`}
                    </div>
                  </div>

                  {/* Servicios */}
                  <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Servicios</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#0369a1' }}>{backupStatus.metadata.counts.servicios}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>registros (precios + imágenes)</div>
                  </div>

                  {/* Cotizaciones */}
                  <div style={{ padding: '1rem', backgroundColor: '#fff5f0', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cotizaciones</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#FF6600' }}>{backupStatus.metadata.counts.cotizaciones}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>registros</div>
                  </div>

                  {/* Leads */}
                  <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#16a34a' }}>{backupStatus.metadata.counts.leads}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>registros</div>
                  </div>

                  {/* Admins */}
                  <div style={{ padding: '1rem', backgroundColor: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuarios Admin</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#7c3aed' }}>{backupStatus.metadata.counts.usuariosAdmins}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>registros</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                  <p style={{ color: '#64748b', margin: '0 0 0.5rem', fontWeight: 600 }}>No hay backup guardado</p>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
                    Haz clic en "Hacer Backup Ahora" para descargar todos los datos de Airtable y guardarlos localmente.
                  </p>
                </div>
              )}
            </div>

            {/* Progreso del backup */}
            {backupRunning && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{backupProgress.step}</span>
                  <span style={{ fontSize: '0.9rem', color: '#FF6600', fontWeight: 700 }}>{backupProgress.pct}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${backupProgress.pct}%`, backgroundColor: '#FF6600', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Mensaje resultado */}
            {backupMsg && (
              <div style={{ padding: '0.9rem 1.2rem', borderRadius: '10px', backgroundColor: backupMsg.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${backupMsg.ok ? '#bbf7d0' : '#fecaca'}`, color: backupMsg.ok ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
                {backupMsg.text}
              </div>
            )}

            {/* Estado Firebase */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem' }}>
                  🔥 Firebase — Caché en la Nube
                </h3>
                {!backupStatus.fbAvailable && (
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>
                    No configurado
                  </span>
                )}
              </div>

              {!backupStatus.fbAvailable ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                  Firebase no está configurado en este entorno. Las variables <code>VITE_FIREBASE_*</code> no están presentes.
                </p>
              ) : fbSyncStatus.loading ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Consultando Firebase...</p>
              ) : fbSyncStatus.synced ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Último sync a Firebase</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                      {fbSyncStatus.fbSyncedAt ? new Date(fbSyncStatus.fbSyncedAt).toLocaleString('es-CO') : '—'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '0.3rem', fontWeight: 600 }}>✅ {fbSyncStatus.serviciosCount} servicios en la nube</div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', flex: 2, minWidth: '200px', lineHeight: 1.5 }}>
                    Los datos están disponibles en Firebase. Cualquier dispositivo puede restaurar el catálogo desde la nube
                    usando el botón <strong>"Restaurar desde Firebase"</strong> sin necesidad de llamar a Airtable.
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.2rem', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
                    ⚠️ Firebase no tiene datos de servicios aún
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f' }}>
                    Haz clic en <strong>"Hacer Backup Ahora"</strong> para descargar los datos de Airtable y subirlos automáticamente a Firebase.
                    Después de eso, este dispositivo y cualquier otro podrán restaurar sin usar Airtable.
                  </p>
                </div>
              )}

              {/* Botón restaurar desde Firebase */}
              {backupStatus.fbAvailable && fbSyncStatus.synced && (
                <button
                  onClick={handleRestoreFromFirebase}
                  disabled={fbRestoring || backupRunning}
                  style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', borderRadius: '10px', border: '2px solid #f59e0b', backgroundColor: 'white', color: '#d97706', fontWeight: 700, fontSize: '0.875rem', cursor: fbRestoring ? 'not-allowed' : 'pointer' }}
                >
                  {fbRestoring ? '⏳ Restaurando...' : '☁️ Restaurar desde Firebase (sin Airtable)'}
                </button>
              )}
            </div>

            {/* Acciones principales */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.2rem', color: '#1e293b', fontSize: '1.05rem' }}>Acciones</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>

                {/* Hacer backup */}
                <button
                  onClick={handleRunBackup}
                  disabled={backupRunning}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: backupRunning ? '#e2e8f0' : '#FF6600',
                    color: backupRunning ? '#94a3b8' : 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: backupRunning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {backupRunning ? '⏳ Haciendo backup...' : '🔄 Hacer Backup Ahora'}
                </button>

                {/* Exportar */}
                <button
                  onClick={handleExportBackup}
                  disabled={!backupStatus.hasBackup || backupRunning}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    border: '2px solid #3b82f6',
                    backgroundColor: 'white',
                    color: backupStatus.hasBackup ? '#3b82f6' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: backupStatus.hasBackup && !backupRunning ? 'pointer' : 'not-allowed',
                  }}
                >
                  📤 Exportar Backup (.json)
                </button>

                {/* Importar */}
                <label
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    border: '2px solid #10b981',
                    backgroundColor: 'white',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: backupRunning ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  📥 Importar Backup (.json)
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportBackup}
                    disabled={backupRunning}
                  />
                </label>
              </div>
            </div>

            {/* Info tablas */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: '1.05rem' }}>Tablas incluidas en el backup</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { icon: '🗂️', name: 'ServiciosTuristicos_SAI', desc: 'Catálogo completo: nombres, precios, descripciones, imágenes, itinerarios y horarios' },
                  { icon: '📝', name: 'CotizacionesGG', desc: 'Historial de cotizaciones B2B generadas por agencias de viaje' },
                  { icon: '👥', name: 'Leads', desc: 'Prospectos y leads del CRM para seguimiento comercial' },
                  { icon: '🔐', name: 'Usuarios_Admins', desc: 'Usuarios con acceso de administrador al sistema' },
                ].map(t => (
                  <div key={t.name} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.3rem', fontFamily: 'monospace' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nota sobre imágenes */}
            <div style={{ padding: '1rem 1.2rem', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '0.85rem', color: '#92400e' }}>
              <strong>ℹ️ Nota sobre imágenes:</strong> Las URLs de imágenes de Airtable se guardan en el backup. Las imágenes en sí se sirven desde el CDN de Airtable
              (dl.airtable.com), que normalmente sigue disponible incluso si la API de Airtable no responde. Si quieres imágenes completamente independientes,
              usa la pestaña <strong>🗂️ Servicios → Catálogo</strong> para agregar URLs de WordPress a cada servicio.
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL DETALLE COTIZACIÓN ── */}
      {selectedCotizacion && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="card" style={{ padding: '0', width: '100%', maxWidth: '680px', borderRadius: '16px', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #FF6600, #ff8533)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'white' }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.2rem' }}>Cotización</div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{selectedCotizacion.id}</h3>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  {new Date(selectedCotizacion.createdTime).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setSelectedCotizacion(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Estado:</label>
                <select
                  value={editEstado}
                  onChange={e => setEditEstado(e.target.value)}
                  style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: `2px solid ${estadoColor[editEstado] || '#e2e8f0'}`, fontSize: '0.9rem', fontWeight: 'bold', color: estadoColor[editEstado] || '#64748b', backgroundColor: `${estadoColor[editEstado] || '#94a3b8'}15`, cursor: 'pointer' }}
                >
                  <option value="borrador">Borrador</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada ✓</option>
                  <option value="cancelada">Cancelada ✗</option>
                </select>
                {detailMsg && <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>{detailMsg}</span>}
              </div>

              {/* Cliente */}
              <section style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>👤 Cliente</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { label: 'Nombre', val: selectedCotizacion.nombre },
                    { label: 'Email', val: selectedCotizacion.email },
                    { label: 'Teléfono', val: selectedCotizacion.telefono || '—' },
                    { label: 'Adultos', val: selectedCotizacion.adultos },
                    { label: 'Niños', val: selectedCotizacion.ninos },
                    selectedCotizacion.fechaInicio ? { label: 'Fechas viaje', val: `${fmtDate(selectedCotizacion.fechaInicio)} → ${fmtDate(selectedCotizacion.fechaFin)}` } : null,
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', wordBreak: 'break-all' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Servicios */}
              {((selectedCotizacion.accommodations?.length || 0) + (selectedCotizacion.tours?.length || 0) + (selectedCotizacion.transports?.length || 0)) > 0 && (
                <section>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🛎️ Servicios Seleccionados</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                    {/* Alojamientos */}
                    {selectedCotizacion.accommodations?.map((acc: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: '10px', padding: '0.75rem 1rem', borderLeft: '4px solid #3b82f6', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#1e40af' }}>🏨 {acc.hotelName || acc.nombre || 'Alojamiento'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                            {fmtDate(acc.checkIn)} → {fmtDate(acc.checkOut)} · {acc.nights || '?'} noche(s)
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {acc.quantity || 1} hab. · {acc.adults || 0} adultos{acc.children ? `, ${acc.children} niños` : ''}
                          </div>
                          {acc.roomType || acc.categoria ? (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.roomType || acc.categoria}</div>
                          ) : null}
                        </div>
                        <div style={{ fontWeight: 700, color: '#1e40af', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                          {fmtPrice(acc.total || acc.totalPrice)}
                        </div>
                      </div>
                    ))}

                    {/* Tours */}
                    {selectedCotizacion.tours?.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '0.75rem 1rem', borderLeft: '4px solid #10b981', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#065f46' }}>🎫 {t.tourName || t.nombre || 'Tour'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                            {fmtDate(t.date)}{t.schedule ? ` · ${t.schedule}` : ''}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {t.duration || '?'} · {t.quantity || t.people || 1} persona(s)
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#065f46', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                          {fmtPrice(t.total)}
                        </div>
                      </div>
                    ))}

                    {/* Transportes */}
                    {selectedCotizacion.transports?.map((tr: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#fafaf9', borderRadius: '10px', padding: '0.75rem 1rem', borderLeft: '4px solid #64748b', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#334155' }}>🚕 {tr.vehicleType || tr.nombre || 'Transporte'}</div>
                          {(tr.origin || tr.destination) && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                              {tr.origin || '?'} → {tr.destination || '?'}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {fmtDate(tr.date)}{tr.time ? ` · ${tr.time}` : ''} · {tr.totalPassengers || tr.quantity || 1} pasajero(s)
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                          {fmtPrice(tr.total || tr.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#fff5f0', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '0.875rem', color: '#c2410c', fontWeight: 600, marginRight: '1rem' }}>TOTAL COTIZACIÓN</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF6600' }}>
                  ${(selectedCotizacion.precioTotal || 0).toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Notas internas */}
              <section>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                  📝 Notas Internas
                </label>
                <textarea
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  placeholder="Agrega notas internas sobre esta cotización..."
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </section>

              {/* Otras cotizaciones del mismo cliente */}
              {relatedQuotes.filter(q => q.id !== selectedCotizacion.id).length > 0 && (
                <section>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📋 Otras cotizaciones de {selectedCotizacion.email}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {relatedQuotes.filter(q => q.id !== selectedCotizacion.id).map(q => (
                      <div
                        key={q.id}
                        onClick={() => handleOpenDetail(q)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      >
                        <div>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>{q.id}</span>
                          <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>{new Date(q.createdTime).toLocaleDateString('es-CO')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>${(q.precioTotal || 0).toLocaleString('es-CO')}</span>
                          <span style={{ padding: '0.15rem 0.6rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: `${estadoColor[q.estado || 'borrador']}20`, color: estadoColor[q.estado || 'borrador'] }}>
                            {q.estado || 'borrador'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  onClick={handleSaveDetail}
                  style={{ flex: '1', minWidth: '140px', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', backgroundColor: '#FF6600', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  💾 Guardar cambios
                </button>
                <button
                  onClick={handleRegisterAsLead}
                  title="Registrar este cliente en Leads CRM"
                  style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '2px solid #3b82f6', backgroundColor: 'white', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                >
                  👥 → Lead CRM
                </button>
                <button
                  onClick={handleRegisterAsAgency}
                  title="Registrar este cliente como Agencia"
                  style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '2px solid #10b981', backgroundColor: 'white', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                >
                  🏢 → Agencia
                </button>
                <button
                  onClick={() => setSelectedCotizacion(null)}
                  style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR SERVICIO ── */}
      {editingService && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '520px' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>✏️ Editar Servicio</h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              <strong>{editingService.nombre}</strong>
            </p>

            {/* Tipo */}
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
              Tipo de Servicio
            </label>
            <select
              value={editTipo}
              onChange={e => setEditTipo(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1rem', backgroundColor: 'white' }}
            >
              <option value="Tour">Tour</option>
              <option value="Alojamiento">Alojamiento</option>
              <option value="Alquiler Vehiculo">Alquiler Vehículo</option>
              <option value="Evento">Evento</option>
              <option value="Transporte">Transporte</option>
              <option value="Paquete">Paquete</option>
              <option value="Otro">Otro</option>
            </select>

            {/* Categoría */}
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
              Categoría
            </label>
            <input
              type="text"
              value={editCategoria}
              onChange={e => setEditCategoria(e.target.value)}
              placeholder="Ej: Excursión a Cayos, Aventura y Naturaleza..."
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1.5rem' }}
            />

            {/* Fotos */}
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.6rem' }}>
              Fotos (URLs de WordPress)
            </label>

            {/* Preview primera foto */}
            {editImages[0] && (
              <img
                src={editImages[0]}
                alt="preview"
                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}

            {/* Lista de URLs actuales */}
            {editImages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {editImages.map((url, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', padding: '0.4rem 0.6rem', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '20px' }}>{idx + 1}.</span>
                    <span style={{ flex: 1, fontSize: '0.75rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={url}>
                      {url}
                    </span>
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      style={{ flexShrink: 0, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 4px' }}
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                Sin fotos. Agrega la URL de WordPress de cada imagen.
              </p>
            )}

            {/* Input agregar URL */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                value={editNewImageUrl}
                onChange={e => setEditNewImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddImageUrl()}
                placeholder="https://tuwordpress.com/wp-content/uploads/foto.jpg"
                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleAddImageUrl}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Agregar
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem', marginBottom: 0 }}>
              Presiona Enter o clic en "+ Agregar" para añadir cada URL.
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingService(null)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveServiceEdit}
                disabled={savingId === editingService?.id}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#FF6600', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {savingId === editingService?.id ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR/EDITAR PAQUETE ── */}
      {showPaqueteForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b' }}>
              {editingPaquete ? '✏️ Editar Servicio' : '➕ Crear Servicio'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tipo de Servicio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>Tipo de Servicio *</label>
                <select
                  value={paqueteForm.tipoServicio}
                  onChange={e => setPaqueteForm(p => ({ ...p, tipoServicio: e.target.value, selectedIds: [] }))}
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: 'white' }}
                >
                  <option value="Tour">Tour</option>
                  <option value="Alojamiento">Alojamiento</option>
                  <option value="Alquiler Vehiculo">Alquiler Vehículo</option>
                  <option value="Evento">Evento</option>
                  <option value="Paquete">Paquete Turístico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>Nombre *</label>
                <input
                  type="text"
                  value={paqueteForm.nombre}
                  onChange={e => setPaqueteForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: San Andrés Full Experience"
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>Descripción</label>
                <textarea
                  value={paqueteForm.descripcion}
                  onChange={e => setPaqueteForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Describe el servicio..."
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Imagen */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>URL de imagen</label>
                <input
                  type="text"
                  value={paqueteForm.imagenurl}
                  onChange={e => setPaqueteForm(p => ({ ...p, imagenurl: e.target.value }))}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                />
              </div>

              {/* Selector de servicios incluidos — solo para tipo Paquete */}
              {paqueteForm.tipoServicio === 'Paquete' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Servicios incluidos ({paqueteForm.selectedIds.length} seleccionados)
                  </label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
                    {allServices
                      .filter(s => ['Tour', 'Alojamiento', 'Alquiler Vehiculo', 'Evento'].includes(s._tipoServicio) && s._source === 'json')
                      .map(s => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderRadius: '6px', backgroundColor: paqueteForm.selectedIds.includes(s.id) ? '#fff5f0' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={paqueteForm.selectedIds.includes(s.id)}
                            onChange={() => toggleServiceInPaquete(s.id)}
                            style={{ accentColor: '#FF6600' }}
                          />
                          <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.nombre}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '8px',
                            backgroundColor: `${TYPE_COLORS[s._tipoServicio] || '#64748b'}20`,
                            color: TYPE_COLORS[s._tipoServicio] || '#64748b',
                          }}>
                            {s._tipoServicio}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            ${(s.precioBase || s.precioPerPerson || 0).toLocaleString('es-CO')}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Precio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                  Precio (COP)
                  {paqueteForm.tipoServicio === 'Paquete' && paqueteForm.selectedIds.length > 0 && (
                    <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>
                      {' '}— Suma seleccionados: ${allServices
                        .filter(s => paqueteForm.selectedIds.includes(s.id))
                        .reduce((sum, s) => sum + (s.precioBase || s.precioPerPerson || 0), 0)
                        .toLocaleString('es-CO')}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={paqueteForm.precioTotal || ''}
                  onChange={e => setPaqueteForm(p => ({ ...p, precioTotal: Number(e.target.value) }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                />
              </div>

              {/* Publicado */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={paqueteForm.publicado}
                  onChange={e => setPaqueteForm(p => ({ ...p, publicado: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#FF6600' }}
                />
                <span style={{ fontWeight: '600', color: '#374151' }}>Publicado (visible en la app)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaqueteForm(false)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePaquete}
                disabled={!paqueteForm.nombre}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: paqueteForm.nombre ? '#FF6600' : '#e2e8f0', color: paqueteForm.nombre ? 'white' : '#94a3b8', fontWeight: 'bold', cursor: paqueteForm.nombre ? 'pointer' : 'not-allowed' }}
              >
                {editingPaquete ? 'Actualizar' : 'Crear Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
