import { useState, useEffect } from 'react'
import { NavigationBar } from './components/NavigationBar'
import { QuotationSummary } from './components/QuotationSummary'
import { QuotationPreview } from './components/QuotationPreview'
import { ContactInfoModal } from './components/ContactInfoModal'
import { LoginModal } from './components/LoginModal'
import { ExpandableText } from './components/ExpandableText'
import { TaxiZonesMap } from './components/TaxiZonesMap'
import { ItineraryView } from './components/ItineraryView'
import { getAccommodations, getTours, getTransports, calculateAccommodationPrice, calculateTourPrice, createCotizacionGG, createCotizacionItemGG } from './services/airtableService'
import { TAXI_ZONES, calculateTaxiPrice, calculateVehiclesNeeded } from './constants/taxiZones'
import './styles/guiasai-theme.css'

function App() {
  const [activeTab, setActiveTab] = useState<'accommodations' | 'tours' | 'transports'>('accommodations')
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [tours, setTours] = useState<any[]>([])
  const [transports, setTransports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 🆕 Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // 🆕 Filtro por tipo de alojamiento
  const [selectedAccommodationType, setSelectedAccommodationType] = useState<string | null>(null)
  
  // 🆕 Zona de taxi seleccionada
  const [selectedTaxiZone, setSelectedTaxiZone] = useState<string | null>(null)
  // 🆕 Dirección del taxi (aeropuerto → zona | zona → aeropuerto)
  const [taxiDirection, setTaxiDirection] = useState<'airport-to-zone' | 'zone-to-airport'>('airport-to-zone')
  
  // 🆕 Indicador de muchas maletas
  const [hasLuggage, setHasLuggage] = useState(false)
  
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
  
  // 🆕 Estado de vista de itinerario
  const [showItinerary, setShowItinerary] = useState(false)
  
  // 🆕 Estado del modal de contacto
  const [showContactForm, setShowContactForm] = useState(false)
  const [pendingSubmitAfterContact, setPendingSubmitAfterContact] = useState(false)
  const [savingQuote, setSavingQuote] = useState(false)
  
  // 🆕 Información de contacto del cliente
  const [clientContact, setClientContact] = useState<{ name: string; phone: string; email: string } | null>(null)
  
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
        const [acc, trs, trp] = await Promise.all([
          getAccommodations(),
          getTours(),
          getTransports(),
        ])
        console.log('🎫 Tours cargados:', trs)
        setAccommodations(acc)
        setTours(trs)
        setTransports(trp)
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const [mockQuotation, setMockQuotation] = useState<any>({
    id: `QT-${Date.now()}`,
    accommodations: [],
    tours: [],
    transports: [],
    total: 0,
    currency: 'COP',
    status: 'draft',
  })

  const handleProfileClick = () => {
    alert('Perfil: Mi Agencia\nEmail: contacto@miagencia.com')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    alert('Cerrando sesión...')
  }

  const handleLoginAgency = async (email: string, password: string) => {
    // Aquí puedes agregar la lógica de autenticación con tu backend
    console.log('Login de Agencia:', email)
    setIsAuthenticated(true)
    setShowLoginModal(false)
    alert('¡Bienvenido! Sesión iniciada como Agencia')
  }

  const handleConfirmClick = () => {
    handleSubmitQuotation()
  }

  const handleClearClick = () => {
    setMockQuotation({
      ...mockQuotation,
      accommodations: [],
      tours: [],
      transports: [],
      total: 0,
    })
  }

  const handlePreviewClick = () => {
    setPendingSubmitAfterContact(false)
    setShowContactForm(true)
  }
  
  const handleContactInfoSubmit = (data: { name: string; phone: string; email: string }) => {
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
    const contact = contactOverride || clientContact
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

      // Crear cotización principal
      const cotizacionId = await createCotizacionGG({
        nombre: contact.name,
        email: contact.email,
        telefono: contact.phone,
        fechaInicio,
        fechaFin,
        adultos: filterAdults,
        ninos: filterChildren,
        bebes: filterBabies,
        precioTotal: mockQuotation.total,
        notasInternas: 'Generada desde portal de agencias (B2B)'
      })

      // Crear items ligados a la cotización
      const itemPromises: Promise<any>[] = []

      mockQuotation.accommodations.forEach((acc: any) => {
        itemPromises.push(
          createCotizacionItemGG({
            cotizacionId,
            servicioId: acc.hotelId,
            fechaInicio: acc.checkIn.toISOString().split('T')[0],
            fechaFin: acc.checkOut.toISOString().split('T')[0],
            adultos: acc.adults || acc.adultos || filterAdults,
            ninos: acc.children || filterChildren,
            precioUnitario: acc.pricePerNight,
            subtotal: acc.total,
          })
        )
      })

      mockQuotation.tours.forEach((tour: any) => {
        itemPromises.push(
          createCotizacionItemGG({
            cotizacionId,
            servicioId: tour.tourId,
            fechaInicio: tour.date.toISOString().split('T')[0],
            adultos: tour.quantity || tour.adultos || filterAdults,
            precioUnitario: tour.pricePerPerson,
            subtotal: tour.total,
          })
        )
      })

      mockQuotation.transports.forEach((tr: any) => {
        itemPromises.push(
          createCotizacionItemGG({
            cotizacionId,
            servicioId: tr.transportId,
            fechaInicio: tr.date.toISOString().split('T')[0],
            adultos: tr.totalPassengers || filterAdults,
            precioUnitario: tr.pricePerVehicle,
            subtotal: tr.total,
          })
        )
      })

      await Promise.all(itemPromises)

      alert('✓ Cotización enviada y guardada en Airtable (CotizacionesGG)')
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
      console.error('Error guardando cotización en Airtable:', error)
      alert('❌ No se pudo guardar la cotización en Airtable: ' + (error?.message || 'Error desconocido'))
    } finally {
      setSavingQuote(false)
      setPendingSubmitAfterContact(false)
    }
  }

  // Función para agregar alojamiento a la cotización
  const handleAddAccommodation = (hotel: any, checkIn: string, checkOut: string, adults: number, children: number, rooms: number) => {
    if (!checkIn || !checkOut) {
      alert('Por favor selecciona las fechas de check-in y check-out')
      return
    }
    
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
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
    if (!date) {
      alert('Por favor selecciona una fecha para el tour')
      return
    }
    
    if (people <= 0) {
      alert('Por favor indica el número de personas')
      return
    }
    
    // 🆕 Validar horario si el tour tiene horarios específicos
    const selectedSchedule = selectedSchedules[tour.id]
    if (tour.horarios && tour.horarios.length > 0 && !selectedSchedule) {
      alert('⚠️ Por favor selecciona un horario disponible para este tour')
      return
    }
    
    // Usar la función de cálculo que maneja Jetski especialmente
    const total = calculateTourPrice(tour, people)
    const pricePerPerson = tour.precioPerPerson || 0
    
    const newTour = {
      id: Date.now().toString(),
      tourId: tour.id,
      tourName: tour.nombre,
      description: tour.descripcion,
      date: new Date(date),
      duration: tour.duracion || 'N/D',
      quantity: people,
      pricePerPerson: pricePerPerson,
      total: total,
      partnerConfirmed: false,
      included: tour.incluye || [],
      schedule: selectedSchedule || '', // 🆕 Guardar horario seleccionado
      diasOperacion: tour.diasOperacion || '' // 🆕 Info de días de operación
    }
    
    setMockQuotation({
      ...mockQuotation,
      tours: [...mockQuotation.tours, newTour],
      total: mockQuotation.total + total
    })
    
    // Limpiar el horario seleccionado después de agregar
    const updatedSchedules = { ...selectedSchedules }
    delete updatedSchedules[tour.id]
    setSelectedSchedules(updatedSchedules)
    
    alert(`✓ ${tour.nombre} agregado a la cotización${selectedSchedule ? ` (${selectedSchedule})` : ''}`)
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
      date: new Date(date),
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userInitials={isAuthenticated ? "MA" : "AG"}
        userName={isAuthenticated ? "Mi Agencia" : "Mi Agencia"}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
        isAuthenticated={isAuthenticated}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginAgency={handleLoginAgency}
      />

      <div style={styles.container}>
        <div style={styles.mainContent}>
          <h1 style={styles.title}>
            {activeTab === 'accommodations' && '🏨 Alojamientos'}
            {activeTab === 'tours' && '🎫 Tours'}
            {activeTab === 'transports' && '🚕 Traslados'}
          </h1>

          <div style={styles.section}>
            {activeTab === 'accommodations' && (
              <div>
                {/* 🆕 Filtro general por fechas y pasajeros */}
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
                    ((filterAdults + filterChildren + filterBabies) <= 0 || (h.capacidad || 0) >= (filterAdults + filterChildren + filterBabies))
                  ).length > 0 ? (
                  <div style={styles.grid}>
                    {accommodations
                      .filter(h => (!selectedAccommodationType || h.accommodationType === selectedAccommodationType) && ((filterAdults + filterChildren + filterBabies) <= 0 || (h.capacidad || 0) >= (filterAdults + filterChildren + filterBabies)))
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
                              backgroundColor: '#f0f0f0'
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
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/2FA9B8/FFFFFF?text=Hotel'
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
                                      position: 'relative'
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
                        
                        <button 
                          style={styles.btn}
                          onClick={() => {
                            if (!filterCheckIn || !filterCheckOut) {
                              alert('Por favor selecciona las fechas de check-in y check-out en los filtros superiores')
                              return
                            }
                            if (filterAdults + filterChildren + filterBabies === 0) {
                              alert('Por favor indica el número de pasajeros en los filtros superiores')
                              return
                            }
                            const rooms = 1 // Por defecto 1 habitación
                            handleAddAccommodation(hotel, filterCheckIn, filterCheckOut, filterAdults, filterChildren, rooms)
                          }}
                        >
                          ➕ Agregar a Cotización
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
            )}

            {activeTab === 'tours' && (
              <div>
                {/* 🆕 Filtro general por fecha y pasajeros */}
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
                              backgroundColor: '#f0f0f0'
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
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/FF6600/FFFFFF?text=Tour'
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
                                      position: 'relative'
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

                        {/* 🆕 Selector de cantidad de participantes */}
                        <div style={{
                          ...styles.formGroup,
                          backgroundColor: '#f0f9ff',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          marginBottom: '0.75rem'
                        }}>
                          <label style={{ 
                            fontSize: '0.85rem', 
                            color: '#555', 
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            👥 Cantidad de participantes:
                          </label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <button
                              onClick={() => {
                                const newVal = Math.max(1, tourFilterPassengers - 1)
                                setTourFilterPassengers(newVal)
                              }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                border: '1px solid #bfdbfe',
                                backgroundColor: '#f0f9ff',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={tourFilterPassengers}
                              onChange={(e) => setTourFilterPassengers(Math.max(1, parseInt(e.target.value) || 1))}
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
                              onClick={() => {
                                const max = tour.capacidad || 100
                                const newVal = Math.min(max, tourFilterPassengers + 1)
                                setTourFilterPassengers(newVal)
                              }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                border: '1px solid #bfdbfe',
                                backgroundColor: '#f0f9ff',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                          </div>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            margin: '0.5rem 0 0 0'
                          }}>
                            Capacidad máxima: {tour.capacidad || 'Ilimitado'} personas
                          </p>
                        </div>
                        
                        <button 
                          style={{
                            ...styles.btn,
                            opacity: (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) ? 0.5 : 1,
                            cursor: (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) ? 'not-allowed' : 'pointer'
                          }}
                          disabled={tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]}
                          onClick={() => {
                            if (!tourFilterDate) {
                              alert('Por favor selecciona una fecha para el tour en los filtros superiores')
                              return
                            }
                            if (tourFilterPassengers <= 0) {
                              alert('Por favor indica el número de pasajeros')
                              return
                            }
                            if (tour.horarios && tour.horarios.length > 0 && !selectedSchedules[tour.id]) {
                              alert('⚠️ Por favor selecciona un horario disponible para este tour')
                              return
                            }
                            handleAddTour(tour, tourFilterDate, tourFilterPassengers)
                          }}
                        >
                          ➕ Agregar a Cotización
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
            )}

            {activeTab === 'transports' && (
              <div>
                {/* 🆕 Mapa de Zonas con tarifas */}
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
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250/2FA9B8/FFFFFF?text=Transporte'
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.card}>
                    <p>No hay transportes disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 Resumen de cotización en la parte inferior */}
      <div style={styles.bottomSummary}>
        <QuotationSummary
          quotation={mockQuotation}
          onConfirmClick={handleConfirmClick}
          onClearClick={handleClearClick}
          onPreviewClick={handlePreviewClick}
          onItineraryClick={() => setShowItinerary(true)}
          disabled={savingQuote}
        />
      </div>

      {/* 🆕 Modal de Información de Contacto */}
      {showContactForm && (
        <ContactInfoModal
          onSubmit={handleContactInfoSubmit}
          onClose={() => setShowContactForm(false)}
          submitLabel={pendingSubmitAfterContact ? 'Enviar Cotización' : 'Descargar Cotización'}
        />
      )}

      {/* Modal de vista previa */}
      {showPreview && mockQuotation && (
        <QuotationPreview
          quotation={mockQuotation}
          clientContact={clientContact}
          onClose={handleClosePreview}
        />
      )}
      
      {/* 🆕 Modal de Itinerario */}
      {showItinerary && mockQuotation && filterCheckIn && filterCheckOut && (
        <div style={styles.modalOverlay} onClick={() => setShowItinerary(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowItinerary(false)}
              style={styles.closeButton}
            >
              ✕
            </button>
            <ItineraryView
              startDate={new Date(filterCheckIn)}
              endDate={new Date(filterCheckOut)}
              accommodations={mockQuotation.accommodations}
              tours={mockQuotation.tours}
              transports={mockQuotation.transports}
            />
          </div>
        </div>
      )}
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
    backgroundColor: 'white',
    padding: 'var(--spacing-lg)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.2s ease',
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
