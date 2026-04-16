import React from 'react'

// SVG fallback local — no requiere red, nunca falla
const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E" +
  "%3Crect width='600' height='400' fill='%23e8f4f8'/%3E" +
  "%3Cellipse cx='300' cy='440' rx='320' ry='180' fill='%232FA9B8' opacity='0.3'/%3E" +
  "%3Ccircle cx='480' cy='120' r='55' fill='%23FFD166' opacity='0.8'/%3E" +
  "%3Cpath d='M0 280 Q150 220 300 260 Q450 300 600 250 L600 400 L0 400Z' fill='%232FA9B8' opacity='0.6'/%3E" +
  "%3Cpath d='M0 320 Q150 290 300 310 Q450 330 600 300 L600 400 L0 400Z' fill='%232FA9B8' opacity='0.8'/%3E" +
  "%3Cpath d='M260 260 L270 180 Q280 120 300 100 Q320 120 330 180 L340 260Z' fill='%2334a853' opacity='0.7'/%3E" +
  "%3Cellipse cx='300' cy='100' rx='45' ry='30' fill='%2334a853' opacity='0.8'/%3E" +
  "%3Ctext x='300' y='355' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' fill='%23546e7a' opacity='0.8'%3ESan Andr%C3%A9s Isla%3C/text%3E" +
  "%3C/svg%3E"

export interface ServiceCardProps {
  service: any
  variant?: 'default' | 'featured'
  isKriol?: boolean
  onImageClick?: (images: string[], title: string, index: number) => void
  onClick?: () => void
  children?: React.ReactNode
}

/**
 * Extrae la URL de imagen desde el campo Imagenurl de Airtable.
 * Maneja: array de attachments [{url: '...'}], array de strings, o string directo.
 */
function extractImageUrl(field: any): string {
  if (!field) return ''
  if (Array.isArray(field)) {
    const first = field[0]
    if (!first) return ''
    if (typeof first === 'string') return first
    if (first?.url) return first.url
    if (first?.thumbnails?.large?.url) return first.thumbnails.large.url
    return ''
  }
  if (typeof field === 'string') return field
  if (field?.url) return field.url
  return ''
}

/**
 * Extrae todas las URLs de imágenes desde el campo Imagenurl de Airtable.
 */
function extractAllImageUrls(field: any): string[] {
  if (!field) return []
  if (Array.isArray(field)) {
    return field
      .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
      .filter((url: string) => url)
  }
  if (typeof field === 'string') return [field]
  return []
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  variant = 'default',
  isKriol = false,
  onImageClick,
  onClick,
  children,
}) => {
  const imageUrl = service.imageUrl || extractImageUrl(service.rawImageField) || FALLBACK_SVG
  const allImages = service.images?.length > 0
    ? service.images
    : extractAllImageUrls(service.rawImageField)
  const displayImages = allImages.length > 0 ? allImages : [FALLBACK_SVG]

  const isFeatured = variant === 'featured'

  return (
    <div
      style={{
        ...cardStyle,
        ...(isFeatured ? featuredCardStyle : {}),
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* Badge Kriol */}
      {isKriol && (
        <div style={kriolBadgeStyle}>
          🌴 Original Kriol - Made in SAI
        </div>
      )}

      {/* Badge Destacado */}
      {isFeatured && (
        <div style={featuredBadgeStyle}>
          ⭐ Destacado
        </div>
      )}

      {/* Imagen principal con lazy loading y fallback */}
      <div
        style={{
          width: '100%',
          height: isFeatured ? '240px' : '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '0.5rem',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          position: 'relative',
        }}
        onClick={(e) => {
          e.stopPropagation()
          onImageClick?.(displayImages, service.nombre, 0)
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
        }}
      >
        <img
          src={imageUrl}
          alt={service.nombre}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement
            const tried = parseInt(img.dataset.tried || '0') + 1
            img.dataset.tried = String(tried)
            const next = displayImages[tried]
            if (next && next !== img.src) {
              img.src = next
            } else {
              img.onerror = null
              img.src = FALLBACK_SVG
            }
          }}
        />
      </div>

      {/* Thumbnails de galería */}
      {displayImages.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            overflowX: 'auto',
          }}
        >
          {displayImages.slice(0, 4).map((img: string, idx: number) => (
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
                transition: 'transform 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onImageClick?.(displayImages, service.nombre, idx)
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
              }}
            >
              <img
                src={img}
                alt={`${service.nombre} ${idx + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.onerror = null
                  el.src = FALLBACK_SVG
                }}
              />
              {idx === 3 && displayImages.length > 4 && (
                <div
                  style={{
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
                    fontWeight: 'bold',
                  }}
                >
                  +{displayImages.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contenido hijo (título, precio, botones, etc. - delegado al padre) */}
      {children}
    </div>
  )
}

// ---- Estilos ----

const cardStyle: React.CSSProperties = {
  background: 'var(--gradient-card)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  transition: 'var(--transition-base)',
  border: '1px solid var(--gray-200)',
  padding: 'var(--spacing-lg)',
  position: 'relative',
}

const featuredCardStyle: React.CSSProperties = {
  border: '2px solid #FF6600',
  boxShadow: '0 4px 20px rgba(255, 102, 0, 0.15)',
  transform: 'scale(1.02)',
}

const kriolBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  backgroundColor: '#2D6A4F',
  color: '#FFFFFF',
  padding: '0.35rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  zIndex: 2,
  letterSpacing: '0.3px',
  boxShadow: '0 2px 8px rgba(45, 106, 79, 0.4)',
}

const featuredBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  background: 'linear-gradient(135deg, #FF6600, #FFB627)',
  color: '#FFFFFF',
  padding: '0.35rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  zIndex: 2,
  boxShadow: '0 2px 8px rgba(255, 102, 0, 0.4)',
}

export { extractImageUrl, extractAllImageUrls, FALLBACK_SVG }
