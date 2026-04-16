import React from 'react'
import { X, Download } from 'lucide-react'
import { ItineraryView } from './ItineraryView'
import { Quotation } from '@/types/quotation'

interface ItineraryModalProps {
  isOpen: boolean
  onClose: () => void
  quotation: Quotation
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  isOpen,
  onClose,
  quotation
}) => {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  // Calcular rango de fechas basado en los servicios seleccionados
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
        <div style={styles.header}>
          <h2 style={styles.title}>Itinerario de Viaje</h2>
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

        <div style={styles.content}>
          <ItineraryView 
            startDate={start}
            endDate={end}
            accommodations={quotation.accommodations}
            tours={quotation.tours}
            transports={quotation.transports}
          />
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
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
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
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
}