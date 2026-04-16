import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavigationBar } from './components/NavigationBar'
import { QuotationSummary } from './components/QuotationSummary'
import { QuotationPreview } from './components/QuotationPreview'
import { ContactInfoModal } from './components/ContactInfoModal'
import { LoginModal } from './components/LoginModal'
import { AuthModal } from './components/AuthModal'
import { ExpandableText } from './components/ExpandableText'
import { ImageModal } from './components/ImageModal'
import { TaxiZonesMap } from './components/TaxiZonesMap'
import { FeaturedServices } from './components/FeaturedServices'
import { ItineraryView } from './components/ItineraryView'
import ReservationTimeline from './components/ReservationTimeline'
import { calculateAccommodationPrice, createCotizacionGG, downloadRatesAsCSV, checkAgencyStatus, checkUsuariosAdmins, registerLead, sendSupportMessage, slugify } from './services/airtableService'
import { getAccommodationsFromJSON as getAccommodations, getToursFromJSON as getTours, getTransportsFromJSON as getTransports, getPaquetesFromJSON as getPaquetes } from './services/tariffService'
import { saveLocalCotizacion, saveLocalLead, buildResumen } from './services/localStorageService'
import { TAXI_ZONES, calculateTaxiPrice, calculateVehiclesNeeded } from './constants/taxiZones'
import { useQuotationStore } from './stores/quotationStore'
import './styles/guiasai-theme.css'
import './pages/services/ServiceMicrosite.css'

// Componente de paso guia para instrucciones inline
const GuideStep = ({ step, title, description }: { step: string; title: string; description: string }) => (
  <div style={{
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    padding: '1rem 1.25rem',
    backgroundColor: '#fff7ed',
    borderRadius: '8px',
    borderLeft: '4px solid #FF6600',
    marginBottom: '1.5rem'
  }}>
    <div style={{
      backgroundColor: '#FF6600',
      color: 'white',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      flexShrink: 0
    }}>
      {step}
    </div>
    <div>
      <strong style={{ color: '#333', fontSize: '0.95rem' }}>{title}</strong>
      <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>{description}</p>
    </div>
  </div>
)

// 🆕 Lista de correos de Super Admin
const ADMIN_EMAILS = ['skysk8ing@gmail.com', 'admin@guiasai.com', 'gerencia@guiasai.com']

