// Ejemplo de uso del componente ReservationTimeline
// Para mostrar en vista previa de cotización

import ReservationTimeline from '../components/ReservationTimeline';

export default function QuoteSummary() {
  
  // Datos de ejemplo basados en tus screenshots
  const reservations = [
    {
      id: 'res-1',
      propertyName: 'Habitación Soleada',
      checkIn: new Date('2026-03-07'),
      checkOut: new Date('2026-03-19'),
      nights: 12,
      guests: 2,
      pricePerNight: 800000,
      totalPrice: 9600000,
      color: 'green' as const
    },
    {
      id: 'res-2',
      propertyName: 'Habitación Marina',
      checkIn: new Date('2026-03-19'),
      checkOut: new Date('2026-03-22'),
      nights: 3,
      guests: 1,
      pricePerNight: 400000,
      totalPrice: 1200000,
      color: 'pink' as const
    },
    {
      id: 'res-3',
      propertyName: 'Apartamentos S 8 pax',
      checkIn: new Date('2026-01-15'),
      checkOut: new Date('2026-01-18'),
      nights: 3,
      guests: 8,
      pricePerNight: 800000,
      totalPrice: 2400000,
      color: 'green' as const
    },
    {
      id: 'res-4',
      propertyName: 'Apartamentos S Cuádruple',
      checkIn: new Date('2026-01-15'),
      checkOut: new Date('2026-01-18'),
      nights: 3,
      guests: 4,
      pricePerNight: 400000,
      totalPrice: 1200000,
      color: 'yellow' as const
    },
    {
      id: 'res-5',
      propertyName: 'Habitación S Triple',
      checkIn: new Date('2026-01-15'),
      checkOut: new Date('2026-01-18'),
      nights: 3,
      guests: 3,
      pricePerNight: 300000,
      totalPrice: 900000,
      color: 'blue' as const
    }
  ];

  return (
    <div className="quote-summary">
      <h2>Vista Previa de Cotización</h2>
      
      {/* Información de contacto */}
      <div className="contact-info">
        <h3>Información de Contacto</h3>
        <p><strong>Nombre:</strong> daniel</p>
        <p><strong>Teléfono:</strong> +573219913553</p>
        <p><strong>Email:</strong> skysk8ing@gmail.com</p>
      </div>

      {/* Timeline visual de alojamientos */}
      <div className="accommodations-section">
        <h3>🏨 Alojamientos</h3>
        <ReservationTimeline 
          reservations={reservations}
          startDate={new Date('2026-01-15')}
          endDate={new Date('2026-03-22')}
        />
      </div>

      {/* Itinerario día a día */}
      <div className="itinerary-section">
        <h3>📅 Itinerario del Viaje</h3>
        <p className="itinerary-dates">
          15 de enero de 2026 - 22 de marzo de 2026
        </p>
        
        <DayItinerary 
          day={1}
          date="Miércoles, 15 De Enero"
          activities={[
            {
              time: '15:00',
              type: 'check-in',
              name: 'Apartamentos S 8 pax',
              details: 'Apartamento - 3 noche(s)',
              guests: 8,
              property: 'Apartamentos S 8 pax',
              price: 2400000
            },
            {
              time: '15:00',
              type: 'check-in',
              name: 'Apartamentos S Cuádruple',
              details: 'Apartamento - 3 noche(s)',
              guests: 4,
              property: 'Apartamentos S Cuádruple',
              price: 1200000
            },
            {
              time: '15:00',
              type: 'check-in',
              name: 'Habitación S Triple',
              details: 'habitación - 3 noche(s)',
              guests: 3,
              property: 'Habitación S Triple',
              price: 900000
            }
          ]}
        />

        <DayItinerary 
          day={2}
          date="Viernes, 20 De Marzo"
          activities={[
            {
              time: '',
              type: 'free-day',
              name: 'Día libre',
              details: null,
              guests: null,
              property: null,
              price: null
            }
          ]}
        />

        <DayItinerary 
          day={4}
          date="Domingo, 22 De Marzo"
          activities={[
            {
              time: '11:00',
              type: 'check-out',
              name: 'Apartamentos S 8 pax',
              details: 'Desocupación de habitación',
              guests: null,
              property: 'Apartamentos S 8 pax',
              price: null
            },
            {
              time: '11:00',
              type: 'check-out',
              name: 'Apartamentos S Cuádruple',
              details: 'Desocupación de habitación',
              guests: null,
              property: 'Apartamentos S Cuádruple',
              price: null
            }
          ]}
        />
      </div>

      {/* Botón de descarga */}
      <button className="btn-download-pdf">
        📥 Descargar PDF
      </button>
    </div>
  );
}

// Componente auxiliar para mostrar itinerario de un día
function DayItinerary({ day, date, activities }: any) {
  return (
    <div className="day-itinerary">
      <div className="day-badge">Día {day}</div>
      <div className="day-date">📅 {date}</div>
      
      {activities[0].type === 'free-day' ? (
        <div className="free-day-notice">
          <em>Día libre</em>
        </div>
      ) : (
        <div className="day-activities">
          {activities.map((activity: any, idx: number) => (
            <div key={idx} className="activity-item">
              <div className="activity-time">🕐 {activity.time}</div>
              <div className="activity-details">
                <div className="activity-icon">
                  {activity.type === 'check-in' ? '🏨' : '🚪'}
                </div>
                <div className="activity-info">
                  <h4>
                    {activity.type === 'check-in' ? 'Check-in' : 'Check-out'} - {activity.name}
                  </h4>
                  {activity.details && <p>{activity.details}</p>}
                  {activity.guests && (
                    <div className="activity-meta">
                      <span>👥 {activity.guests} pax</span>
                      <span>📍 {activity.property}</span>
                    </div>
                  )}
                  {activity.price && (
                    <div className="activity-price">
                      ${activity.price.toLocaleString('es-CO')} COP
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
