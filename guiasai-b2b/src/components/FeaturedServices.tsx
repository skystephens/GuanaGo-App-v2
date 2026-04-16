import React from 'react'
import { ServiceCard } from './ServiceCard'

interface FeaturedServicesProps {
  services: any[]
  onImageClick: (images: string[], title: string, index: number) => void
  onServiceClick?: (service: any) => void
  renderCardContent: (service: any) => React.ReactNode
}

/**
 * Sección de Productos Destacados
 * Muestra servicios donde el campo Destacado = true
 * Tarjetas 20% más grandes con borde diferenciado
 */
export const FeaturedServices: React.FC<FeaturedServicesProps> = ({
  services,
  onImageClick,
  onServiceClick,
  renderCardContent,
}) => {
  const featured = services.filter((s) => s.destacado === true)

  if (featured.length === 0) return null

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          ⭐ Servicios Destacados
        </h2>
        <p style={subtitleStyle}>
          Seleccionados por nuestro equipo como las mejores experiencias de San Andres
        </p>
      </div>

      <div style={gridStyle}>
        {featured.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            variant="featured"
            onImageClick={onImageClick}
            onClick={() => onServiceClick?.(service)}
          >
            {renderCardContent(service)}
          </ServiceCard>
        ))}
      </div>

      <div style={dividerStyle} />
    </section>
  )
}

// ---- Estilos ----

const sectionStyle: React.CSSProperties = {
  marginBottom: '2rem',
}

const headerStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
}

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#FF6600',
  fontFamily: "'Poppins', sans-serif",
  margin: '0 0 0.5rem 0',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#666',
  margin: 0,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '1.5rem',
}

const dividerStyle: React.CSSProperties = {
  height: '2px',
  background: 'linear-gradient(90deg, transparent, #FF6600, transparent)',
  margin: '2rem 0',
  opacity: 0.3,
}
