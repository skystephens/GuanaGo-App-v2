import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getServiceBySlug, calculateTourPrice } from '../../services/airtableService'
import { useQuotationStore } from '../../stores/quotationStore'
import './ServiceMicrosite.css'

const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E" +
  "%3Crect width='600' height='400' fill='%23e8f4f8'/%3E" +
  "%3Cpath d='M0 280 Q150 220 300 260 Q450 300 600 250 L600 400 L0 400Z' fill='%232FA9B8' opacity='0.6'/%3E" +
  "%3Cpath d='M0 320 Q150 290 300 310 Q450 330 600 300 L600 400 L0 400Z' fill='%232FA9B8' opacity='0.8'/%3E" +
  "%3Ccircle cx='480' cy='120' r='55' fill='%23FFD166' opacity='0.8'/%3E" +
  "%3Cpath d='M260 260 L270 180 Q280 120 300 100 Q320 120 330 180 L340 260Z' fill='%2334a853' opacity='0.7'/%3E" +
  "%3Cellipse cx='300' cy='100' rx='45' ry='30' fill='%2334a853' opacity='0.8'/%3E" +
  "%3Ctext x='300' y='355' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' fill='%23546e7a' opacity='0.8'%3ESan Andr%C3%A9s Isla%3C/text%3E" +
  "%3C/svg%3E"
const HelmetTag = Helmet as any

