import { useState, useEffect, useCallback } from 'react'

interface ImageModalProps {
  isOpen: boolean
  images: string[]
  initialIndex?: number
  title?: string
  onClose: () => void
}

export function ImageModal({ isOpen, images, initialIndex = 0, title, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') onClose()
  }, [goToPrevious, goToNext, onClose])

  useEffect(() => {
    if (!isOpen) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen || images.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Encabezado con título y cerrar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center', color: 'white' }}>
          {title && <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h2>}
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
            {currentIndex + 1} de {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(255, 102, 0, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgb(255, 102, 0)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 102, 0, 0.8)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Imagen principal */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '90vw',
          maxHeight: '80vh',
          marginTop: '60px',
        }}
      >
        <img
          src={images[currentIndex]}
          alt={`${title} - Imagen ${currentIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            animation: 'fadeIn 0.3s ease-in',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23cccccc'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial,sans-serif' font-size='32' font-weight='bold' fill='%23666666' text-anchor='middle' dominant-baseline='middle'%3E🖼️%3C/text%3E%3Ctext x='50%25' y='60%25' font-family='Arial,sans-serif' font-size='20' fill='%23666666' text-anchor='middle' dominant-baseline='middle'%3EImagen no disponible%3C/text%3E%3C/svg%3E"
          }}
        />
      </div>

      {/* Controles de navegación */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={goToPrevious}
            style={{
              backgroundColor: 'rgba(255, 102, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgb(255, 102, 0)'
              ;(e.target as HTMLButtonElement).style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 102, 0, 0.8)'
              ;(e.target as HTMLButtonElement).style.transform = 'scale(1)'
            }}
            title="Anterior (← o click)"
          >
            ❮
          </button>

          {/* Indicador de posición */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: '70%',
            }}
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: idx === currentIndex ? 'rgb(255, 102, 0)' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={`Ir a imagen ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            style={{
              backgroundColor: 'rgba(255, 102, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgb(255, 102, 0)'
              ;(e.target as HTMLButtonElement).style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 102, 0, 0.8)'
              ;(e.target as HTMLButtonElement).style.transform = 'scale(1)'
            }}
            title="Siguiente (→ o click)"
          >
            ❯
          </button>
        </div>
      )}

      {/* Animación fade in */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