function App() {
  const navigate = useNavigate()
  const [activeSectionId, setActiveSectionId] = useState('alojamientos')

  // IntersectionObserver para detectar la seccion visible y actualizar la nav
  useEffect(() => {
    const sectionIds = ['alojamientos', 'tours', 'paquetes', 'cotizacion']
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0 && visible[0].target.id) {
          setActiveSectionId(visible[0].target.id)
        }
      },
      { threshold: [0.1, 0.3, 0.5], rootMargin: '-80px 0px 0px 0px' }
    )

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Scroll a una seccion (compatibilidad con codigo legacy)
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const [accommodations, setAccommodations] = useState<any[]>([])
  const [tours, setTours] = useState<any[]>([])
  const [transports, setTransports] = useState<any[]>([])
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 🆕 Estado de autenticación (Ahora desde Store)
  const { isAuthenticated, agencyInfo, login, logout, isSuperAdmin } = useQuotationStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  // Modal unificado Iniciar Sesión / Registrarse (botón navbar)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 🆕 Estado para registro de nueva agencia
  const [isRegistering, setIsRegistering] = useState(false)

  // 🆕 Estados del Backend de Agencia
  const [showBranding, setShowBranding] = useState(true) // Toggle para logo GuiaSAI
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  
  // 🆕 Filtro por tipo de alojamiento
  const [selectedAccommodationType, setSelectedAccommodationType] = useState<string | null>(null)
  
  // 🆕 Zona de taxi seleccionada
  const [selectedTaxiZone, setSelectedTaxiZone] = useState<string | null>(null)
  // 🆕 Dirección del taxi (aeropuerto → zona | zona → aeropuerto)
  const [taxiDirection, setTaxiDirection] = useState<'airport-to-zone' | 'zone-to-airport'>('airport-to-zone')
  
  // 🆕 Indicador de muchas maletas
  const [hasLuggage] = useState(false)
  
  // 🆕 Filtros globales - Alojamientos
  const [filterCheckIn, setFilterCheckIn] = useState<string>('')
  const [filterCheckOut, setFilterCheckOut] = useState<string>('')
  const [filterAdults, setFilterAdults] = useState<number>(2)
  const [filterChildren, setFilterChildren] = useState<number>(0)
  const [filterBabies, setFilterBabies] = useState<number>(0)
  
  // 🆕 Filtros globales - Tours
  const [tourFilterDate, setTourFilterDate] = useState<string>('')
  const [tourFilterPassengers, setTourFilterPassengers] = useState<number>(2)
  
  // 🆕 Horarios seleccionados por tour (mapa: tourId -> horario)
  const [selectedSchedules, setSelectedSchedules] = useState<Record<string, string>>({})
  
  // 🆕 Estado del modal de vista previa
  const [showPreview, setShowPreview] = useState(false)

  // 🆕 Estado del modal de contacto
  const [showContactForm, setShowContactForm] = useState(false)
  const [pendingSubmitAfterContact, setPendingSubmitAfterContact] = useState(false)
  const [savingQuote, setSavingQuote] = useState(false)

  // 🆕 Información de contacto del cliente
  const [clientContact, setClientContact] = useState<{ name: string; phone: string; email: string } | null>(null)
  
  // 🆕 Estado para el modal de imágenes
  const [imageModalState, setImageModalState] = useState({
    isOpen: false,
    images: [] as string[],
    initialIndex: 0,
    title: ''
  })
  
  const ACCOMMODATION_TYPES = [
    'Hotel',
    'Aparta Hotel',
    'Apartamentos',
    'Casa',
    'Habitacion',
    'Hostal',
    'Posada Nativa',
    'Hotel boutique'
  ]

  // Cargar datos de Airtable
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [acc, trs, trp, pkgs] = await Promise.all([
          getAccommodations(),
          getTours(),
          getTransports(),
          getPaquetes(),
        ])
        console.log('🎫 Tours cargados:', trs)
        setAccommodations(acc)
        setTours(trs)
        setTransports(trp)
        setPaquetes(pkgs.filter(p => p.publicado))
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])


  const { mockQuotation, setMockQuotation, addTour: storeAddTour, clearQuotation } = useQuotationStore()

  const handleProfileClick = () => {
    if (isSuperAdmin) {
      navigate('/admin')
    } else {
      navigate('/panel')
    }
  }

  const handleLogout = () => {
    logout()
  }

  const handleLoginAgency = async (email: string, _password?: string) => {
    console.log('🔐 Verificando acceso para:', email)
    setLoading(true)
    
    try {
      // 1. Verificar en Airtable (Tabla Agencias)
      const status = await checkAgencyStatus(email)
      
      if (status.exists) {
        if (status.approved) {
          const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
          login({ name: status.name, email: email }, isAdmin)
          setShowLoginModal(false)
          
          if (isAdmin) {
            navigate('/admin')
          } else {
            alert(`¡Bienvenido ${status.name}! Acceso a tarifas confidenciales desbloqueado.`)
          }
        } else {
          alert('⚠️ Tu cuenta existe pero aún está pendiente de aprobación por parte de GuíaSAI. Te notificaremos pronto.')
        }
      } else {
        // 2. No está en Agencias → verificar Usuarios_Admins (administradores del sistema)
        const adminCheck = await checkUsuariosAdmins(email, _password)
        if (adminCheck.valid) {
          const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || adminCheck.rol === 'admin' || adminCheck.rol === 'super_admin'
          login({ name: adminCheck.name || 'Administrador', email }, isAdmin)
          setShowLoginModal(false)
          if (isAdmin) navigate('/admin')
          return
        }

        // 3. No encontrado en ninguna tabla → registrar lead
        const register = confirm('❌ No encontramos una cuenta aprobada con este email.\n\n¿Deseas registrar tu interés para que nuestro equipo comercial te contacte y habilite el acceso?')
        if (register) {
          await registerLead(email, 'Agencia Nacional')
          alert('✅ Hemos registrado tu solicitud. Un asesor te contactará pronto para validar tu agencia.')
        }
      }
    } catch (error) {
      // 🆕 Fallback para Super Admins si falla la conexión (Dev Mode)
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
      if (isAdmin) {
        console.warn('⚠️ Error de conexión con Airtable, pero es Super Admin. Permitiendo acceso de contingencia.')
        login({ name: 'Super Admin (Offline)', email: email }, true)
        setShowLoginModal(false)
        navigate('/admin')
        return
      }

      console.error(error)
      alert('Error de conexión verificando credenciales. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterClick = () => {
    setIsRegistering(true)
    setShowContactForm(true)
  }

  /**
   * Flujo del botón "Iniciar Sesión" en la navbar.
   * 1. Guarda el lead en localStorage (siempre funciona offline).
   * 2. Intenta registrar en Airtable en segundo plano (no bloquea).
   * 3. Si hay items en la cotización, la guarda y envía.
   */
  const handleLeadCapture = async (contact: { name: string; phone: string; email: string }) => {
    setClientContact(contact)

    // 1. Guardar lead en localStorage
    saveLocalLead({
      email: contact.email,
      nombre: contact.name,
      telefono: contact.phone,
      origen: 'Botón Iniciar Sesión',
    })

    // 2. Intentar Airtable en background (sin bloquear)
    try {
      await registerLead(contact.email, 'Web - Iniciar Sesión', contact.name, contact.phone, 'Botón Navbar')
    } catch {
      // falla silenciosa — ya está guardado localmente
    }

    // 3. Si tiene items en cotización, guardar y enviar
    const hasItems =
      mockQuotation.accommodations.length > 0 ||
      mockQuotation.tours.length > 0 ||
      mockQuotation.transports.length > 0

    if (hasItems) {
      await handleSubmitQuotation(contact)
    } else {
      alert(`✅ ¡Bienvenido ${contact.name}!\n\nTus datos han sido registrados. Explora nuestros servicios y agrega lo que desees a tu cotización.`)
    }
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportMessage.trim()) return
    
    setLoading(true)
    try {
      await sendSupportMessage(agencyInfo?.email || '', supportMessage, agencyInfo?.name)
      alert('✅ Mensaje enviado a tu asesor. Te responderemos pronto.')
      setSupportMessage('')
      setShowSupportModal(false)
    } catch (error) {
      alert('Error enviando mensaje.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClick = () => {
    handleSubmitQuotation()
  }

  const handleClearClick = () => {
    clearQuotation()
  }

  const handlePreviewClick = () => {
    // Si ya tenemos datos del cliente, mostrar directo la vista previa
    if (clientContact) {
      setShowPreview(true)
    } else {
      setPendingSubmitAfterContact(false)
      setShowContactForm(true)
    }
  }
  
  const handleContactInfoSubmit = async (data: { name: string; phone: string; email: string }) => {
    // 🆕 Lógica para Solicitud de Registro
    if (isRegistering) {
      setLoading(true)
      try {
        await registerLead(data.email, 'Agencia - Solicitud Web', data.name, data.phone, 'Boton Registro Header')
        alert('✅ Solicitud enviada correctamente.\n\nNuestro equipo verificará tus datos y te contactará pronto para habilitar tu acceso.')
        setShowContactForm(false)
        setIsRegistering(false)
      } catch (error) {
        console.error(error)
        alert('Hubo un error enviando tu solicitud. Por favor intenta nuevamente.')
      } finally {
        setLoading(false)
      }
      return
    }

    setClientContact(data)
    setShowContactForm(false)
    if (pendingSubmitAfterContact) {
      handleSubmitQuotation(data)
    } else {
      setShowPreview(true)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleSubmitQuotation = async (contactOverride?: { name: string; phone: string; email: string }) => {
    const contact = contactOverride || clientContact || (isAuthenticated && agencyInfo ? { name: agencyInfo.name, email: agencyInfo.email, phone: 'Agencia' } : null)
    if (!contact) {
      setPendingSubmitAfterContact(true)
      setShowContactForm(true)
      return
    }

    if (
      mockQuotation.accommodations.length === 0 &&
      mockQuotation.tours.length === 0 &&
      mockQuotation.transports.length === 0
    ) {
      alert('Agrega al menos un servicio antes de enviar la cotización')
      return
    }

    try {
      setSavingQuote(true)

      // Calcular rango de fechas
      const accommodationDates = mockQuotation.accommodations.flatMap((a: any) => [a.checkIn, a.checkOut])
      const tourDates = mockQuotation.tours.map((t: any) => t.date)
      const transportDates = mockQuotation.transports.map((t: any) => t.date)
      const allDates = [...accommodationDates, ...tourDates, ...transportDates].filter(Boolean)
      const sortedDates = allDates
        .map((d: Date) => (d instanceof Date ? d : new Date(d)))
        .filter((d: Date) => !Number.isNaN(d.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())

      const fechaInicio = sortedDates[0] ? sortedDates[0].toISOString().split('T')[0] : undefined
      const fechaFin = sortedDates[sortedDates.length - 1]
        ? sortedDates[sortedDates.length - 1].toISOString().split('T')[0]
        : fechaInicio

      // ── 1. GUARDAR EN LOCALSTORAGE (siempre, sin depender de Airtable) ──
      const resumen = buildResumen(
        mockQuotation.accommodations,
        mockQuotation.tours,
        mockQuotation.transports
      )
      const localCot = saveLocalCotizacion({
        nombre: contact.name,
        email: contact.email,
        telefono: contact.phone,
        precioTotal: mockQuotation.total,
        adultos: filterAdults,
        ninos: filterChildren,
        fechaInicio,
        fechaFin,
        accommodations: mockQuotation.accommodations,
        tours: mockQuotation.tours,
        transports: mockQuotation.transports,
        resumen,
        origen: 'portal-b2b',
        estado: 'borrador',
      })
      console.log('💾 Cotización guardada localmente:', localCot.id)

      // ── 2. INTENTAR AIRTABLE EN BACKGROUND (no bloquea) ──
      createCotizacionGG({
        nombre: contact.name,
        email: contact.email,
        telefono: contact.phone,
        fechaInicio,
        fechaFin,
        adultos: filterAdults,
        ninos: filterChildren,
        bebes: filterBabies,
        precioTotal: mockQuotation.total,
        notasInternas: `Generada desde portal B2B. ${showBranding ? 'Con Logo' : 'Marca Blanca'}.`,
        accommodations: mockQuotation.accommodations,
        tours: mockQuotation.tours,
        transports: mockQuotation.transports,
      }).then(({ cotizacionId }) => {
        console.log('☁️ Cotización sincronizada con Airtable:', cotizacionId)
      }).catch(err => {
        console.warn('⚠️ No se pudo sincronizar con Airtable (cotización ya guardada localmente):', err?.message)
      })

      // ── 3. FEEDBACK y reset ──
      alert(
        `✅ ¡Cotización guardada!\n\n` +
        `ID: ${localCot.id}\n\n` +
        `• ${mockQuotation.accommodations.length} alojamiento(s)\n` +
        `• ${mockQuotation.tours.length} tour(s)\n` +
        `• ${mockQuotation.transports.length} transporte(s)\n\n` +
        `Total: $${mockQuotation.total.toLocaleString('es-CO')} COP`
      )
      setMockQuotation({
        id: 'QT-' + Date.now(),
        accommodations: [],
        tours: [],
        transports: [],
        total: 0,
        currency: 'COP',
        status: 'draft',
      })
    } catch (error: any) {
      console.error('Error en handleSubmitQuotation:', error)
      alert('❌ Error al procesar la cotización: ' + (error?.message || 'Error desconocido'))
    } finally {
      setSavingQuote(false)
      setPendingSubmitAfterContact(false)
    }
  }

  // 🆕 Guardado automático al descargar PDF (sin resetear formulario)
  const handleAutoSaveQuotation = async () => {
    if (!clientContact) return

    try {
      // Determinar rango de fechas (mínimo y máximo de todos los servicios)
      const accommodationDates = mockQuotation.accommodations.flatMap((a: any) => [a.checkIn, a.checkOut])
      const tourDates = mockQuotation.tours.map((t: any) => t.date)
      const transportDates = mockQuotation.transports.map((t: any) => t.date)
      const allDates = [...accommodationDates, ...tourDates, ...transportDates].filter(Boolean)
      const sortedDates = allDates
        .map((d: Date) => (d instanceof Date ? d : new Date(d)))
        .filter((d: Date) => !Number.isNaN(d.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())

      const fechaInicio = sortedDates[0] ? sortedDates[0].toISOString().split('T')[0] : undefined
      const fechaFin = sortedDates[sortedDates.length - 1]
        ? sortedDates[sortedDates.length - 1].toISOString().split('T')[0]
        : fechaInicio

      await createCotizacionGG({
        nombre: clientContact.name,
        email: clientContact.email,
        telefono: clientContact.phone,
        fechaInicio,
        fechaFin,
        adultos: filterAdults,
        ninos: filterChildren,
        bebes: filterBabies,
        precioTotal: mockQuotation.total,
        notasInternas: 'Guardado automático al descargar PDF',
        accommodations: mockQuotation.accommodations,
        tours: mockQuotation.tours,
        transports: mockQuotation.transports
      })
      console.log('✅ Cotización guardada automáticamente en Airtable (PDF)')
    } catch (error) {
      console.error('Error guardando cotización automática:', error)
    }
  }

  // Función para agregar alojamiento a la cotización
  const handleAddAccommodation = (hotel: any, checkIn: string, checkOut: string, adults: number, children: number, rooms: number) => {
    if (!checkIn || !checkOut) {
      alert('Por favor selecciona las fechas de check-in y check-out')
      return
    }
    
    const [ciYear, ciMonth, ciDay] = checkIn.split('-').map(Number)
    const [coYear, coMonth, coDay] = checkOut.split('-').map(Number)
    const checkInDate = new Date(ciYear, ciMonth - 1, ciDay)
    const checkOutDate = new Date(coYear, coMonth - 1, coDay)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (nights <= 0) {
      alert('La fecha de check-out debe ser posterior al check-in')
      return
    }
    
    // Calcular precio usando la función que ya existe
    const totalGuests = adults + children
    const pricePerNight = calculateAccommodationPrice(hotel, totalGuests)
    const total = pricePerNight * nights * rooms
    
    console.log('=== AGREGANDO ALOJAMIENTO ===')
    console.log('Hotel:', hotel.nombre)
    console.log('Precio por noche calculado:', pricePerNight)
    console.log('Noches:', nights, 'Habitaciones:', rooms)
    console.log('Total:', total)
    console.log('Datos hotel:', { precioActualizado: hotel.precioActualizado, precioBase: hotel.precioBase, precio1Huesped: hotel.precio1Huesped })
    
    if (total === 0 || pricePerNight === 0) {
      alert('\u26a0\ufe0f Este alojamiento no tiene precio configurado en Airtable. Se agregar\u00e1 con precio $0. Por favor actualiza el precio manualmente.')
    }
    
    const newAccommodation = {
      id: Date.now().toString(),
      hotelId: hotel.id,
      hotelName: hotel.nombre,
      roomType: hotel.accommodationType || 'Estándar',
      categoria: hotel.categoria || hotel.accommodationType || 'Alojamiento',
      capacidad: hotel.capacidad || 0,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: nights,
      quantity: rooms,
      adults: adults,
      children: children,
      pricePerNight: pricePerNight,
      total: total,
      partnerConfirmed: false,
    }
    
    setMockQuotation({
      ...mockQuotation,
      accommodations: [...mockQuotation.accommodations, newAccommodation],
      total: mockQuotation.total + total
    })
    
    alert(`✓ ${hotel.nombre} agregado a la cotización`)
  }
  
  // Función para agregar tour a la cotización
  const handleAddTour = (tour: any, date: string, people: number) => {
    const selectedSchedule = selectedSchedules[tour.id]
    const success = storeAddTour(tour, date, people, selectedSchedule)
    if (success) {
      // Limpiar el horario seleccionado después de agregar
      const updatedSchedules = { ...selectedSchedules }
      delete updatedSchedules[tour.id]
      setSelectedSchedules(updatedSchedules)
    }
  }
  
  // Función para agregar transporte a la cotización
  const handleAddTransport = (transport: any, date: string, vehicles: number, passengers: number, origin: string = 'Por definir', destination: string = 'Por definir') => {
    if (!date) {
      alert('Por favor selecciona una fecha para el transporte')
      return
    }
    
    if (vehicles <= 0 || passengers <= 0) {
      alert('Por favor indica el número de vehículos y pasajeros')
      return
    }
    
    const pricePerVehicle = transport.precioPerVehicle || 0
    const total = pricePerVehicle * vehicles
    
    const newTransport = {
      id: Date.now().toString(),
      transportId: transport.id,
      transportType: transport.tipo || 'Transporte',
      origin: transport.originCustom || origin || 'Por definir',
      destination: transport.destinationCustom || destination || 'Por definir',
      date: (() => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d) })(),
      time: '12:00',
      vehicleType: transport.nombre,
      quantity: vehicles,
      capacity: transport.capacidad,
      totalPassengers: passengers,
      pricePerVehicle: pricePerVehicle,
      total: total,
      partnerConfirmed: false,
    }
    
    setMockQuotation({
      ...mockQuotation,
      transports: [...mockQuotation.transports, newTransport],
      total: mockQuotation.total + total
    })
    
    alert(`✓ ${transport.nombre} agregado a la cotización (${newTransport.origin} → ${newTransport.destination})`)
  }

  // 🆕 Abrir galería de imágenes
  const openImageGallery = (images: string[], title: string, initialIndex: number = 0) => {
    if (images && images.length > 0) {
      setImageModalState({
        isOpen: true,
        images: images,
        initialIndex: initialIndex,
        title: title
      })
    }
  }

  // Navegación a detalle de servicio (micro-sitio)
  const handleServiceClick = (service: any) => {
    const serviceSlug = service.slug || slugify(service.nombre)
    if (serviceSlug) {
      navigate(`/servicio/${serviceSlug}`, { state: { service } })
    }
  }

  // 🆕 Agregar traslado calculado por zona (taxi)
  const handleAddTaxiZone = () => {
    if (!selectedTaxiZone) {
      alert('Selecciona una zona de destino')
      return
    }

    const passengersInput = document.querySelector<HTMLInputElement>('.taxi-calculator .passengers-input')
    const passengers = parseInt(passengersInput?.value || '2') || 2
    const dateInput = document.getElementById('taxi-date') as HTMLInputElement | null
    const date = dateInput?.value

    if (!date) {
      alert('Selecciona la fecha del traslado')
      return
    }

    const zone = TAXI_ZONES.find(z => z.id === selectedTaxiZone)
    if (!zone) {
      alert('No se encontró la zona seleccionada')
      return
    }

    const vehicles = calculateVehiclesNeeded(passengers, hasLuggage)
    const isAirportToZone = taxiDirection === 'airport-to-zone'
    const origin = isAirportToZone ? 'Aeropuerto' : zone.name
    const destination = isAirportToZone ? zone.name : 'Aeropuerto'
    const description = isAirportToZone
      ? `Traslado desde aeropuerto hacia ${zone.name}`
      : `Traslado desde ${zone.name} hacia aeropuerto`

    const transport = {
      id: `taxi-${zone.id}`,
      tipo: 'airport-hotel',
      nombre: `Traslado ${zone.name}`,
      descripcion: description,
      capacidad: hasLuggage ? 3 : 4,
      precioPerVehicle: zone.priceSmall,
      rutas: [zone.sectors]
    }

    handleAddTransport(transport, date, vehicles, passengers, origin, destination)
  }

  return (
    <div style={styles.app}>
      <NavigationBar
        activeSectionId={activeSectionId}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        onRegisterClick={handleRegisterClick}
        isAuthenticated={isAuthenticated}
        quotationCount={mockQuotation.accommodations.length + mockQuotation.tours.length + mockQuotation.transports.length}
        onQuotationClick={() => document.getElementById('cotizacion')?.scrollIntoView({ behavior: 'smooth' })}
        panelLabel={isSuperAdmin ? "Admin Panel" : "Mi Panel"}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginAgency={handleLoginAgency}
      />

      {/* 🆕 DASHBOARD DE AGENCIA (BACKEND VIEW) */}
      {isAuthenticated && (
        <div style={{
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '1rem 2rem',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(45deg, #FF6600, #FF8C42)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              fontWeight: 'bold' 
            }}>
              AGENCIA PRO
            </div>
            <span style={{ fontSize: '0.9rem' }}>Hola, <strong>{agencyInfo?.name}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {/* Toggle Marca Blanca */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={showBranding} 
                onChange={(e) => setShowBranding(e.target.checked)}
                style={{ accentColor: '#FF6600' }}
              />
              Mostrar Logo GuiaSAI en PDF
            </label>

            {/* Botones de Acción */}
            <button 
              onClick={() => downloadRatesAsCSV(accommodations, tours, transports)}
              style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📥 Descargar Tarifas
            </button>
            
            <button 
              onClick={() => setShowSupportModal(true)}
              style={{ background: '#2FA9B8', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              💬 Contactar Asesor
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION PREMIUM */}
      <section className="hero-premium">
        <div className="hero-pattern"></div>
        <div className="hero-content animate-fade-in-up">
          <h1 className="hero-title">El Paraíso del Caribe<br />para tus Clientes</h1>
          <p className="hero-subtitle">
            Una única plataforma en la isla para múltiples servicios, apoyo local y servicio post venta.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">150+</div>
              <div className="stat-label">Proveedores Certificados</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Soporte Dedicado</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfacción Garantizada</div>
            </div>
          </div>

          {/* 🆕 SECCIÓN DE DESCARGA PROTEGIDA (Solo agencias aprobadas) */}
          <div style={{ marginTop: '2.5rem', display: isAuthenticated ? 'none' : 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            {isAuthenticated ? (
              <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(10px)', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                maxWidth: '550px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#06FFA5' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔓</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Acceso Mayorista Autorizado</span>
                </div>
                <p style={{ color: 'white', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Tienes acceso completo a nuestro tarifario confidencial 2026 (Neto + PVP) y disponibilidad en tiempo real.
                </p>
                <button 
                  onClick={() => downloadRatesAsCSV(accommodations, tours, transports)}
                  className="btn"
                  style={{ 
                    backgroundColor: 'white', 
                    color: '#00B4D8',
                    border: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                  }}
                >
                  📥 Descargar Tarifario (CSV/Excel)
                </button>
              </div>
            ) : (
              <div style={{ 
                padding: '1rem 1.5rem', 
                background: 'rgba(0, 0, 0, 0.2)', 
                backdropFilter: 'blur(10px)', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '500px'
              }}>
                <div style={{ color: 'white', fontSize: '1.5rem' }}>🔒</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.2rem' }}>¿Eres Agencia Mayorista?</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', margin: 0 }}>Inicia sesión para descargar tarifas confidenciales y formatos de integración.</p>
                </div>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="btn"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    marginLeft: '1rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Acceder
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTROS PREMIUM CON GLASS EFFECT - OCULTOS */}
      {/* <section className="filters-premium">
        <div className="filter-card">
          <div className="filter-grid">
            {activeTab === 'accommodations' && (
              <>
                <div className="filter-group">
                  <label className="filter-label">📅 Fecha Check-in</label>
                  <input 
                    type="date" 
                    className="filter-input" 
                    value={filterCheckIn}
                    onChange={(e) => setFilterCheckIn(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">📅 Fecha Check-out</label>
                  <input 
                    type="date" 
                    className="filter-input"
                    value={filterCheckOut}
                    onChange={(e) => setFilterCheckOut(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">👥 Adultos (18-99 años)</label>
                  <input 
                    type="number" 
                    className="filter-input" 
                    min="1" 
                    value={filterAdults}
                    onChange={(e) => setFilterAdults(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">👶 Niños (4-17 años)</label>
                  <input 
                    type="number" 
                    className="filter-input" 
                    min="0" 
                    value={filterChildren}
                    onChange={(e) => setFilterChildren(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">🍼 Bebés (0-3 años)</label>
                  <input 
                    type="number" 
                    className="filter-input" 
                    min="0" 
                    value={filterBabies}
                    onChange={(e) => setFilterBabies(parseInt(e.target.value) || 0)}
                  />
                </div>
              </>
            )}
            {activeTab === 'tours' && (
              <>
                <div className="filter-group">
                  <label className="filter-label">📅 Fecha Tour</label>
                  <input 
                    type="date" 
                    className="filter-input"
                    value={tourFilterDate}
                    onChange={(e) => setTourFilterDate(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">👥 Pasajeros</label>
                  <input 
                    type="number" 
                    className="filter-input" 
                    min="1" 
                    value={tourFilterPassengers}
                    onChange={(e) => setTourFilterPassengers(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">💰 Presupuesto</label>
                  <select className="filter-input">
                    <option>Todos los precios</option>
                    <option>$50.000 - $100.000 COP</option>
                    <option>$100.000 - $200.000 COP</option>
                    <option>$200.000+ COP</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'transports' && (
              <>
                <div className="filter-group">
                  <label className="filter-label">📅 Fecha</label>
                  <input type="date" className="filter-input" />
                </div>
                <div className="filter-group">
                  <label className="filter-label">👥 Pasajeros</label>
                  <input type="number" className="filter-input" min="1" defaultValue="2" />
                </div>
                <div className="filter-group">
                  <label className="filter-label">🚗 Tipo</label>
                  <select className="filter-input">
                    <option>Todos</option>
                    <option>Aeropuerto-Hotel</option>
                    <option>Tours</option>
                    <option>Privado</option>
                  </select>
                </div>
              </>
            )}
            <button className="btn-filter">🔍 Buscar Servicios</button>
          </div>
        </div>
      </section> */}

      {/* SECCION EXPERIENCIAS DESTACADAS - oculta */}
      {null}

      {/* ============================================ */}
      {/* SECCION 1: ALOJAMIENTOS                      */}
      {/* ============================================ */}
      <section id="alojamientos" className="services-section">
        <div style={styles.container}>
          <div className="section-header">
            <p className="section-description">Encuentra alternativas de alojamiento, apartamentos, habitaciones para parejas o grupos.</p>
          </div>
          <GuideStep step="1" title="Explora y selecciona alojamientos" description="Configura fechas de check-in/check-out y numero de huespedes. Luego haz clic en 'Agregar a Cotizacion' en los alojamientos que te interesen." />
          <FeaturedServices
            services={accommodations}
            onImageClick={openImageGallery}
            onServiceClick={handleServiceClick}
            renderCardContent={(service) => (
              <div>
                <h4 style={styles.itemTitle}>{service.nombre}</h4>
                <ExpandableText text={service.descripcion} style={styles.itemDesc} />
                <div style={styles.priceRange}>
                  {service.precioActualizado || service.precioBase
                    ? `$${(service.precioActualizado || service.precioBase).toLocaleString('es-CO')} COP/noche`
                    : 'Precio por confirmar'
                  }
                </div>
              </div>
            )}
          />
          <div style={styles.section}>
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Check-in:</label>
                    <input type="date" value={filterCheckIn} onChange={(e) => setFilterCheckIn(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Check-out:</label>
                    <input type="date" value={filterCheckOut} onChange={(e) => setFilterCheckOut(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Adultos (18-99 años):</label>
                    <input type="number" min={0} value={filterAdults} onChange={(e) => setFilterAdults(parseInt(e.target.value) || 0)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Niños (4-17 años):</label>
                    <input type="number" min={0} value={filterChildren} onChange={(e) => setFilterChildren(parseInt(e.target.value) || 0)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Bebés (0-3 años):</label>
                    <input type="number" min={0} value={filterBabies} onChange={(e) => setFilterBabies(parseInt(e.target.value) || 0)} style={styles.input} />
                  </div>
                </div>
                {/* 🆕 Menú de Filtros por Tipo */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <button
                    onClick={() => setSelectedAccommodationType(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: selectedAccommodationType === null ? '#FF6600' : '#f0f0f0',
                      color: selectedAccommodationType === null ? 'white' : '#666',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    Ver Todos
                  </button>
                  {ACCOMMODATION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedAccommodationType(type)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: selectedAccommodationType === type ? '#FF6600' : '#f0f0f0',
                        color: selectedAccommodationType === type ? 'white' : '#666',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div style={styles.card}>
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                  </div>
                ) : accommodations.filter(h => 
                    (!selectedAccommodationType || h.accommodationType === selectedAccommodationType) &&
                    ((filterAdults + filterChildren) <= 0 || (h.capacidad || 0) >= (filterAdults + filterChildren))
                  ).length > 0 ? (
                  <div style={styles.grid}>
                    {accommodations
                      .filter(h => (!selectedAccommodationType || h.accommodationType === selectedAccommodationType) && ((filterAdults + filterChildren) <= 0 || (h.capacidad || 0) >= (filterAdults + filterChildren)))
                      .map((hotel) => (
                      <div key={hotel.id} style={styles.card}>
                        {/* Imagen del alojamiento */}
                        {hotel.imageUrl && (
                          <div>
                            <div style={{
                              width: '100%',
                              height: '200px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              marginBottom: '0.5rem',
                              backgroundColor: '#f0f0f0',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                            }}
                            onClick={() => openImageGallery(hotel.images || [hotel.imageUrl], hotel.nombre, 0)}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                            }}>
                              <img 
                                src={hotel.imageUrl} 
                                alt={hotel.nombre}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%232FA9B8'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial,sans-serif' font-size='22' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3E🏨%3C/text%3E%3Ctext x='50%25' y='62%25' font-family='Arial,sans-serif' font-size='16' fill='white' text-anchor='middle' dominant-baseline='middle'%3EAlojamiento%3C/text%3E%3C/svg%3E"
                                }}
                              />
                            </div>
                            
                            {/* 🆕 Thumbnails de galería */}
                            {hotel.images && hotel.images.length > 1 && (
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                overflowX: 'auto'
                              }}>
                                {hotel.images.slice(0, 4).map((img: string, idx: number) => (
                                  <div
                                    key={idx}
                                    style={{
                                      minWidth: '60px',
                                      width: '60px',
                                      height: '45px',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      border: '2px solid ' + (idx === 0 ? '#FF6600' : '#e0e0e0'),
                                      cursor: 'pointer',
                                      position: 'relative',
                                      transition: 'transform 0.2s ease'
                                    }}
                                    onClick={() => openImageGallery(hotel.images || [hotel.imageUrl], hotel.nombre, idx)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                                    }}
                                  >
                                    <img
                                      src={img}
                                      alt={`${hotel.nombre} ${idx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                    {idx === 3 && hotel.images.length > 4 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}>
                                        +{hotel.images.length - 4}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <h4 style={styles.itemTitle}>{hotel.nombre}</h4>
                        <ExpandableText text={hotel.descripcion} style={styles.itemDesc} />
                        
                        {/* 🆕 Tipo de Alojamiento Badge */}
                        {hotel.accommodationType && (
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: '#FED7AA',
                            color: '#92400E',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                          }}>
                            {hotel.accommodationType}
                          </div>
                        )}
                        
                        <div style={styles.details}>
                          <span style={styles.location}>📍 {hotel.ubicacion}</span>
                          <span style={styles.capacity}>👥 Capacidad: {hotel.capacidad || 'N/D'} pax</span>
                        </div>
                        
                        {/* 🆕 Precio dinámico según tipo y huéspedes */}
                        <div style={styles.priceRange}>
                          {hotel.accommodationType === 'Hotel' || hotel.accommodationType === 'Casa' || 
                           hotel.accommodationType === 'Villa' || hotel.accommodationType === 'Finca' ||
                           hotel.accommodationType === 'Apartamentos' || hotel.accommodationType === 'Aparta Hotel' ? (
                            // Precio fijo por noche (no depende de huéspedes)
                            <div>
                              {(hotel.precioActualizado || hotel.precioBase) ? (
                                <>
                                  ${(hotel.precioActualizado || hotel.precioBase).toLocaleString('es-CO')} COP/noche
                                </>
                              ) : (
                                <div style={{ color: '#999', fontSize: '0.9rem' }}>
                                  Precio por confirmar
                                </div>
                              )}
                            </div>
                          ) : (
                            // Precio por huésped (Habitación)
                            <div>
                              {(hotel.precio2Huespedes || hotel.precio1Huesped || hotel.precioActualizado || hotel.precioBase) ? (
                                <>
                                  Desde ${(hotel.precio1Huesped || hotel.precio2Huespedes || hotel.precioActualizado || hotel.precioBase).toLocaleString('es-CO')} COP/noche
                                </>
                              ) : (
                                <div style={{ color: '#999', fontSize: '0.9rem' }}>
                                  Precio por confirmar
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 🆕 Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <p style={{...styles.services, backgroundColor: '#FFF7ED', padding: '0.5rem', borderRadius: '6px'}}>
                            <small style={{color: '#FF6600', fontWeight: 'bold'}}>✓ Amenities: </small>
                            <small>{hotel.amenities.slice(0, 3).join(' • ')}</small>
                            {hotel.amenities.length > 3 && <small style={{color: '#999'}}> +{hotel.amenities.length - 3} más</small>}
                          </p>
                        )}
                        
                        {/* 🆕 Selector compacto de fechas y huéspedes */}
                        <div style={{
                          backgroundColor: '#f0f9ff',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          marginBottom: '0.75rem'
                        }}>
                          <label style={{ 
                            fontSize: '0.8rem', 
                            color: '#555', 
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            📅 Fechas y huéspedes:
                          </label>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Check-in:</label>
                              <input
                                type="date"
                                id={`hotel-checkin-${hotel.id}`}
                                defaultValue={filterCheckIn}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Check-out:</label>
                              <input
                                type="date"
                                id={`hotel-checkout-${hotel.id}`}
                                defaultValue={filterCheckOut}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>👥 Adultos:</label>
                              <input
                                type="number"
                                id={`hotel-adults-${hotel.id}`}
                                min={1}
                                defaultValue={filterAdults}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>👶 Niños:</label>
                              <input
                                type="number"
                                id={`hotel-children-${hotel.id}`}
                                min={0}
                                defaultValue={filterChildren}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>🍼 Bebés:</label>
                              <input
                                type="number"
                                id={`hotel-babies-${hotel.id}`}
                                min={0}
                                defaultValue={filterBabies}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          style={styles.btn}
                          onClick={() => {
                            // Obtener valores de los campos individuales
                            const checkInInput = document.getElementById(`hotel-checkin-${hotel.id}`) as HTMLInputElement
                            const checkOutInput = document.getElementById(`hotel-checkout-${hotel.id}`) as HTMLInputElement
                            const adultsInput = document.getElementById(`hotel-adults-${hotel.id}`) as HTMLInputElement
                            const childrenInput = document.getElementById(`hotel-children-${hotel.id}`) as HTMLInputElement
                            
                            const checkIn = checkInInput?.value || filterCheckIn
                            const checkOut = checkOutInput?.value || filterCheckOut
                            const adults = parseInt(adultsInput?.value || '0') || filterAdults
                            const children = parseInt(childrenInput?.value || '0') || filterChildren
                            
                            if (!checkIn || !checkOut) {
                              alert('Por favor selecciona las fechas de check-in y check-out')
                              return
                            }
                            if (adults + children === 0) {
                              alert('Por favor indica al menos un adulto o niño')
                              return
                            }
                            const rooms = 1 // Por defecto 1 habitación
                            handleAddAccommodation(hotel, checkIn, checkOut, adults, children, rooms)
                          }}
                        >
                          ➕ Agregar a Cotización
                        </button>
                        <button
                          style={{
                            ...styles.btn,
                            background: 'transparent',
                            color: '#FF6600',
                            border: '2px solid #FF6600',
                            marginTop: '0.5rem',
                          }}
                          onClick={() => {
                            const hotelSlug = hotel.slug || slugify(hotel.nombre)
                            navigate(`/servicio/${hotelSlug}`, { state: { service: hotel } })
                          }}
                        >
                          Ver Detalles
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.card}>
                    <p>No hay alojamientos disponibles</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECCION 2: TOURS                             */}
      {/* ============================================ */}
      <section id="tours" className="services-section">
        <div style={styles.container}>
          <div className="section-header">
            <h2 className="section-title">Experiencias Unicas</h2>
            <p className="section-description">Aventuras inolvidables, cultura autentica y naturaleza exuberante del archipielago</p>
          </div>
          <GuideStep step="2" title="Agrega tours y experiencias" description="Selecciona la fecha, numero de pasajeros y horario disponible. Haz clic en 'Agregar a Cotizacion' para incluir tours en tu seleccion." />
          <FeaturedServices
            services={tours}
            onImageClick={openImageGallery}
            onServiceClick={handleServiceClick}
            renderCardContent={(service) => (
              <div onClick={e => e.stopPropagation()}>
                <h4 style={styles.itemTitle}>{service.nombre}</h4>
                <ExpandableText text={service.descripcion} style={styles.itemDesc} />
                <div style={styles.priceRange}>
                  {service.precioPerPerson
                    ? `$${service.precioPerPerson.toLocaleString('es-CO')} COP/persona`
                    : 'Precio por confirmar'
                  }
                </div>

                {/* Horarios disponibles */}
                {service.horarios && service.horarios.length > 0 && (
                  <div style={{ backgroundColor: '#fff8f0', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ffe0cc', marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                      🕐 Selecciona horario:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {service.horarios.map((h: string) => (
                        <button
                          key={h}
                          onClick={e => { e.stopPropagation(); setSelectedSchedules(prev => ({ ...prev, [service.id]: h })) }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '4px',
                            border: selectedSchedules[service.id] === h ? '2px solid #FF6600' : '1px solid #ddd',
                            backgroundColor: selectedSchedules[service.id] === h ? '#FF6600' : '#fff',
                            color: selectedSchedules[service.id] === h ? '#fff' : '#333',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: selectedSchedules[service.id] === h ? 'bold' : 'normal',
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    {selectedSchedules[service.id] && (
                      <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.4rem 0 0', fontWeight: 'bold' }}>
                        ✓ Horario {selectedSchedules[service.id]} seleccionado
                      </p>
                    )}
                  </div>
                )}

                {/* Pasajeros y Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                      👥 Pasajeros:
                    </label>
                    <input
                      type="number"
                      id={`feat-pass-${service.id}`}
                      min={1}
                      max={service.capacidad || 100}
                      defaultValue={tourFilterPassengers}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.95rem', textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                      📅 Fecha:
                    </label>
                    <input
                      type="date"
                      id={`feat-date-${service.id}`}
                      defaultValue={tourFilterDate}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Botones */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const dateEl = document.getElementById(`feat-date-${service.id}`) as HTMLInputElement
                    const passEl = document.getElementById(`feat-pass-${service.id}`) as HTMLInputElement
                    const date = dateEl?.value || tourFilterDate
                    const passengers = parseInt(passEl?.value || '0') || tourFilterPassengers
                    if (!date) { alert('Por favor selecciona una fecha para el tour'); return }
                    if (passengers <= 0) { alert('Por favor indica el número de pasajeros'); return }
                    if (service.horarios?.length > 0 && !selectedSchedules[service.id]) {
                      alert('⚠️ Por favor selecciona un horario disponible')
                      return
                    }
                    handleAddTour(service, date, passengers)
                  }}
                  disabled={service.horarios?.length > 0 && !selectedSchedules[service.id]}
                  style={{
                    ...styles.btn,
                    opacity: (service.horarios?.length > 0 && !selectedSchedules[service.id]) ? 0.5 : 1,
                    cursor: (service.horarios?.length > 0 && !selectedSchedules[service.id]) ? 'not-allowed' : 'pointer',
                  }}
                >
                  ➕ Agregar a Cotización
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleServiceClick(service) }}
                  style={{ ...styles.btn, background: 'transparent', color: '#FF6600', border: '2px solid #FF6600', marginTop: '0.5rem' }}
                >
                  Ver Detalles
                </button>
              </div>
            )}
          />
          <div style={styles.section}>
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Fecha del tour:</label>
                    <input type="date" value={tourFilterDate} onChange={(e) => setTourFilterDate(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', color: '#555' }}>Pasajeros:</label>
                    <input type="number" min={0} value={tourFilterPassengers} onChange={(e) => setTourFilterPassengers(parseInt(e.target.value) || 0)} style={styles.input} />
                  </div>
                </div>
                {loading ? (
                  <div style={styles.card}>
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                  </div>
                ) : tours.filter(t => (tourFilterPassengers <= 0) || ((t.capacidad || 0) >= tourFilterPassengers)).length > 0 ? (
                  <div style={styles.grid}>
                    {tours.filter(t => (tourFilterPassengers <= 0) || ((t.capacidad || 0) >= tourFilterPassengers)).map((tour) => (
                      <div key={tour.id} style={styles.card}>
                        {/* Imagen del tour */}
                        {tour.imageUrl && (
                          <div>
                            <div style={{
                              width: '100%',
                              height: '200px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              marginBottom: '0.5rem',
                              backgroundColor: '#f0f0f0',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                            }}
                            onClick={() => openImageGallery(tour.images || [tour.imageUrl], tour.nombre, 0)}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                            }}>
                              <img 
                                src={tour.imageUrl} 
                                alt={tour.nombre}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23FF6600'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial,sans-serif' font-size='22' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3E🎫%3C/text%3E%3Ctext x='50%25' y='62%25' font-family='Arial,sans-serif' font-size='16' fill='white' text-anchor='middle' dominant-baseline='middle'%3ETour%3C/text%3E%3C/svg%3E"
                                }}
                              />
                            </div>
                            
                            {/* 🆕 Thumbnails galería */}
                            {tour.images && tour.images.length > 1 && (
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                flexWrap: 'wrap'
                              }}>
                                {tour.images.slice(0, 4).map((img: string, idx: number) => (
                                  <div
                                    key={idx}
                                    style={{
                                      flex: '0 0 calc(25% - 0.375rem)',
                                      height: '45px',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      border: '2px solid ' + (idx === 0 ? '#FF6600' : '#e0e0e0'),
                                      cursor: 'pointer',
                                      position: 'relative',
                                      transition: 'transform 0.2s ease'
                                    }}
                                    onClick={() => openImageGallery(tour.images || [tour.imageUrl], tour.nombre, idx)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                                    }}
                                  >
                                    <img
                                      src={img}
                                      alt={`${tour.nombre} ${idx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                    {idx === 3 && tour.images.length > 4 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}>
                                        +{tour.images.length - 4}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <h4 style={styles.itemTitle}>{tour.nombre}</h4>
                        <ExpandableText text={tour.descripcion} style={styles.itemDesc} />
                        <div style={styles.details}>
                          <span style={styles.duration}>⏱️ {tour.duracion}</span>
                          <span style={styles.difficulty}>📊 {tour.dificultad}</span>
                        </div>
                        <div style={styles.priceRange}>
                          ${tour.precioPerPerson.toLocaleString('es-CO')} COP/persona
                        </div>
                        <p style={styles.services}>
                          <small>
                            ✓ Incluye: {(Array.isArray(tour.incluye)
                              ? tour.incluye
                              : tour.incluye ? [tour.incluye] : [])
                              .slice(0, 2)
                              .join(', ')}
                          </small>
                        </p>
                        
                        {/* 🆕 Información de días de operación */}
                        {tour.diasOperacion && (
                          <div style={{
                            backgroundColor: '#f3f4f6',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '0.75rem',
                            borderLeft: '3px solid #FF6600'
                          }}>
                            <p style={{ 
                              fontSize: '0.8rem', 
                              color: '#555', 
                              margin: '0',
                              fontWeight: 'bold'
                            }}>📅 Operación:</p>
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: '#666', 
                              margin: '0.25rem 0 0 0'
                            }}>
                              {tour.diasOperacion}
                            </p>
                          </div>
                        )}

                        {/* 🆕 Horarios disponibles (si existen) */}
                        {tour.horarios && tour.horarios.length > 0 && (
                          <div style={{
                            ...styles.formGroup,
                            backgroundColor: '#fff8f0',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #ffe0cc',
                            marginBottom: '0.75rem'
                          }}>
                            <label style={{ 
                              fontSize: '0.85rem', 
                              color: '#555', 
                              fontWeight: 'bold',
                              display: 'block',
                              marginBottom: '0.5rem'
                            }}>
                              🕐 Selecciona horario disponible:
                            </label>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                              gap: '0.5rem'
                            }}>
                              {tour.horarios.map((horario: string) => (
                                <button
                                  key={horario}
                                  onClick={() => setSelectedSchedules({ ...selectedSchedules, [tour.id]: horario })}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '4px',
                                    border: selectedSchedules[tour.id] === horario 
                                      ? '2px solid #FF6600' 
                                      : '1px solid #ddd',
                                    backgroundColor: selectedSchedules[tour.id] === horario 
                                      ? '#FF6600' 
                                      : '#ffffff',
                                    color: selectedSchedules[tour.id] === horario 
                                      ? '#ffffff' 
                                      : '#333',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: selectedSchedules[tour.id] === horario ? 'bold' : 'normal',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {horario}
                                </button>
                              ))}
                            </div>
                            {selectedSchedules[tour.id] && (
                              <p style={{
                                fontSize: '0.75rem',
                                color: '#10b981',
                                margin: '0.5rem 0 0 0',
                                fontWeight: 'bold'
                              }}>
                                ✓ Horario {selectedSchedules[tour.id]} seleccionado
                              </p>
                            )}
                          </div>
                        )}

                        {/* 🆕 Selector reorganizado: Pasajeros primero, luego Fecha, después Botón */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          marginBottom: '0.75rem'
                        }}>
                          {/* 1. Cantidad de participantes */}
                          <div style={{
                            ...styles.formGroup,
                            marginBottom: 0
                          }}>
                            <label style={{ 
                              fontSize: '0.8rem', 
                              color: '#555', 
                              fontWeight: 'bold',
                              display: 'block',
                              marginBottom: '0.35rem'
                            }}>
                              👥 Número de Pasajeros:
                            </label>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <button
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                                  if (input) {
                                    const newVal = Math.max(1, parseInt(input.value) - 1)
                                    input.value = newVal.toString()
                                  }
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  backgroundColor: '#f0f9ff',
                                  cursor: 'pointer',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                id={`tour-passengers-${tour.id}`}
                                min={1}
                                defaultValue={tourFilterPassengers}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '1rem',
                                  fontWeight: 'bold'
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                                  if (input) {
                                    const max = tour.capacidad || 100
                                    const newVal = Math.min(max, parseInt(input.value) + 1)
                                    input.value = newVal.toString()
                                  }
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '4px',
                                  border: '1px solid #bfdbfe',
                                  backgroundColor: '#f0f9ff',
                                  cursor: 'pointer',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* 2. Fecha del tour */}
                          <div style={{
                            ...styles.formGroup,
                            marginBottom: 0
                          }}>
                            <label style={{ 
                              fontSize: '0.8rem', 
                              color: '#555', 
                              fontWeight: 'bold',
                              display: 'block',
                              marginBottom: '0.35rem'
                            }}>
                              📅 Fecha del Tour:
                            </label>
                            <input
                              type="date"
                              id={`tour-date-${tour.id}`}
                              defaultValue={tourFilterDate}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.9rem'
                              }}
                            />
                          </div>
                        </div>
                        
                        <button 
                          style={{
                            ...styles.btn,
                            opacity: (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) ? 0.5 : 1,
                            cursor: (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) ? 'not-allowed' : 'pointer'
                          }}
                          disabled={tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]}
                          onClick={() => {
                            // Obtener fecha y pasajeros de los campos individuales de este tour
                            const dateInput = document.getElementById(`tour-date-${tour.id}`) as HTMLInputElement
                            const passengersInput = document.getElementById(`tour-passengers-${tour.id}`) as HTMLInputElement
                            
                            const tourDate = dateInput?.value || tourFilterDate
                            const tourPassengers = parseInt(passengersInput?.value || '0') || tourFilterPassengers
                            
                            if (!tourDate) {
                              alert('Por favor selecciona una fecha para el tour')
                              return
                            }
                            if (tourPassengers <= 0) {
                              alert('Por favor indica el número de pasajeros')
                              return
                            }
                            if (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) {
                              alert('⚠️ Por favor selecciona un horario disponible para este tour')
                              return
                            }
                            handleAddTour(tour, tourDate, tourPassengers)
                          }}
                        >
                          ➕ Agregar a Cotización
                        </button>
                        <button
                          style={{
                            ...styles.btn,
                            background: 'transparent',
                            color: '#FF6600',
                            border: '2px solid #FF6600',
                            marginTop: '0.5rem',
                          }}
                          onClick={() => {
                            const tourSlug = tour.slug || slugify(tour.nombre)
                            navigate(`/servicio/${tourSlug}`, { state: { service: tour } })
                          }}
                        >
                          Ver Detalles
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.card}>
                    <p>No hay tours disponibles</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECCION PREVIEW (eliminada - usar modal)     */}
      {/* ============================================ */}
      {false && (
              <div>
                {/* Formulario de contacto / Datos del cliente */}
                {!clientContact && !isAuthenticated ? (
                  <div style={{
                    ...styles.card,
                    marginBottom: '1.5rem',
                    border: '2px solid #FF6600',
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
                  }}>
                    <h3 style={{ color: '#FF6600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      Tus Datos de Contacto
                    </h3>
                    <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Ingresa tu informacion para generar la cotizacion y que podamos contactarte.
                    </p>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const form = e.target as HTMLFormElement
                      const name = (form.elements.namedItem('contact-name') as HTMLInputElement).value.trim()
                      const phone = (form.elements.namedItem('contact-phone') as HTMLInputElement).value.trim()
                      const email = (form.elements.namedItem('contact-email') as HTMLInputElement).value.trim()
                      if (!name || !phone || !email) {
                        alert('Por favor completa todos los campos')
                        return
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        alert('Por favor ingresa un email valido')
                        return
                      }
                      setClientContact({ name, phone, email })
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '0.3rem' }}>Nombre Completo *</label>
                          <input
                            type="text"
                            name="contact-name"
                            placeholder="Ej: Maria Garcia Lopez"
                            style={{ ...styles.input, borderColor: '#ffe0cc', marginTop: 0 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '0.3rem' }}>Telefono *</label>
                          <input
                            type="tel"
                            name="contact-phone"
                            placeholder="Ej: +57 3001234567"
                            style={{ ...styles.input, borderColor: '#ffe0cc', marginTop: 0 }}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '0.3rem' }}>Email *</label>
                        <input
                          type="email"
                          name="contact-email"
                          placeholder="Ej: contacto@agencia.com"
                          style={{ ...styles.input, borderColor: '#ffe0cc', marginTop: 0 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button type="submit" style={{ ...styles.btn, width: 'auto', marginTop: 0, padding: '0.6rem 1.5rem' }}>
                          Guardar Datos
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowLoginModal(true)}
                          style={{
                            padding: '0.6rem 1.5rem',
                            backgroundColor: 'transparent',
                            color: '#0ea5e9',
                            border: '2px solid #0ea5e9',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}
                        >
                          Ya tengo cuenta - Iniciar Sesion
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={{
                    ...styles.card,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                    border: '2px solid #22c55e'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Datos del cliente
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>
                        {isAuthenticated && agencyInfo ? (agencyInfo as any).name : clientContact?.name}
                      </p>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                        {isAuthenticated && agencyInfo ? (agencyInfo as any).email : `${clientContact?.phone} | ${clientContact?.email}`}
                      </p>
                    </div>
                    {!isAuthenticated && (
                      <button
                        onClick={() => setClientContact(null)}
                        style={{
                          padding: '0.4rem 1rem',
                          backgroundColor: 'transparent',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cambiar datos
                      </button>
                    )}
                  </div>
                )}

                {/* Resumen de servicios cotizados */}
                {(mockQuotation.accommodations.length > 0 || mockQuotation.tours.length > 0 || mockQuotation.transports.length > 0) ? (
                  <div>
                    {/* Alojamientos en cotizacion */}
                    {mockQuotation.accommodations.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: '#FF6600', fontSize: '1.1rem', marginBottom: '0.75rem' }}>🏨 Alojamientos ({mockQuotation.accommodations.length})</h3>
                        {mockQuotation.accommodations.map((acc: any, idx: number) => (
                          <div key={acc.id} style={{
                            ...styles.card,
                            marginBottom: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <strong>{acc.hotelName}</strong>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                                {acc.checkIn instanceof Date ? acc.checkIn.toLocaleDateString('es-CO') : acc.checkIn} → {acc.checkOut instanceof Date ? acc.checkOut.toLocaleDateString('es-CO') : acc.checkOut} | {acc.nights} noches | {acc.adults} adultos{acc.children > 0 ? `, ${acc.children} ninos` : ''}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 'bold', color: '#FF6600', fontSize: '1.1rem' }}>
                                ${acc.total.toLocaleString('es-CO')} COP
                              </span>
                              <button
                                onClick={() => {
                                  const updated = mockQuotation.accommodations.filter((_: any, i: number) => i !== idx)
                                  setMockQuotation({ ...mockQuotation, accommodations: updated, total: mockQuotation.total - acc.total })
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                              >
                                x
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tours en cotizacion */}
                    {mockQuotation.tours.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: '#FF6600', fontSize: '1.1rem', marginBottom: '0.75rem' }}>🚤 Tours ({mockQuotation.tours.length})</h3>
                        {mockQuotation.tours.map((tour: any, idx: number) => (
                          <div key={tour.id} style={{
                            ...styles.card,
                            marginBottom: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <strong>{tour.tourName}</strong>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                                {tour.date instanceof Date ? tour.date.toLocaleDateString('es-CO') : tour.date} | {tour.quantity} personas{tour.schedule ? ` | ${tour.schedule}` : ''}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 'bold', color: '#FF6600', fontSize: '1.1rem' }}>
                                ${tour.total.toLocaleString('es-CO')} COP
                              </span>
                              <button
                                onClick={() => {
                                  const updated = mockQuotation.tours.filter((_: any, i: number) => i !== idx)
                                  setMockQuotation({ ...mockQuotation, tours: updated, total: mockQuotation.total - tour.total })
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                              >
                                x
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transportes en cotizacion */}
                    {mockQuotation.transports.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: '#FF6600', fontSize: '1.1rem', marginBottom: '0.75rem' }}>✈️ Transportes ({mockQuotation.transports.length})</h3>
                        {mockQuotation.transports.map((trp: any, idx: number) => (
                          <div key={trp.id} style={{
                            ...styles.card,
                            marginBottom: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <strong>{trp.vehicleType}</strong>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                                {trp.origin} → {trp.destination} | {trp.date instanceof Date ? trp.date.toLocaleDateString('es-CO') : trp.date} | {trp.totalPassengers} pasajeros
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 'bold', color: '#FF6600', fontSize: '1.1rem' }}>
                                ${trp.total.toLocaleString('es-CO')} COP
                              </span>
                              <button
                                onClick={() => {
                                  const updated = mockQuotation.transports.filter((_: any, i: number) => i !== idx)
                                  setMockQuotation({ ...mockQuotation, transports: updated, total: mockQuotation.total - trp.total })
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                              >
                                x
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calendario de alojamientos */}
                    {mockQuotation.accommodations.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <ReservationTimeline
                          reservations={mockQuotation.accommodations.map((acc: any, idx: number) => ({
                            id: acc.id,
                            propertyName: acc.hotelName,
                            checkIn: acc.checkIn instanceof Date ? acc.checkIn : new Date(acc.checkIn),
                            checkOut: acc.checkOut instanceof Date ? acc.checkOut : new Date(acc.checkOut),
                            nights: acc.nights,
                            guests: acc.adults + (acc.children || 0),
                            pricePerNight: acc.pricePerNight,
                            totalPrice: acc.total,
                            color: (['green', 'blue', 'yellow', 'pink'] as const)[idx % 4]
                          }))}
                          startDate={(() => {
                            const dates = mockQuotation.accommodations.map((a: any) => a.checkIn instanceof Date ? a.checkIn : new Date(a.checkIn))
                            return new Date(Math.min(...dates.map((d: Date) => d.getTime())))
                          })()}
                          endDate={(() => {
                            const dates = mockQuotation.accommodations.map((a: any) => a.checkOut instanceof Date ? a.checkOut : new Date(a.checkOut))
                            return new Date(Math.max(...dates.map((d: Date) => d.getTime())))
                          })()}
                        />
                      </div>
                    )}

                    {/* Itinerario de viaje */}
                    {(() => {
                      const allTimestamps: number[] = []
                      mockQuotation.accommodations.forEach((acc: any) => {
                        if (acc.checkIn) allTimestamps.push((acc.checkIn instanceof Date ? acc.checkIn : new Date(acc.checkIn)).getTime())
                        if (acc.checkOut) allTimestamps.push((acc.checkOut instanceof Date ? acc.checkOut : new Date(acc.checkOut)).getTime())
                      })
                      mockQuotation.tours.forEach((t: any) => {
                        if (t.date) allTimestamps.push((t.date instanceof Date ? t.date : new Date(t.date)).getTime())
                      })
                      mockQuotation.transports.forEach((t: any) => {
                        if (t.date) allTimestamps.push((t.date instanceof Date ? t.date : new Date(t.date)).getTime())
                      })
                      if (allTimestamps.length === 0) return null
                      const startDate = new Date(Math.min(...allTimestamps))
                      const endDate = new Date(Math.max(...allTimestamps))
                      return (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <ItineraryView
                            startDate={startDate}
                            endDate={endDate}
                            accommodations={mockQuotation.accommodations}
                            tours={mockQuotation.tours}
                            transports={mockQuotation.transports}
                            embedded={false}
                          />
                        </div>
                      )
                    })()}

                    {/* Total y acciones */}
                    <div style={{
                      background: 'linear-gradient(135deg, #FF6600 0%, #FF8C42 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      color: 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total Estimado</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>
                          ${mockQuotation.total.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={handlePreviewClick}
                          style={{
                            padding: '0.7rem 1.5rem',
                            backgroundColor: 'white',
                            color: '#FF6600',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          📄 Descargar PDF
                        </button>
                        <button
                          onClick={handleConfirmClick}
                          disabled={savingQuote}
                          style={{
                            padding: '0.7rem 1.5rem',
                            backgroundColor: '#1a1a1a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: savingQuote ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            opacity: savingQuote ? 0.6 : 1
                          }}
                        >
                          {savingQuote ? 'Enviando...' : '✓ Enviar Cotizacion'}
                        </button>
                      </div>
                    </div>

                    {/* Nota informativa */}
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1rem 1.25rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#92400e'
                    }}>
                      <strong>Nota:</strong> Al seleccionar los distintos servicios se genera un itinerario completo organizado por dias que puedes usar como herramienta de consulta. La confirmacion de disponibilidades depende de un tiempo de espera: a veces con disponibilidad inmediata o a veces con 2 a 4 horas para respuesta si se realiza en horarios de oficina.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    ...styles.card,
                    textAlign: 'center',
                    padding: '3rem 2rem'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Tu cotizacion esta vacia</h3>
                    <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                      Explora nuestros alojamientos, tours y transportes para agregar servicios a tu cotizacion.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => scrollToSection('alojamientos')} style={{ ...styles.btn, width: 'auto', marginTop: 0 }}>
                        🏨 Ver Alojamientos
                      </button>
                      <button onClick={() => scrollToSection('tours')} style={{ ...styles.btn, width: 'auto', marginTop: 0, backgroundColor: '#2FA9B8' }}>
                        🚤 Ver Tours
                      </button>
                      <button onClick={() => scrollToSection('transportes')} style={{ ...styles.btn, width: 'auto', marginTop: 0, backgroundColor: '#333' }}>
                        ✈️ Ver Transportes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Instrucciones (eliminada - contenido inline) */}
            {false && (
              <div>
                {/* Paso a paso */}
                <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#FF6600', fontSize: '1.2rem', marginBottom: '1rem' }}>Como cotizar y reservar</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {[
                      { step: '1', title: 'Explora los servicios', desc: 'Navega por las pestañas de Alojamientos, Tours y Transportes para conocer todas las opciones disponibles en San Andres y Providencia.' },
                      { step: '2', title: 'Selecciona y agrega a cotizacion', desc: 'En cada servicio encontraras opciones de fecha, pasajeros y horarios. Haz clic en "Agregar a Cotizacion" para incluirlo en tu seleccion.' },
                      { step: '3', title: 'Revisa tu cotizacion', desc: 'Ve a la pestaña "Mi Cotizacion" para revisar todos los servicios seleccionados, ajustar cantidades y ver el total estimado.' },
                      { step: '4', title: 'Envia tu solicitud', desc: 'Haz clic en "Enviar Cotizacion" para que nuestro equipo reciba tu solicitud. Te contactaremos para confirmar disponibilidad.' },
                      { step: '5', title: 'Confirmacion y pago', desc: 'Una vez confirmada la disponibilidad (inmediata o en 2-4 horas en horario de oficina), procedemos con las opciones de pago disponibles.' }
                    ].map((item) => (
                      <div key={item.step} style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #FF6600'
                      }}>
                        <div style={{
                          backgroundColor: '#FF6600',
                          color: 'white',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {item.step}
                        </div>
                        <div>
                          <strong style={{ color: '#333', fontSize: '0.95rem' }}>{item.title}</strong>
                          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preguntas frecuentes */}
                <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#FF6600', fontSize: '1.2rem', marginBottom: '1rem' }}>Preguntas Frecuentes</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {[
                      { q: '¿Los precios incluyen impuestos?', a: 'Los precios mostrados son de referencia. Los impuestos y tasas aplicables se detallan al momento de la confirmacion final de la reserva.' },
                      { q: '¿Cuanto tarda la confirmacion?', a: 'La confirmacion de disponibilidad puede ser inmediata o tardar entre 2 a 4 horas si la solicitud se realiza en horarios de oficina (Lun-Vie 8am-6pm).' },
                      { q: '¿Puedo modificar mi cotizacion?', a: 'Si, puedes agregar o eliminar servicios en cualquier momento antes de enviar la cotizacion. Una vez enviada, contacta a tu asesor para modificaciones.' },
                      { q: '¿Que formas de pago aceptan?', a: 'Aceptamos transferencias bancarias, tarjetas de credito/debito y otros medios de pago que se detallan al momento de confirmar la reserva.' },
                      { q: '¿Como creo una cuenta?', a: 'Si eres agencia, haz clic en "Iniciar Sesion" y sigue el proceso de registro. Si ya tienes credenciales, ingresa tu email para acceder.' },
                      { q: '¿Que pasa despues de enviar mi cotizacion?', a: 'Se crea automaticamente un usuario base con tu solicitud. En futuras cotizaciones podras iniciar sesion y ver tu historial completo de solicitudes.' }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        backgroundColor: idx % 2 === 0 ? '#fff7ed' : '#f0f9ff',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: '#333', fontSize: '0.9rem' }}>{item.q}</strong>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacto / Soporte */}
                <div style={{
                  ...styles.card,
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: '#FF6600', fontSize: '1.2rem', marginBottom: '0.5rem' }}>¿Necesitas ayuda?</h3>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Nuestro equipo de soporte esta disponible para asistirte en todo el proceso de cotizacion y reserva.
                  </p>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    style={{
                      padding: '0.7rem 2rem',
                      backgroundColor: '#FF6600',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Contactar Asesor
                  </button>
                </div>
              </div>
            )}

      {/* ============================================ */}
      {/* SECCION 3: PAQUETES TURÍSTICOS — oculta      */}
      {/* ============================================ */}
      {paquetes.length > 0 && (
        <section id="paquetes" className="services-section">
          <div style={styles.container}>
            <div className="section-header">
              <h2 className="section-title">Paquetes Turísticos</h2>
              <p className="section-description">Experiencias completas con todo incluido — alojamiento, tours y traslados en un solo paquete</p>
            </div>
            <GuideStep step="3" title="Agrega paquetes turísticos" description="Selecciona fecha y número de pasajeros para cada paquete. Haz clic en 'Agregar a Cotización' para incluirlos." />
            <div style={styles.grid}>
              {paquetes.map((p, i) => {
                const pId = p.airtableId || `pkg-${i}`
                // Normalizar como servicio-tour para handleAddTour
                const asTour = {
                  id: pId,
                  nombre: p.nombre,
                  descripcion: p.descripcion,
                  precioPerPerson: (p.precioTotal ?? p.precioBase ?? 0),
                  precioBase: (p.precioTotal ?? p.precioBase ?? 0),
                  imageUrl: p.imageUrl || p.imagenurl || '',
                  images: p.images?.length ? p.images : (p.imagenurl ? [p.imagenurl] : []),
                  capacidad: p.capacidad || 20,
                  horarios: [] as string[],
                  duracion: p.duracion || '',
                  incluye: p.serviceNames || [],
                  slug: p.slug || '',
                  categoria: p.tipoServicio || 'Paquete',
                }
                return (
                  <div key={pId} style={styles.card}>
                    {/* Imagen */}
                    {(p.imageUrl || p.imagenurl) && (
                      <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem', backgroundColor: '#f0f0f0', cursor: 'pointer' }}
                        onClick={() => openImageGallery(p.images?.length ? p.images : [p.imagenurl!], p.nombre, 0)}>
                        <img
                          src={p.imageUrl || p.imagenurl}
                          alt={p.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}

                    {/* Badge tipo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h4 style={styles.itemTitle}>{p.nombre}</h4>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#fff5f0', color: '#FF6600', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {p.tipoServicio || 'Paquete'}
                      </span>
                    </div>

                    {/* Descripción expandible */}
                    <ExpandableText text={p.descripcion} style={styles.itemDesc} />

                    {/* Servicios incluidos */}
                    {p.serviceNames && p.serviceNames.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', margin: '0 0 0.3rem' }}>INCLUYE:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {p.serviceNames.slice(0, 4).map((name: string, j: number) => (
                            <span key={j} style={{ padding: '0.15rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569' }}>
                              {name}
                            </span>
                          ))}
                          {p.serviceNames.length > 4 && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', alignSelf: 'center' }}>+{p.serviceNames.length - 4} más</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Duración si existe */}
                    {p.duracion && (
                      <div style={styles.details}>
                        <span style={styles.duration}>⏱️ {p.duracion}</span>
                      </div>
                    )}

                    {/* Precio */}
                    <div style={styles.priceRange}>
                      ${(p.precioTotal ?? p.precioBase ?? 0).toLocaleString('es-CO')} COP/paquete
                    </div>

                    {/* Pasajeros y Fecha */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.35rem' }}>
                          👥 Número de Pasajeros:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                              if (input) input.value = String(Math.max(1, parseInt(input.value) - 1))
                            }}
                            style={{ width: '36px', height: '36px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#f0f9ff', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >−</button>
                          <input
                            type="number"
                            id={`pkg-pass-${pId}`}
                            min={1}
                            max={asTour.capacidad}
                            defaultValue={tourFilterPassengers}
                            style={{ flex: 1, padding: '0.5rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '1rem', fontWeight: 'bold' }}
                          />
                          <button
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                              if (input) input.value = String(Math.min(asTour.capacidad, parseInt(input.value) + 1))
                            }}
                            style={{ width: '36px', height: '36px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#f0f9ff', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.35rem' }}>
                          📅 Fecha de Inicio:
                        </label>
                        <input
                          type="date"
                          id={`pkg-date-${pId}`}
                          defaultValue={tourFilterDate}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    {/* Botón Agregar a Cotización */}
                    <button
                      style={styles.btn}
                      onClick={() => {
                        const dateEl = document.getElementById(`pkg-date-${pId}`) as HTMLInputElement
                        const passEl = document.getElementById(`pkg-pass-${pId}`) as HTMLInputElement
                        const date = dateEl?.value || tourFilterDate
                        const passengers = parseInt(passEl?.value || '0') || tourFilterPassengers
                        if (!date) { alert('Por favor selecciona una fecha para el paquete'); return }
                        if (passengers <= 0) { alert('Por favor indica el número de pasajeros'); return }
                        handleAddTour(asTour, date, passengers)
                      }}
                    >
                      ➕ Agregar a Cotización
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* SECCION 4: TRANSPORTES                       */}
      {/* ============================================ */}
      <section id="transportes" className="services-section">
        <div style={styles.container}>
          <div className="section-header">
            <h2 className="section-title">Traslados Premium</h2>
            <p className="section-description">Traslados comodos y seguros para todas sus necesidades de transporte</p>
          </div>
          <GuideStep step="3" title="Completa con transporte" description="Selecciona la zona de destino, sentido del viaje y numero de pasajeros para calcular el traslado aeropuerto-hotel." />
          <div style={styles.section}>
              <div>
                <TaxiZonesMap 
                  selectedZone={selectedTaxiZone || undefined}
                  hasLuggage={hasLuggage}
                  onZoneSelect={(zoneId) => {
                    setSelectedTaxiZone(zoneId)
                    // Scroll al selector de pasajeros
                    setTimeout(() => {
                      document.querySelector('.taxi-calculator')?.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                />

                {/* 🆕 Calculadora de Zonas y Tarifas */}
                <div className="taxi-calculator" style={{ 
                  ...styles.card, 
                  backgroundColor: '#FFF7ED', 
                  border: '2px solid #FF6600',
                  marginBottom: '1.5rem' 
                }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: '#FF6600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🧮 Calculadora de Precio
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Selecciona zona, sentido del viaje y pasajeros. La tarifa es la misma ida y regreso aeropuerto.
                  </p>
                  
                  {/* Selector de Zona */}
                  <div style={styles.formGroup}>
                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                      📍 ¿Cuál es tu destino?
                    </label>
                    <select 
                      style={{ ...styles.input, padding: '0.75rem', fontSize: '0.95rem' }}
                      value={selectedTaxiZone || ''}
                      onChange={(e) => {
                        const zoneId = e.target.value
                        setSelectedTaxiZone(zoneId)
                        if (zoneId) {
                          const zone = TAXI_ZONES.find(z => z.id === zoneId)
                          if (zone) {
                            const passengersInput = e.target.closest('.taxi-calculator')?.querySelector<HTMLInputElement>('.passengers-input')
                            const passengers = parseInt(passengersInput?.value || '2') || 2
                            const price = calculateTaxiPrice(zoneId, passengers, hasLuggage)
                            const vehicles = calculateVehiclesNeeded(passengers, hasLuggage)
                            const priceDisplay = e.target.closest('.taxi-calculator')?.querySelector('.price-display')
                            const vehiclesDisplay = e.target.closest('.taxi-calculator')?.querySelector('.vehicles-display')
                            if (priceDisplay) priceDisplay.textContent = `$${price.toLocaleString('es-CO')} COP`
                            if (vehiclesDisplay) vehiclesDisplay.textContent = `${vehicles} ${vehicles === 1 ? 'vehículo' : 'vehículos'}`
                          }
                        }
                      }}
                    >
                      <option value="">Selecciona una zona...</option>
                      {TAXI_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {zone.sectors}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sentido del traslado */}
                  <div style={styles.formGroup}>
                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                      ↔ Sentido del traslado
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setTaxiDirection('airport-to-zone')}
                        style={{
                          flex: '1 1 180px',
                          padding: '0.65rem',
                          borderRadius: '6px',
                          border: taxiDirection === 'airport-to-zone' ? '2px solid #FF6600' : '1px solid #ddd',
                          backgroundColor: taxiDirection === 'airport-to-zone' ? '#FF6600' : '#fff',
                          color: taxiDirection === 'airport-to-zone' ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Aeropuerto → Zona
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxiDirection('zone-to-airport')}
                        style={{
                          flex: '1 1 180px',
                          padding: '0.65rem',
                          borderRadius: '6px',
                          border: taxiDirection === 'zone-to-airport' ? '2px solid #FF6600' : '1px solid #ddd',
                          backgroundColor: taxiDirection === 'zone-to-airport' ? '#FF6600' : '#fff',
                          color: taxiDirection === 'zone-to-airport' ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Zona → Aeropuerto
                      </button>
                    </div>
                    <small style={{ color: '#666', marginTop: '0.35rem', display: 'block' }}>
                      Tarifa igual en ambos sentidos.
                    </small>
                  </div>

                  {/* Pasajeros */}
                  <div style={styles.formGroup}>
                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                      👥 Cantidad de Pasajeros
                    </label>
                    <input 
                      type="number" 
                      className="passengers-input"
                      style={{ ...styles.input, fontSize: '1.1rem', fontWeight: 'bold' }}
                      placeholder="2" 
                      defaultValue="2" 
                      min="1" 
                      max="15"
                      onChange={(e) => {
                        const passengers = parseInt(e.target.value) || 2
                        const zoneSelect = e.target.closest('.taxi-calculator')?.querySelector<HTMLSelectElement>('select')
                        if (zoneSelect && zoneSelect.value) {
                          const price = calculateTaxiPrice(zoneSelect.value, passengers, hasLuggage)
                          const vehicles = calculateVehiclesNeeded(passengers, hasLuggage)
                          const priceDisplay = e.target.closest('.taxi-calculator')?.querySelector('.price-display')
                          const vehiclesDisplay = e.target.closest('.taxi-calculator')?.querySelector('.vehicles-display')
                          if (priceDisplay) {
                            priceDisplay.textContent = `$${price.toLocaleString('es-CO')} COP`
                          }
                          if (vehiclesDisplay) {
                            vehiclesDisplay.textContent = `${vehicles} ${vehicles === 1 ? 'vehículo' : 'vehículos'}`
                          }
                        }
                      }}
                    />
                    <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                      {hasLuggage ? '3 pasajeros máximo por taxi (con comodidad)' : 'Hasta 4 pasajeros por taxi'}
                    </small>
                  </div>

                  {/* Fecha */}
                  <div style={styles.formGroup}>
                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                      📅 Fecha del traslado
                    </label>
                    <input 
                      type="date" 
                      id="taxi-date"
                      style={styles.input}
                    />
                  </div>

                  {/* Precio calculado */}
                  <div style={{
                    backgroundColor: '#FF6600',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginTop: '1rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Precio estimado:</div>
                    <div className="price-display" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                      Selecciona zona
                    </div>
                    <div className="vehicles-display" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      -
                    </div>
                  </div>

                  <button style={{ ...styles.btn, marginTop: '1rem', width: '100%' }} onClick={handleAddTaxiZone}>
                    ➕ Agregar Traslado a Cotización
                  </button>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
                  O selecciona un servicio de transporte:
                </h3>

                {loading ? (
                  <div style={styles.card}>
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                  </div>
                ) : transports.length > 0 ? (
                  <div style={styles.grid}>
                    {transports.map((transport) => (
                      <div key={transport.id} style={styles.card}>
                        {/* Imagen del vehículo */}
                        {transport.imageUrl && (
                          <div style={{
                            width: '100%',
                            height: '180px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '1rem',
                            backgroundColor: '#f0f0f0'
                          }}>
                            <img 
                              src={transport.imageUrl} 
                              alt={transport.nombre}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%232FA9B8'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial,sans-serif' font-size='22' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3E🚗%3C/text%3E%3Ctext x='50%25' y='65%25' font-family='Arial,sans-serif' font-size='16' fill='white' text-anchor='middle' dominant-baseline='middle'%3ETransporte%3C/text%3E%3C/svg%3E"
                              }}
                            />
                          </div>
                        )}
                        <h4 style={styles.itemTitle}>{transport.nombre}</h4>
                        <ExpandableText text={transport.descripcion} style={styles.itemDesc} />
                        <div style={styles.details}>
                          <span style={styles.type}>🚗 {transport.tipo}</span>
                          <span style={styles.capacity}>👥 Hasta {transport.capacidad} pax</span>
                        </div>
                        <div style={styles.priceRange}>
                          ${transport.precioPerVehicle.toLocaleString('es-CO')} COP/vehículo
                        </div>
                        <p style={styles.services}>
                          <small>✓ Rutas: {transport.rutas.slice(0, 2).join(', ')}</small>
                        </p>
                        <div style={styles.formGroup}>
                          <label>Vehículos:</label>
                          <input type="number" id={`transport-vehicles-${transport.id}`} style={styles.input} placeholder="1" defaultValue="1" min="1" />
                        </div>
                        <div style={styles.formGroup}>
                          <label>Pasajeros:</label>
                          <input type="number" id={`transport-passengers-${transport.id}`} style={styles.input} placeholder="4" defaultValue="4" min="1" />
                        </div>
                        <div style={styles.formGroup}>
                          <label>📍 Origen (lugar de recogida):</label>
                          <input type="text" id={`transport-origin-${transport.id}`} style={styles.input} placeholder="Aeropuerto / Hotel / etc." defaultValue="Por definir" />
                        </div>
                        <div style={styles.formGroup}>
                          <label>📍 Destino:</label>
                          <input type="text" id={`transport-destination-${transport.id}`} style={styles.input} placeholder="Hotel / Lugar de actividad / etc." defaultValue="Por definir" />
                        </div>
                        <div style={styles.formGroup}>
                          <label>Fecha del traslado:</label>
                          <input type="date" id={`transport-date-${transport.id}`} style={styles.input} required />
                        </div>
                        <button 
                          style={styles.btn}
                          onClick={() => {
                            const date = (document.getElementById(`transport-date-${transport.id}`) as HTMLInputElement).value
                            const vehicles = parseInt((document.getElementById(`transport-vehicles-${transport.id}`) as HTMLInputElement).value) || 1
                            const passengers = parseInt((document.getElementById(`transport-passengers-${transport.id}`) as HTMLInputElement).value) || 4
                            const origin = (document.getElementById(`transport-origin-${transport.id}`) as HTMLInputElement).value || 'Por definir'
                            const destination = (document.getElementById(`transport-destination-${transport.id}`) as HTMLInputElement).value || 'Por definir'
                            
                            // Agregar origen/destino a los datos del transporte
                            const transportWithRoute = {
                              ...transport,
                              originCustom: origin,
                              destinationCustom: destination
                            }
                            
                            handleAddTransport(transportWithRoute, date, vehicles, passengers, origin, destination)
                          }}
                        >
                          ➕ Agregar a Cotización
                        </button>
                        <button
                          style={{
                            ...styles.btn,
                            background: 'transparent',
                            color: '#FF6600',
                            border: '2px solid #FF6600',
                            marginTop: '0.5rem',
                          }}
                          onClick={() => {
                            const transportSlug = transport.slug || slugify(transport.nombre)
                            navigate(`/servicio/${transportSlug}`, { state: { service: transport } })
                          }}
                        >
                          Ver Detalles
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.card}>
                    <p>No hay transportes disponibles</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECCION 4: MI COTIZACION                     */}
      {/* ============================================ */}
      <section id="cotizacion" className="services-section">
        <div style={styles.container}>
          <div className="section-header">
            <h2 className="section-title">Mi Cotizacion</h2>
            <p className="section-description">Revisa los servicios seleccionados, genera tu cotizacion y enviala para confirmacion</p>
          </div>
          <GuideStep step="4" title="Revisa y envia tu cotizacion" description="Usa los botones de abajo para ver el resumen completo, descargar PDF o enviar tu solicitud. Nuestro equipo confirmara la disponibilidad." />

          <div style={{ ...styles.card, textAlign: 'center' as const, padding: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
              Tienes <strong style={{ color: '#FF6600' }}>{mockQuotation.accommodations.length + mockQuotation.tours.length + mockQuotation.transports.length}</strong> servicios en tu cotizacion
            </p>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#FF6600', margin: '0.5rem 0 1.5rem' }}>
              ${mockQuotation.total.toLocaleString('es-CO')} COP
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={handlePreviewClick} style={{ ...styles.btn, width: 'auto' }}>
                Vista Previa / Descargar PDF
              </button>
              <button onClick={handleConfirmClick} style={{ ...styles.btn, width: 'auto', backgroundColor: '#1a1a1a' }}>
                Enviar Cotizacion
              </button>
            </div>
          </div>

          {/* Preguntas frecuentes */}
          <div style={{ ...styles.card, marginTop: '1.5rem' }}>
            <h3 style={{ color: '#FF6600', fontSize: '1.2rem', marginBottom: '1rem' }}>Preguntas Frecuentes</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { q: '¿Los precios incluyen impuestos?', a: 'Los precios mostrados son de referencia. Los impuestos y tasas aplicables se detallan al momento de la confirmacion final de la reserva.' },
                { q: '¿Cuanto tarda la confirmacion?', a: 'La confirmacion de disponibilidad puede ser inmediata o tardar entre 2 a 4 horas si la solicitud se realiza en horarios de oficina (Lun-Vie 8am-6pm).' },
                { q: '¿Puedo modificar mi cotizacion?', a: 'Si, puedes agregar o eliminar servicios en cualquier momento antes de enviar la cotizacion. Una vez enviada, contacta a tu asesor para modificaciones.' },
                { q: '¿Que formas de pago aceptan?', a: 'Aceptamos transferencias bancarias, tarjetas de credito/debito y otros medios de pago que se detallan al momento de confirmar la reserva.' },
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: '1rem',
                  backgroundColor: idx % 2 === 0 ? '#fff7ed' : '#f0f9ff',
                  borderRadius: '8px'
                }}>
                  <strong style={{ color: '#333', fontSize: '0.9rem' }}>{item.q}</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resumen de cotizacion en la parte inferior */}
      <div style={styles.bottomSummary}>
        <QuotationSummary
          quotation={mockQuotation}
          onConfirmClick={handleConfirmClick}
          onClearClick={handleClearClick}
          onPreviewClick={handlePreviewClick}
          disabled={savingQuote}
        />
      </div>

      {/* 🆕 Modal de Información de Contacto */}
      {showContactForm && (
        <ContactInfoModal
          onSubmit={handleContactInfoSubmit}
          onClose={() => {
            setShowContactForm(false)
            setIsRegistering(false)
          }}
          submitLabel={isRegistering ? 'Enviar Solicitud' : (pendingSubmitAfterContact ? 'Enviar Cotización' : 'Descargar Cotización')}
          title={isRegistering ? 'Solicitud de Registro' : 'Información de contacto'}
          description={isRegistering ? 'Ingresa tus datos para solicitar acceso a la plataforma.' : 'Por favor, ingresa tu información de contacto para descargar la cotización.'}
        />
      )}

      {/* 🆕 Modal unificado Iniciar Sesión / Registrarse */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            setShowAuthModal(false)
            await handleLoginAgency(email, password)
          }}
          onRegister={async (data) => {
            setShowAuthModal(false)
            await handleLeadCapture(data)
          }}
        />
      )}

      {/* 🆕 Modal de Soporte Agencia */}
      {showSupportModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '500px', padding: '2rem'}}>
            <button style={styles.closeButton} onClick={() => setShowSupportModal(false)}>×</button>
            <h2 style={{...styles.itemTitle, marginBottom: '1rem'}}>💬 Contactar Asesor</h2>
            <p style={{marginBottom: '1.5rem', color: '#666', fontSize: '0.9rem'}}>
              Envía un mensaje directo a nuestro equipo de soporte B2B. Te responderemos vía email o WhatsApp.
            </p>
            <form onSubmit={handleSupportSubmit}>
              <div style={styles.formGroup}>
                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '0.5rem'}}>Tu Mensaje:</label>
                <textarea 
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={{...styles.input, minHeight: '120px', resize: 'vertical'}}
                  placeholder="Ej: Necesito una tarifa especial para un grupo de 20 personas..."
                  required
                />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                <button type="button" onClick={() => setShowSupportModal(false)} style={{...styles.btn, background: '#ccc', color: '#333', width: 'auto'}}>
                  Cancelar
                </button>
                <button type="submit" style={{...styles.btn, width: 'auto'}}>
                  Enviar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de vista previa */}
      {showPreview && mockQuotation && (
        <QuotationPreview
          quotation={mockQuotation}
          clientContact={clientContact}
          onClose={handleClosePreview}
          onSave={handleAutoSaveQuotation}
        />
      )}

      {/* 🆕 Modal de Galería de Imágenes */}
      <ImageModal
        isOpen={imageModalState.isOpen}
        images={imageModalState.images}
        initialIndex={imageModalState.initialIndex}
        title={imageModalState.title}
        onClose={() => setImageModalState({
          isOpen: false,
          images: [],
          initialIndex: 0,
          title: ''
        })}
      />

      {/* Boton flotante WhatsApp */}
      <a
        href="https://wa.me/573153836043?text=Hola%2C%20me%20gustar%C3%ADa%20hablar%20con%20un%20asesor%20de%20GuiaSAI"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '220px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1500,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          textDecoration: 'none'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)'
        }}
        title="Hablar con un asesor por WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="30" height="30" fill="white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.89 15.89 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.602c-.39 1.1-1.932 2.014-3.172 2.282-.85.18-1.96.324-5.698-1.226-4.784-1.984-7.86-6.834-8.098-7.152-.228-.318-1.918-2.554-1.918-4.87s1.214-3.456 1.644-3.928c.39-.428.916-.624 1.214-.624.15 0 .318.016.468.028.43.018.644.042.928.714.354.84 1.218 2.966 1.324 3.18.108.216.216.498.072.78-.134.29-.252.468-.468.724-.216.258-.444.456-.66.732-.198.24-.42.498-.174.928.246.43 1.092 1.802 2.348 2.92 1.614 1.436 2.976 1.882 3.396 2.09.43.216.678.18.928-.108.258-.29 1.092-1.27 1.382-1.706.284-.43.574-.36.964-.216.394.144 2.502 1.18 2.932 1.394.43.216.714.324.82.498.108.18.108 1.02-.282 2.118z"/>
        </svg>
      </a>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'var(--guiasai-bg-light)',
    paddingBottom: '200px', // 🆕 Espacio para el resumen fijo en la parte inferior
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'var(--spacing-lg)',
  },
  mainContent: {
    minWidth: 0,
  },
  title: {
    marginBottom: 'var(--spacing-lg)',
    color: 'var(--guiasai-primary)',
  },
  section: {
    display: 'grid',
    gap: 'var(--spacing-md)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--spacing-md)',
  },
  card: {
    background: 'var(--gradient-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    transition: 'var(--transition-base)',
    border: '1px solid var(--gray-200)',
    padding: 'var(--spacing-lg)',
  } as React.CSSProperties,
  itemTitle: {
    margin: '0 0 var(--spacing-sm) 0',
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  itemDesc: {
    margin: 'var(--spacing-sm) 0',
    fontSize: '0.9rem',
    color: 'var(--guiasai-text-light)',
  },
  details: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    margin: 'var(--spacing-sm) 0',
    flexWrap: 'wrap' as const,
  },
  location: {
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-dark)',
  },
  stars: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--guiasai-secondary)',
  },
  duration: {
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-dark)',
  },
  difficulty: {
    fontSize: '0.875rem',
    color: 'var(--guiasai-primary)',
  },
  type: {
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-dark)',
  },
  capacity: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--guiasai-secondary)',
  },
  priceRange: {
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: '6px',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    margin: 'var(--spacing-md) 0',
  },
  services: {
    margin: 'var(--spacing-sm) 0',
    color: 'var(--guiasai-text-light)',
  },
  sectionTitle: {
    marginBottom: 'var(--spacing-md)',
    color: 'var(--guiasai-text-dark)',
  },
  formGroup: {
    marginBottom: 'var(--spacing-md)',
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-sm)',
    borderRadius: '6px',
    border: '1px solid var(--guiasai-border)',
    marginTop: 'var(--spacing-xs)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.9rem',
  } as React.CSSProperties,
  btn: {
    backgroundColor: 'var(--guiasai-primary)',
    color: 'white',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    width: '100%',
    marginTop: 'var(--spacing-md)',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  btnSmall: {
    backgroundColor: 'var(--guiasai-secondary)',
    color: 'white',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    marginTop: 'var(--spacing-sm)',
    fontFamily: "'Poppins', sans-serif",
  } as React.CSSProperties,
  tourCard: {
    backgroundColor: 'var(--guiasai-bg-light)',
    padding: 'var(--spacing-md)',
    borderRadius: '6px',
    marginBottom: 'var(--spacing-md)',
  },
  price: {
    color: 'var(--guiasai-primary)',
    fontWeight: 600,
    marginBottom: 'var(--spacing-sm)',
  },
  bottomSummary: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    maxHeight: '180px',
    overflowY: 'auto',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '2rem',
  } as React.CSSProperties,
  modalContent: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '1000px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  } as React.CSSProperties,
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '1.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
}

export default App
