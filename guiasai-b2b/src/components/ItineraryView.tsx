import React from 'react'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

interface ItineraryDay {
  date: Date
  dayNumber: number
  items: ItineraryItem[]
}

interface ItineraryItem {
  id: string
  type: 'arrival' | 'accommodation' | 'tour' | 'transport' | 'departure'
  time?: string
  title: string
  description?: string
  location?: string
  duration?: string
  participants?: number
  price?: number
  notes?: string
}

interface ItineraryViewProps {
  startDate: Date
  endDate: Date
  accommodations: any[]
  tours: any[]
  transports: any[]
}

// Normalizar fecha a string YYYY-MM-DD en zona local (sin conversión UTC)
const normalizeDateToString = (date: any): string => {
  if (!date) return ''
  
  // Si es string ya en formato correcto, devolverlo
  if (typeof date === 'string') {
    // Si ya está en formato YYYY-MM-DD, devolverlo directo
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    // Si tiene hora, extraer solo la fecha
    return date.split('T')[0]
  }
  
  // Si es Date object, extraer fecha local (NO UTC)
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Si es algo más, intentar convertir
  try {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  startDate,
  endDate,
  accommodations,
  tours,
  transports
}) => {
  
  // Generar días del itinerario
  const generateItinerary = (): ItineraryDay[] => {
    const days: ItineraryDay[] = []
    let currentDate = new Date(startDate)
    // Normalizar a medianoche para comparaciones consistentes
    currentDate.setHours(0, 0, 0, 0)
    let dayNumber = 1
    
    let endDateNorm = new Date(endDate)
    endDateNorm.setHours(23, 59, 59, 999)
    
    // 🆕 Expandir rango de fechas si hay servicios fuera del rango
    const allDates: string[] = []
    accommodations.forEach(acc => {
      allDates.push(normalizeDateToString(acc.checkIn))
      allDates.push(normalizeDateToString(acc.checkOut))
    })
    tours.forEach(tour => {
      allDates.push(normalizeDateToString(tour.date))
    })
    transports.forEach(transport => {
      allDates.push(normalizeDateToString(transport.date))
    })
    
    if (allDates.length > 0) {
      const minDate = allDates.filter(d => d).reduce((a, b) => a < b ? a : b, normalizeDateToString(startDate))
      const maxDate = allDates.filter(d => d).reduce((a, b) => a > b ? a : b, normalizeDateToString(endDate))
      
      if (minDate < normalizeDateToString(startDate)) {
        currentDate = new Date(minDate)
        currentDate.setHours(0, 0, 0, 0)
      }
      
      if (maxDate > normalizeDateToString(endDate)) {
        endDateNorm = new Date(maxDate)
        endDateNorm.setHours(23, 59, 59, 999)
      }
    }
    
    while (currentDate <= endDateNorm) {
      const dayItems: ItineraryItem[] = []
      const dateStr = normalizeDateToString(currentDate)
      
      // Agregar check-in de alojamientos
      accommodations.forEach((acc) => {
        const checkInDate = normalizeDateToString(acc.checkIn)
        if (checkInDate === dateStr) {
          dayItems.push({
            id: `acc-checkin-${acc.id}`,
            type: 'accommodation',
            time: acc.horarioCheckIn || '15:00',
            title: `🏨 Check-in - ${acc.hotelName}`,
            description: `${acc.roomType} - ${acc.nights} noche(s)`,
            location: acc.hotelName,
            participants: acc.adults + acc.children,
            price: acc.total
          })
        }
        
        const checkOutDate = normalizeDateToString(acc.checkOut)
        if (checkOutDate === dateStr) {
          dayItems.push({
            id: `acc-checkout-${acc.id}`,
            type: 'accommodation',
            time: acc.horarioCheckOut || '11:00',
            title: `🏨 Check-out - ${acc.hotelName}`,
            description: 'Desocupación de habitación',
            location: acc.hotelName
          })
        }
      })
      
      // Agregar tours
      tours.forEach((tour) => {
        const tourDate = normalizeDateToString(tour.date)
        if (tourDate === dateStr) {
          dayItems.push({
            id: tour.id,
            type: 'tour',
            time: tour.schedule || '09:00',
            title: `🎫 ${tour.tourName}`,
            description: tour.description,
            duration: tour.duration,
            participants: tour.quantity,
            price: tour.total,
            notes: tour.diasOperacion
          })
        }
      })
      
      // Agregar transportes
      transports.forEach((transport) => {
        const transportDate = normalizeDateToString(transport.date)
        if (transportDate === dateStr) {
          dayItems.push({
            id: transport.id,
            type: 'transport',
            time: transport.time || '12:00',
            title: `🚕 ${transport.vehicleType}`,
            description: `${transport.origin} → ${transport.destination}`,
            participants: transport.totalPassengers,
            price: transport.total
          })
        }
      })
      
      // Ordenar items por hora
      dayItems.sort((a, b) => {
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeA.localeCompare(timeB)
      })
      days.push({
        date: new Date(currentDate),
        dayNumber,
        items: dayItems
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
      dayNumber++
    }
    return days
  }
  
  const itinerary = generateItinerary()
  
  const getItemColor = (type: string) => {
    switch (type) {
      case 'accommodation': return '#3b82f6'
      case 'tour': return '#f59e0b'
      case 'transport': return '#8b5cf6'
      default: return '#6b7280'
    }
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📅 Itinerario del Viaje</h2>
        <p style={styles.subtitle}>
          {startDate.toLocaleDateString('es-CO', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })} - {endDate.toLocaleDateString('es-CO', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
      
      <div style={styles.timeline}>
        {itinerary.map((day) => (
          <div key={day.dayNumber} style={styles.day}>
            <div style={styles.dayHeader}>
              <div style={styles.dayBadge}>
                Día {day.dayNumber}
              </div>
              <div style={styles.dayDate}>
                <Calendar size={16} />
                <span>
                  {day.date.toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              </div>
            </div>
            
            {day.items.length > 0 ? (
              <div style={styles.itemsContainer}>
                {day.items.map((item) => (
                  <div 
                    key={item.id} 
                    style={{
                      ...styles.item,
                      borderLeftColor: getItemColor(item.type)
                    }}
                  >
                    <div style={styles.itemTime}>
                      <Clock size={14} />
                      <span>{item.time}</span>
                    </div>
                    
                    <div style={styles.itemContent}>
                      <h4 style={styles.itemTitle}>{item.title}</h4>
                      
                      {item.description && (
                        <p style={styles.itemDescription}>{item.description}</p>
                      )}
                      
                      <div style={styles.itemMeta}>
                        {item.duration && (
                          <span style={styles.metaBadge}>
                            ⏱️ {item.duration}
                          </span>
                        )}
                        {item.participants && (
                          <span style={styles.metaBadge}>
                            <Users size={12} />
                            {item.participants} pax
                          </span>
                        )}
                        {item.location && (
                          <span style={styles.metaBadge}>
                            <MapPin size={12} />
                            {item.location}
                          </span>
                        )}
                      </div>
                      
                      {item.price && (
                        <div style={styles.itemPrice}>
                          ${item.price.toLocaleString('es-CO')} COP
                        </div>
                      )}
                      
                      {item.notes && (
                        <div style={styles.itemNotes}>
                          ℹ️ {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyDay}>
                <p>Día libre</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    marginBottom: '2rem',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '1rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FF6600',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '0.95rem',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  day: {
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e5e5e5',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  dayBadge: {
    backgroundColor: '#FF6600',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  dayDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#444',
    fontSize: '0.95rem',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  item: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '1rem',
    borderLeft: '4px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '1rem',
  },
  itemTime: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.25rem',
    color: '#666',
    fontSize: '0.875rem',
    fontWeight: '600',
    minWidth: '60px',
    paddingTop: '2px',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#222',
  },
  itemDescription: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.875rem',
    color: '#666',
    lineHeight: '1.4',
  },
  itemMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  metaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#555',
  },
  itemPrice: {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: '0.5rem',
  },
  itemNotes: {
    fontSize: '0.75rem',
    color: '#666',
    backgroundColor: '#fff7ed',
    padding: '0.5rem',
    borderRadius: '4px',
    marginTop: '0.5rem',
    borderLeft: '2px solid #f59e0b',
  },
  emptyDay: {
    padding: '1rem',
    textAlign: 'center' as const,
    color: '#999',
    fontStyle: 'italic' as const,
  },
}
