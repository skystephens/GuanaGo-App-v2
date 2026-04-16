// ReservationTimeline.tsx
// Componente para mostrar timeline visual de reservas de alojamiento
// Muestra check-in (3pm), noches completas, check-out (12pm) con barras diagonales

import './ReservationTimeline.css';

interface Reservation {
  id: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  pricePerNight: number;
  totalPrice: number;
  color?: 'green' | 'yellow' | 'pink' | 'blue';
}

interface ReservationTimelineProps {
  reservations: Reservation[];
  startDate?: Date;
  endDate?: Date;
}

export default function ReservationTimeline({ 
  reservations, 
  startDate, 
  endDate 
}: ReservationTimelineProps) {
  
  // Determinar rango de fechas del viaje completo
  const tripStart = startDate || new Date(Math.min(...reservations.map(r => r.checkIn.getTime())));
  const tripEnd = endDate || new Date(Math.max(...reservations.map(r => r.checkOut.getTime())));
  
  // Generar array de días del viaje
  const days = generateDaysArray(tripStart, tripEnd);
  
  // Generar array de meses visibles
  const months = generateMonthsArray(tripStart, tripEnd);

  return (
    <div className="reservation-timeline">
      {/* Header con selector de mes */}
      <div className="timeline-header">
        <div className="month-selector">
          <button className="month-nav prev">←</button>
          <div className="month-display">
            {months.map((month, idx) => (
              <span key={idx} className={idx === 0 ? 'active' : ''}>
                {month}
              </span>
            ))}
          </div>
          <button className="month-nav next">→</button>
        </div>
      </div>

      {/* Propiedades + Timeline Grid */}
      <div className="timeline-content">
        
        {/* Columna izquierda: Lista de propiedades */}
        <div className="properties-column">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="property-row">
              <div className="property-info">
                <h4>{reservation.propertyName}</h4>
                <div className="property-meta">
                  <span className="guests">👥 {reservation.guests}</span>
                  <div className="occupancy-dots">
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="timeline-grid">
          
          {/* Header de días */}
          <div className="days-header">
            {days.map((day, idx) => (
              <div key={idx} className="day-header">
                <span className="weekday">{day.weekday}</span>
                <span className="day-number">{day.number}</span>
              </div>
            ))}
          </div>

          {/* Filas de reservas */}
          {reservations.map((reservation) => (
            <div key={reservation.id} className="timeline-row">
              <TimelineBar 
                reservation={reservation}
                tripStart={tripStart}
                tripEnd={tripEnd}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-shape diagonal-start"></div>
          <span>Check-in (3:00 PM)</span>
        </div>
        <div className="legend-item">
          <div className="legend-shape full-day"></div>
          <span>Noche completa</span>
        </div>
        <div className="legend-item">
          <div className="legend-shape diagonal-end"></div>
          <span>Check-out (12:00 PM)</span>
        </div>
      </div>
    </div>
  );
}

// Componente para renderizar la barra de una reserva individual
function TimelineBar({ 
  reservation, 
  tripStart, 
  tripEnd 
}: { 
  reservation: Reservation; 
  tripStart: Date; 
  tripEnd: Date;
}) {
  const totalDays = Math.ceil((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calcular posición de inicio (en días desde tripStart)
  const startOffset = Math.ceil((reservation.checkIn.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Duración en días (contando check-in parcial y check-out parcial)
  const duration = reservation.nights + 1; // +1 porque incluye día de check-out parcial

  const color = reservation.color || 'green';

  return (
    <div className="timeline-bars">
      {Array.from({ length: totalDays }).map((_, dayIndex) => {
        const isInRange = dayIndex >= startOffset && dayIndex < startOffset + duration;
        const isFirstDay = dayIndex === startOffset;
        const isLastDay = dayIndex === startOffset + duration - 1;
        const isMiddleDay = isInRange && !isFirstDay && !isLastDay;

        if (!isInRange) {
          return <div key={dayIndex} className="timeline-cell empty"></div>;
        }

        return (
          <div key={dayIndex} className={`timeline-cell occupied ${color}`}>
            {isFirstDay && (
              <div className="bar diagonal-start" data-time="3:00 PM">
                <div className="dots"></div>
              </div>
            )}
            {isMiddleDay && (
              <div className="bar full-day">
                <div className="dots"></div>
              </div>
            )}
            {isLastDay && (
              <div className="bar diagonal-end" data-time="12:00 PM">
                <div className="dots"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Utilidad: Generar array de días del viaje
function generateDaysArray(start: Date, end: Date) {
  const days = [];
  const current = new Date(start);
  
  while (current <= end) {
    days.push({
      date: new Date(current),
      weekday: current.toLocaleDateString('es', { weekday: 'short' }).substring(0, 3),
      number: current.getDate(),
      month: current.toLocaleDateString('es', { month: 'short' })
    });
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

// Utilidad: Generar array de meses visibles
function generateMonthsArray(start: Date, end: Date) {
  const months = new Set<string>();
  const current = new Date(start);
  
  while (current <= end) {
    months.add(current.toLocaleDateString('es', { month: 'long', year: 'numeric' }));
    current.setMonth(current.getMonth() + 1);
  }
  
  return Array.from(months);
}
