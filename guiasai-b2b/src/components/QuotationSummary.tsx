import React from 'react'
import { Quotation } from '@/types/quotation'
import { FileText, Calendar } from 'lucide-react'

interface QuotationSummaryProps {
  quotation: Quotation | null
  onConfirmClick: () => void
  onClearClick: () => void
  onPreviewClick: () => void
  onItineraryClick?: () => void
  disabled?: boolean
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({
  quotation,
  onConfirmClick,
  onClearClick,
  onPreviewClick,
  onItineraryClick,
  disabled = false,
}) => {
  if (!quotation) {
    return (
      <div style={styles.emptyState}>
        <p>Selecciona servicios para ver el resumen</p>
      </div>
    )
  }

  const isReadyForConfirmation =
    quotation.accommodations.length > 0 ||
    quotation.tours.length > 0 ||
    quotation.transports.length > 0

  return (
    <div style={styles.horizontalLayout}>
        <div style={styles.leftSection}>
          <h3 style={styles.title}>Cotización {quotation.id}</h3>
          <div style={styles.itemsSummary}>
            {quotation.accommodations.length > 0 && (
              <span style={styles.badge}>🏨 {quotation.accommodations.length}</span>
            )}
            {quotation.tours.length > 0 && (
              <span style={styles.badge}>🎫 {quotation.tours.length}</span>
            )}
            {quotation.transports.length > 0 && (
              <span style={styles.badge}>🚕 {quotation.transports.length}</span>
            )}
          </div>
        </div>

        <div style={styles.centerSection}>
          <div style={styles.totalAmount}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalValue}>
              ${quotation.total.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        <div style={styles.rightSection}>
          <button
            onClick={onClearClick}
            style={styles.clearButton}
            disabled={!isReadyForConfirmation}
          >
            Limpiar
          </button>
          {onItineraryClick && (
            <button
              onClick={onItineraryClick}
              style={styles.itineraryButton}
              disabled={!isReadyForConfirmation}
            >
              <Calendar size={16} />
              <span>Itinerario</span>
            </button>
          )}
          <button
            onClick={onPreviewClick}
            style={styles.previewButton}
            disabled={!isReadyForConfirmation}
          >
            <FileText size={16} />
            <span>Vista Previa</span>
          </button>
          <button
            onClick={onConfirmClick}
            style={styles.confirmButton}
            disabled={!isReadyForConfirmation || disabled}
          >
            ✓ Enviar Cotización
          </button>
        </div>
      </div>
  )
}

const styles = {
  horizontalLayout: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    gap: 'var(--spacing-lg)',
    backgroundColor: 'var(--guiasai-bg-white)',
    height: '100%',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-xs)',
    minWidth: '200px',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  itemsSummary: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    flexWrap: 'wrap' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    backgroundColor: 'var(--guiasai-secondary)',
    color: 'white',
    borderRadius: '16px',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  totalAmount: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  totalLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--guiasai-text-light)',
    fontFamily: "'Poppins', sans-serif",
  },
  totalValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  rightSection: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    alignItems: 'center',
  },
  clearButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: 'var(--guiasai-primary)',
    border: '2px solid var(--guiasai-primary)',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  itineraryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#8b5cf6',
    border: '2px solid #8b5cf6',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  previewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'white',
    color: 'var(--guiasai-secondary)',
    border: '2px solid var(--guiasai-secondary)',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  confirmButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--guiasai-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 8px rgba(255, 102, 0, 0.3)',
  },
  emptyState: {
    padding: 'var(--spacing-md)',
    textAlign: 'center' as const,
    color: 'var(--guiasai-text-light)',
    fontSize: '0.875rem',
  },
}
