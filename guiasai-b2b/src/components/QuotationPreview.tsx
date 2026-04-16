import React, { useState } from 'react'
import { Quotation } from '@/types/quotation'
import { FileText, X, Download } from 'lucide-react'
import { ItineraryView } from './ItineraryView'
import ReservationTimeline from './ReservationTimeline'

interface QuotationPreviewProps {
  quotation: Quotation
  clientContact: { name: string; phone: string; email: string } | null
  onClose: () => void
  onSave?: () => Promise<void>
}

function toISO(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toISOString().split('T')[0]
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  clientContact,
  onClose,
  onSave,
}) => {
  const [copied, setCopied] = useState(false)

  // Construye la URL de propuesta usando fechas/pax del primer alojamiento
  const buildPropuestaUrl = () => {
    const base = window.location.origin + (import.meta.env.BASE_URL || '/') + 'propuesta'
    const acc = quotation.accommodations[0]
    const params = new URLSearchParams()
    if (acc) {
      params.set('llegada', toISO(acc.checkIn))
      params.set('salida', toISO(acc.checkOut))
      const adultos = acc.adultos > 0 ? acc.adultos : (quotation.accommodations.reduce((s, a) => s + (a.adultos || 0), 0) || 2)
      const ninos = quotation.accommodations.reduce((s, a) => s + (a.ninos || 0), 0)
      params.set('adultos', String(adultos))
      params.set('ninos', String(ninos))
    }
    params.set('wa', '573153836043')
    params.set('agente', 'GuiaSAI')
    return `${base}?${params.toString()}`
  }

  const handleCopyPropuesta = () => {
    navigator.clipboard.writeText(buildPropuestaUrl()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handlePrint = async () => {
    if (onSave) {
      await onSave()
    }
    window.print()
  }

  // Calcular rango de fechas para el itinerario
  const getDateRange = () => {
    const timestamps: number[] = []
    
    quotation.accommodations.forEach(acc => {
      if (acc.checkIn) timestamps.push(new Date(acc.checkIn).getTime())
      if (acc.checkOut) timestamps.push(new Date(acc.checkOut).getTime())
    })
    
    quotation.tours.forEach(tour => {
      if (tour.date) timestamps.push(new Date(tour.date).getTime())
    })
    
    quotation.transports.forEach(trans => {
      if (trans.date) timestamps.push(new Date(trans.date).getTime())
    })

    if (timestamps.length === 0) {
      return { start: new Date(), end: new Date() }
    }

    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps))
    }
  }

  const { start, end } = getDateRange()

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header con botones */}
        <div style={styles.header}>
          <h2 style={styles.modalTitle}>
            <FileText size={24} />
            Vista Previa de Cotización
          </h2>
          <div style={styles.headerButtons}>
            <button onClick={handlePrint} style={styles.printButton}>
              <Download size={18} />
              Descargar PDF
            </button>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido del PDF */}
        <div style={styles.pdfContent} id="quotation-pdf">
          {/* Encabezado de la cotización */}
          <div style={styles.pdfHeader}>
            <div style={styles.brandSection}>
              <img 
                src="https://guiasanandresislas.com/wp-content/uploads/2025/02/Logo-GuiaSAI-avisoa.png" 
                alt="GuiaSAI" 
                style={styles.logoImage}
              />
              <p style={styles.brandTagline}>Tu Agencia de Viajes</p>
            </div>
            <div style={styles.quotationInfo}>
              <h3 style={styles.quotationId}>Cotización #{quotation.id}</h3>
              <p style={styles.date}>{new Date().toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>

          {/* 🆕 Información del Cliente */}
          {clientContact && (
            <div style={{...styles.section, backgroundColor: '#FFF7ED', borderLeft: '4px solid var(--guiasai-primary)', marginBottom: '24px'}}>
              <h4 style={{margin: '0 0 12px 0', color: 'var(--guiasai-primary)', fontWeight: 600}}>Información de Contacto</h4>
              <p style={{margin: '6px 0', fontSize: '0.95rem'}}><strong>Nombre:</strong> {clientContact.name}</p>
              <p style={{margin: '6px 0', fontSize: '0.95rem'}}><strong>Teléfono:</strong> {clientContact.phone}</p>
              <p style={{margin: '6px 0', fontSize: '0.95rem'}}><strong>Email:</strong> {clientContact.email}</p>
            </div>
          )}

          {/* Alojamientos */}
          {quotation.accommodations.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🏨 Alojamientos</h3>
              {quotation.accommodations.map((acc) => (
                <div key={acc.id} style={styles.item}>
                  <div style={styles.itemHeader}>
                    <h4 style={styles.itemName}>{acc.hotelName}</h4>
                    <span style={styles.itemTotal}>
                      ${acc.total.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div style={styles.itemDetails}>
                    <p><strong>Categoría:</strong> {acc.categoria || acc.roomType}</p>
                    {acc.capacidad > 0 && (
                      <p><strong>Capacidad máxima:</strong> {acc.capacidad} persona(s)</p>
                    )}
                    <p><strong>Check-in:</strong> {acc.checkIn.toLocaleDateString('es-CO')}</p>
                    <p><strong>Check-out:</strong> {acc.checkOut.toLocaleDateString('es-CO')}</p>
                    <p><strong>Noches:</strong> {acc.nights}</p>
                    <p><strong>Cantidad:</strong> {acc.quantity} habitación(es)</p>
                    <p><strong>Precio por noche:</strong> ${acc.pricePerNight.toLocaleString('es-CO')} COP</p>
                  </div>
                  {acc.partnerConfirmed && (
                    <span style={styles.confirmedBadge}>✓ Confirmado por el socio</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 🔗 Enlace propuesta para cliente */}
          {quotation.accommodations.length > 0 && (
            <div style={{
              margin: '0 0 24px 0', padding: '16px 20px',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              borderRadius: '10px', border: '1px solid #FED7AA',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#c2410c', marginBottom: '3px' }}>
                    📸 Enviar opciones de alojamiento al cliente
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
                    Página con fotos, amenidades y precios — el cliente puede decir "Me interesa" por WhatsApp
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={handleCopyPropuesta}
                    style={{
                      padding: '8px 16px', background: copied ? '#16a34a' : '#FF6600',
                      color: '#fff', border: 'none', borderRadius: '6px',
                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {copied ? '✓ Copiado!' : '📋 Copiar link'}
                  </button>
                  <a
                    href={buildPropuestaUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px', background: '#2FA9B8',
                      color: '#fff', borderRadius: '6px',
                      fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center',
                    }}
                  >
                    👁 Ver
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Calendario visual de alojamientos */}
          {quotation.accommodations.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📅 Calendario de Alojamientos</h3>
              <ReservationTimeline
                reservations={quotation.accommodations.map((acc, index) => {
                  const colors: Array<'green' | 'yellow' | 'pink' | 'blue'> = ['green', 'blue', 'yellow', 'pink']
                  return {
                    id: acc.id,
                    propertyName: acc.hotelName,
                    checkIn: acc.checkIn instanceof Date ? acc.checkIn : new Date(acc.checkIn),
                    checkOut: acc.checkOut instanceof Date ? acc.checkOut : new Date(acc.checkOut),
                    nights: acc.nights,
                    guests: (acc.adultos || (acc as any).adults || 0) + (acc.ninos || (acc as any).children || 0),
                    pricePerNight: acc.pricePerNight,
                    totalPrice: acc.total,
                    color: colors[index % colors.length],
                  }
                })}
              />
            </div>
          )}

          {/* Tours */}
          {quotation.tours.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🎫 Tours y Experiencias</h3>
              {quotation.tours.map((tour) => (
                <div key={tour.id} style={styles.item}>
                  <div style={styles.itemHeader}>
                    <h4 style={styles.itemName}>{tour.tourName}</h4>
                    <span style={styles.itemTotal}>
                      ${tour.total.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div style={styles.itemDetails}>
                    <p><strong>Fecha:</strong> {tour.date.toLocaleDateString('es-CO')}</p>
                    {tour.schedule && (
                      <p><strong>🕐 Horario:</strong> {tour.schedule}</p>
                    )}
                    <p><strong>Duración:</strong> {tour.duration}</p>
                    <p><strong>Cantidad:</strong> {tour.quantity} persona(s)</p>
                    <p><strong>Precio por persona:</strong> ${tour.pricePerPerson.toLocaleString('es-CO')} COP</p>
                    {tour.included && tour.included.length > 0 && (
                      <p><strong>Incluye:</strong> {tour.included.join(', ')}</p>
                    )}
                  </div>
                  {tour.partnerConfirmed ? (
                    <span style={styles.confirmedBadge}>✓ Confirmado por el socio</span>
                  ) : (
                    <span style={styles.pendingBadge}>⏱ Pendiente de confirmación</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Transportes */}
          {quotation.transports.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🚕 Transportes</h3>
              {quotation.transports.map((transport) => (
                <div key={transport.id} style={styles.item}>
                  <div style={styles.itemHeader}>
                    <h4 style={styles.itemName}>{transport.transportType}</h4>
                    <span style={styles.itemTotal}>
                      ${transport.total.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div style={styles.itemDetails}>
                    <p><strong>Origen:</strong> {transport.origin}</p>
                    <p><strong>Destino:</strong> {transport.destination}</p>
                    <p><strong>Fecha:</strong> {transport.date.toLocaleDateString('es-CO')}</p>
                    <p><strong>Hora:</strong> {transport.time}</p>
                    <p><strong>Tipo de vehículo:</strong> {transport.vehicleType}</p>
                    <p><strong>Cantidad:</strong> {transport.quantity} vehículo(s)</p>
                    <p><strong>Precio por vehículo:</strong> ${transport.pricePerVehicle.toLocaleString('es-CO')} COP</p>
                  </div>
                  {transport.partnerConfirmed && (
                    <span style={styles.confirmedBadge}>✓ Confirmado por el socio</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 🆕 SECCIÓN DE ITINERARIO INTEGRADA */}
          <div style={styles.section}>
            <hr style={styles.divider} />
            <ItineraryView 
              startDate={start}
              endDate={end}
              accommodations={quotation.accommodations}
              tours={quotation.tours}
              transports={quotation.transports}
              embedded={true}
            />
          </div>

          {/* Total */}
          <div style={styles.totalSection}>
            <hr style={styles.divider} />
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>TOTAL DE LA COTIZACIÓN</span>
              <span style={styles.totalAmount}>
                ${quotation.total.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Esta cotización tiene una validez de 7 días a partir de su emisión.
            </p>
            <p style={styles.footerText}>
              Para más información, contáctanos a través de nuestros canales oficiales.
            </p>
            <p style={styles.footerContact}>
              <strong>GuiaSAI</strong> | Comercial@guiasai.com | +57 3153836043 | RNT: 48674
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '2px solid var(--guiasai-border)',
    backgroundColor: 'var(--guiasai-bg-light)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  printButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'var(--guiasai-secondary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: 'transparent',
    color: 'var(--guiasai-text-dark)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pdfContent: {
    flex: 1,
    overflow: 'auto',
    padding: '32px',
    backgroundColor: 'white',
  },
  pdfHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  brandSection: {
    flex: 1,
  },
  logoImage: {
    maxWidth: '200px',
    height: 'auto',
    marginBottom: '8px',
  },
  brandTagline: {
    margin: '4px 0 0 0',
    fontSize: '0.95rem',
    color: 'var(--guiasai-text-light)',
  },
  quotationInfo: {
    textAlign: 'right' as const,
  },
  quotationId: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  date: {
    margin: '4px 0 0 0',
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-light)',
  },
  divider: {
    border: 'none',
    borderTop: '2px solid var(--guiasai-border)',
    margin: '24px 0',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  item: {
    padding: '20px',
    backgroundColor: 'var(--guiasai-bg-light)',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid var(--guiasai-border)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  itemName: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
    fontFamily: "'Poppins', sans-serif",
  },
  itemTotal: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  itemDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '8px',
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-dark)',
  },
  confirmedBadge: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '6px 12px',
    backgroundColor: 'var(--guiasai-success)',
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  pendingBadge: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '6px 12px',
    backgroundColor: 'var(--guiasai-warning)',
    color: 'var(--guiasai-text-dark)',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  totalSection: {
    marginTop: '32px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'var(--guiasai-primary)',
    borderRadius: '8px',
  },
  totalLabel: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'white',
    fontFamily: "'Poppins', sans-serif",
  },
  totalAmount: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'white',
    fontFamily: "'Poppins', sans-serif",
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid var(--guiasai-border)',
    textAlign: 'center' as const,
  },
  footerText: {
    margin: '8px 0',
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-light)',
  },
  footerContact: {
    margin: '16px 0 0 0',
    fontSize: '0.875rem',
    color: 'var(--guiasai-text-dark)',
  },
}