export const ServiceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showFullGallery, setShowFullGallery] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<string>('')
  const [passengers, setPassengers] = useState<number>(2)
  const [bookingDate, setBookingDate] = useState<string>('')
  const [addedToQuotation, setAddedToQuotation] = useState(false)

  const { addTour, mockQuotation } = useQuotationStore()

  useEffect(() => {
    // Si el servicio viene en el state de la navegacion, usarlo directamente
    const stateService = (location.state as any)?.service
    if (stateService) {
      setService(stateService)
      setLoading(false)
      return
    }

    // Fallback: buscar por slug en Airtable
    const loadService = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const data = await getServiceBySlug(slug)
        if (data) {
          setService(data)
        } else {
          setError('Servicio no encontrado')
        }
      } catch (err) {
        console.error('Error cargando servicio:', err)
        setError('Error cargando el servicio')
      } finally {
        setLoading(false)
      }
    }
    loadService()
  }, [slug, location.state])

  if (loading) {
    return (
      <div className="microsite-loading">
        <div className="loading-spinner" />
        <p>Cargando experiencia...</p>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="microsite-error">
        <h2>Servicio no encontrado</h2>
        <p>{error || 'No pudimos encontrar este servicio.'}</p>
        <button onClick={() => navigate('/')} className="btn-back">
          Volver al inicio
        </button>
      </div>
    )
  }

  const images = service.images?.length > 0 ? service.images : [FALLBACK_SVG]
  const incluye = service.incluye || []

  return (
    <>
      <HelmetTag>
        <title>{service.nombre} | GuiaSAI - San Andres Isla</title>
        <meta name="description" content={service.descripcion?.substring(0, 160)} />
        <meta property="og:title" content={`${service.nombre} | GuiaSAI`} />
        <meta property="og:description" content={service.descripcion?.substring(0, 160)} />
        <meta property="og:image" content={images[0]} />
      </HelmetTag>

      <div className="microsite-wrapper">
        {/* Header / Navigation */}
        <header className="microsite-header">
          <button onClick={() => navigate('/')} className="btn-back-nav">
            &larr; Volver a servicios
          </button>
          <div className="header-brand">
            <span className="brand-text">GuiaSAI</span>
            <span className="brand-badge">Business Hub</span>
          </div>
        </header>

        {/* Hero con galeria */}
        <section className="microsite-hero">
          <div className="hero-gallery">
            <div className="gallery-main">
              <img
                src={images[activeImageIndex] || FALLBACK_SVG}
                alt={service.nombre}
                className="gallery-main-img"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  const tried = parseInt(img.dataset.tried || '0') + 1
                  img.dataset.tried = String(tried)
                  const next = images[tried]
                  if (next && next !== img.src) {
                    img.src = next
                  } else {
                    img.onerror = null
                    img.src = FALLBACK_SVG
                  }
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    className="gallery-nav gallery-prev"
                    onClick={() => setActiveImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                  >
                    &#8249;
                  </button>
                  <button
                    className="gallery-nav gallery-next"
                    onClick={() => setActiveImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                  >
                    &#8250;
                  </button>
                </>
              )}
              <div className="gallery-counter">
                {activeImageIndex + 1} / {images.length}
              </div>
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.slice(0, 6).map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className={`thumb ${idx === activeImageIndex ? 'thumb-active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img
                      src={img}
                      alt={`${service.nombre} ${idx + 1}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_SVG }}
                    />
                    {idx === 5 && images.length > 6 && (
                      <div className="thumb-overlay" onClick={() => setShowFullGallery(true)}>
                        +{images.length - 6}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-info">
            <div className="hero-badges">
              {service.destacado && <span className="badge badge-featured">Destacado</span>}
              {service.categoriaServicio?.length > 0 && (
                <span className="badge badge-category">{service.categoriaServicio[0]}</span>
              )}
              <span className="badge badge-authentic">Autentico SAI</span>
            </div>
            <h1 className="microsite-title">{service.nombre}</h1>
            {service.operador && (
              <p className="operator-info">Por: <strong>{service.operador}</strong></p>
            )}
            {service.ubicacion && (
              <p className="location-info">{service.ubicacion}</p>
            )}
          </div>
        </section>

        {/* Content + Sidebar */}
        <div className="microsite-content">
          <main className="content-main">
            {/* Descripcion */}
            <section className="content-section">
              <h2>Sobre esta experiencia</h2>
              <div className="description-text">
                {service.descripcion?.split('\n').map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                )) || <p>Informacion no disponible</p>}
              </div>
            </section>

            {/* Que incluye */}
            {incluye.length > 0 && (
              <section className="content-section">
                <h2>Que incluye</h2>
                <ul className="includes-list">
                  {incluye.map((item: string, idx: number) => (
                    <li key={idx}>
                      <span className="include-icon">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerario */}
            {service.itinerario && (
              <section className="content-section">
                <h2>Itinerario</h2>
                <div className="itinerary-text">
                  {service.itinerario.split('\n').map((line: string, idx: number) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Logistica */}
            <section className="content-section">
              <h2>Logistica</h2>
              <div className="logistics-grid">
                {service.duracion && (
                  <div className="logistics-item">
                    <span className="logistics-icon">&#9201;</span>
                    <div>
                      <strong>Duracion</strong>
                      <p>{service.duracion}</p>
                    </div>
                  </div>
                )}
                {service.puntoEncuentro && (
                  <div className="logistics-item">
                    <span className="logistics-icon">&#128205;</span>
                    <div>
                      <strong>Punto de encuentro</strong>
                      <p>{service.puntoEncuentro}</p>
                    </div>
                  </div>
                )}
                {service.diasOperacion && (
                  <div className="logistics-item">
                    <span className="logistics-icon">&#128197;</span>
                    <div>
                      <strong>Horarios</strong>
                      <p>{service.diasOperacion}</p>
                    </div>
                  </div>
                )}
                {service.capacidad && (
                  <div className="logistics-item">
                    <span className="logistics-icon">&#128101;</span>
                    <div>
                      <strong>Capacidad</strong>
                      <p>Hasta {service.capacidad} personas</p>
                    </div>
                  </div>
                )}
                {service.dificultad && (
                  <div className="logistics-item">
                    <span className="logistics-icon">&#9889;</span>
                    <div>
                      <strong>Dificultad</strong>
                      <p>{service.dificultad}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Politicas */}
            {service.politicasCancelacion && (
              <section className="content-section">
                <h2>Politicas de cancelacion</h2>
                <div className="policies-text">
                  {service.politicasCancelacion.split('\n').map((line: string, idx: number) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Garantia */}
            <section className="content-section guarantee-section">
              <div className="guarantee-card">
                <div className="guarantee-icon">&#128170;</div>
                <div>
                  <h3>Garantia GuiaSAI</h3>
                  <p>
                    Todos nuestros servicios cuentan con soporte 24/7 en la isla,
                    operadores verificados y respaldo total en caso de incidencias.
                    Tu satisfaccion es nuestra prioridad.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar - Widget de reserva */}
          <aside className="content-sidebar">
            <div className="booking-widget">
              <div className="booking-price">
                <span className="price-amount">
                  ${(service ? calculateTourPrice(service, passengers) : 0).toLocaleString('es-CO')}
                </span>
                <span className="price-unit">
                  COP / {passengers} {passengers === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              {/* Selector de horario interactivo */}
              {service.horarios && service.horarios.length > 0 && (
                <div className="booking-field">
                  <label>Selecciona horario</label>
                  <div className="schedule-options">
                    {service.horarios.map((h: string) => (
                      <button
                        key={h}
                        className={`schedule-chip ${selectedSchedule === h ? 'schedule-chip-active' : ''}`}
                        onClick={() => setSelectedSchedule(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  {selectedSchedule && (
                    <p className="schedule-confirmation">
                      &#10003; Horario {selectedSchedule} seleccionado
                    </p>
                  )}
                </div>
              )}

              {/* Selector de pasajeros */}
              <div className="booking-field">
                <label>Numero de pasajeros</label>
                <div className="passenger-selector">
                  <button
                    className="passenger-btn"
                    onClick={() => setPassengers(p => Math.max(1, p - 1))}
                  >
                    &#8722;
                  </button>
                  <span className="passenger-count">{passengers}</span>
                  <button
                    className="passenger-btn"
                    onClick={() => setPassengers(p => Math.min(service.capacidad || 100, p + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selector de fecha */}
              <div className="booking-field">
                <label>Fecha del tour</label>
                <input
                  type="date"
                  className="booking-date-input"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Boton agregar a cotizacion */}
              <button
                className={`btn-reserve ${
                  (service.horarios?.length > 0 && !selectedSchedule) ? 'btn-reserve-disabled' : ''
                }`}
                disabled={service.horarios?.length > 0 && !selectedSchedule}
                onClick={() => {
                  const success = addTour(service, bookingDate, passengers, selectedSchedule || undefined)
                  if (success) {
                    setAddedToQuotation(true)
                    setSelectedSchedule('')
                    setTimeout(() => setAddedToQuotation(false), 3000)
                  }
                }}
              >
                {addedToQuotation ? '&#10003; Agregado!' : 'Agregar a Cotizacion'}
              </button>

              {/* Mensaje de exito */}
              {addedToQuotation && (
                <div className="booking-success">
                  Servicio agregado. Tienes {mockQuotation.tours.length} tour(s) en tu cotizacion.
                  <button
                    className="btn-go-quotation"
                    onClick={() => navigate('/')}
                  >
                    Ver cotizacion completa
                  </button>
                </div>
              )}

              <p className="booking-note">
                Agrega este servicio a tu cotizacion y recibe confirmacion en menos de 24 horas.
              </p>

              {/* Info de contacto del operador */}
              {(service.telefono || service.email) && (
                <div className="operator-contact">
                  <h4>Contacto directo</h4>
                  {service.telefono && <p>Tel: {service.telefono}</p>}
                  {service.email && <p>Email: {service.email}</p>}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer del microsite */}
        <footer className="microsite-footer">
          <p>GuiaSAI Business Hub - Conectando agencias con el alma raizal de San Andres</p>
        </footer>
      </div>

      {/* Modal de galeria completa */}
      {showFullGallery && (
        <div className="gallery-modal-overlay" onClick={() => setShowFullGallery(false)}>
          <div className="gallery-modal" onClick={e => e.stopPropagation()}>
            <button className="gallery-modal-close" onClick={() => setShowFullGallery(false)}>
              &times;
            </button>
            <div className="gallery-modal-grid">
              {images.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${service.nombre} ${idx + 1}`}
                  className="gallery-modal-img"
                  onClick={() => {
                    setActiveImageIndex(idx)
                    setShowFullGallery(false)
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_SVG }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ServiceDetail
