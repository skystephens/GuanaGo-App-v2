import React from 'react'
import { Link } from 'react-router-dom'
import '../pages/services/ServiceMicrosite.css'

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

interface FeaturedCardProps {
  service: any
  linkTo: string
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ service, linkTo }) => {
  const allImages: string[] = service.images?.length > 0 ? service.images : (service.imageUrl ? [service.imageUrl] : [])
  const imageUrl = allImages[0] || FALLBACK_SVG
  const precio = service.precioPerPerson || service.precioActualizado || service.precioBase || 0
  const descripcionCorta = service.descripcion
    ? service.descripcion.substring(0, 100) + (service.descripcion.length > 100 ? '...' : '')
    : 'Experiencia unica en San Andres Isla'

  return (
    <Link to={linkTo} state={{ service }} className="featured-card" style={{ textDecoration: 'none' }}>
      <div className="featured-card-image">
        <img
          src={imageUrl}
          alt={service.nombre}
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement
            const tried = parseInt(img.dataset.tried || '0') + 1
            img.dataset.tried = String(tried)
            const next = allImages[tried]
            if (next && next !== img.src) {
              img.src = next
            } else {
              img.onerror = null
              img.src = FALLBACK_SVG
            }
          }}
        />
        {service.destacado && (
          <div className="featured-card-badge">Autentico</div>
        )}
      </div>
      <div className="featured-card-body">
        <h3 className="featured-card-name">{service.nombre}</h3>
        <p className="featured-card-desc">{descripcionCorta}</p>
        <div className="featured-card-footer">
          <div className="featured-card-price">
            ${precio.toLocaleString('es-CO')} <span>COP</span>
          </div>
          <span className="btn-view-details">Ver Detalles</span>
        </div>
      </div>
    </Link>
  )
}

export default FeaturedCard
