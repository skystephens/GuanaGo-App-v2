/**
 * TariffSyncPanel
 *
 * Componente para sincronizar tarifas desde Airtable al JSON estático
 * Solo visible para SuperAdmin
 *
 * CARACTERÍSTICAS:
 * - Muestra versión actual y fecha de última actualización
 * - Botón para forzar sincronización
 * - Descarga CSV de respaldo
 * - Vista previa de datos
 */

import React, { useState, useEffect } from 'react'
import {
  getTarifasData,
  checkForUpdates,
  getCurrentVersion,
  getFormattedLastUpdate,
  exportToCSV
} from '../services/tariffService'
import { forceRefreshData } from '../services/airtableService'

interface SyncStatus {
  isSyncing: boolean
  lastSync: string | null
  version: string | null
  accommodationsCount: number
  toursCount: number
  transportsCount: number
  error: string | null
}

export const TariffSyncPanel: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSync: null,
    version: null,
    accommodationsCount: 0,
    toursCount: 0,
    transportsCount: 0,
    error: null,
  })

  const [hasUpdate, setHasUpdate] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [previewData, setPreviewData] = useState<any>(null)

  // Cargar estado inicial
  useEffect(() => {
    loadCurrentStatus()
    checkForUpdates().then(result => setHasUpdate(result.hasUpdate))
  }, [])

  const loadCurrentStatus = async () => {
    const version = getCurrentVersion()
    const lastSync = getFormattedLastUpdate()

    try {
      const data = await getTarifasData()
      setStatus({
        isSyncing: false,
        lastSync,
        version: version || 'N/A',
        accommodationsCount: data.accommodations?.length || 0,
        toursCount: data.tours?.length || 0,
        transportsCount: data.transports?.length || 0,
        error: null,
      })
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: 'Error cargando datos de tarifas',
      }))
    }
  }

  const handleSync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true, error: null }))

    try {
      const result = await forceRefreshData()

      if (result.success) {
        setStatus({
          isSyncing: false,
          lastSync: getFormattedLastUpdate(),
          version: getCurrentVersion() || 'N/A',
          accommodationsCount: 0,
          toursCount: 0,
          transportsCount: 0,
          error: null,
        })

        // Recargar conteos
        const data = await getTarifasData()
        setStatus(prev => ({
          ...prev,
          accommodationsCount: data.accommodations?.length || 0,
          toursCount: data.tours?.length || 0,
          transportsCount: data.transports?.length || 0,
        }))

        setHasUpdate(false)
        alert('✅ Tarifas sincronizadas correctamente!')
      } else {
        throw new Error('Error en la sincronización')
      }
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error.message || 'Error al sincronizar',
      }))
      alert('❌ Error al sincronizar: ' + error.message)
    }
  }

  const handleDownloadCSV = () => {
    try {
      const csv = exportToCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tarifas_guiasai_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      alert('✅ CSV descargado correctamente')
    } catch (error: any) {
      alert('❌ Error al exportar CSV: ' + error.message)
    }
  }

  const handleShowPreview = async () => {
    if (previewData) {
      setShowPreview(true)
      return
    }

    try {
      const data = await getTarifasData()
      setPreviewData(data)
      setShowPreview(true)
    } catch (error) {
      alert('Error cargando vista previa')
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sincronización de Tarifas</h2>

      {/* Estado actual */}
      <div style={styles.statusCard}>
        <div style={styles.statusRow}>
          <span style={styles.label}>Versión actual:</span>
          <span style={styles.value}>{status.version}</span>
        </div>
        <div style={styles.statusRow}>
          <span style={styles.label}>Última sincronización:</span>
          <span style={styles.value}>{status.lastSync || 'Nunca'}</span>
        </div>
        {hasUpdate && (
          <div style={styles.updateAlert}>
            ⚠️ Hay una actualización disponible en el servidor
          </div>
        )}
      </div>

      {/* Conteos */}
      <div style={styles.countsGrid}>
        <div style={styles.countCard}>
          <div style={styles.countValue}>{status.accommodationsCount}</div>
          <div style={styles.countLabel}>Alojamientos</div>
        </div>
        <div style={styles.countCard}>
          <div style={styles.countValue}>{status.toursCount}</div>
          <div style={styles.countLabel}>Tours</div>
        </div>
        <div style={styles.countCard}>
          <div style={styles.countValue}>{status.transportsCount}</div>
          <div style={styles.countLabel}>Transportes</div>
        </div>
      </div>

      {/* Error message */}
      {status.error && (
        <div style={styles.errorBox}>{status.error}</div>
      )}

      {/* Acciones */}
      <div style={styles.actions}>
        <button
          onClick={handleSync}
          disabled={status.isSyncing}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            ...(status.isSyncing ? styles.buttonDisabled : {}),
          }}
        >
          {status.isSyncing ? 'Sincronizando...' : '🔄 Sincronizar desde Airtable'}
        </button>

        <button
          onClick={handleDownloadCSV}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
          }}
        >
          📥 Descargar CSV
        </button>

        <button
          onClick={handleShowPreview}
          style={{
            ...styles.button,
            ...styles.outlineButton,
          }}
        >
          👁️ Vista Previa
        </button>
      </div>

      {/* Info box */}
      <div style={styles.infoBox}>
        <strong>ℹ️ Cómo funciona:</strong>
        <ul style={styles.infoList}>
          <li>Las tarifas se guardan en <code>public/data/tarifas.json</code></li>
          <li>Esto elimina las llamadas a la API de Airtable para precios y fotos</li>
          <li>Usa "Sincronizar" para actualizar desde Airtable cuando cambien las tarifas</li>
          <li>También puedes ejecutar <code>npm run export-tariffs</code> desde la terminal</li>
        </ul>
      </div>

      {/* Modal de vista previa */}
      {showPreview && previewData && (
        <div style={styles.modal} onClick={() => setShowPreview(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Vista Previa de Datos</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <details open>
                <summary style={styles.summary}>
                  🏨 Alojamientos ({previewData.accommodations?.length || 0})
                </summary>
                <pre style={styles.pre}>
                  {JSON.stringify(previewData.accommodations?.slice(0, 3).map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre,
                    precio: a.precioActualizado,
                  })), null, 2)}
                  {previewData.accommodations?.length > 3 && (
                    <div>... y {previewData.accommodations.length - 3} más</div>
                  )}
                </pre>
              </details>

              <details>
                <summary style={styles.summary}>
                  🎫 Tours ({previewData.tours?.length || 0})
                </summary>
                <pre style={styles.pre}>
                  {JSON.stringify(previewData.tours?.slice(0, 3).map((t: any) => ({
                    id: t.id,
                    nombre: t.nombre,
                    precio: t.precioPerPerson,
                  })), null, 2)}
                  {previewData.tours?.length > 3 && (
                    <div>... y {previewData.tours.length - 3} más</div>
                  )}
                </pre>
              </details>

              <details>
                <summary style={styles.summary}>
                  🚕 Transportes ({previewData.transports?.length || 0})
                </summary>
                <pre style={styles.pre}>
                  {JSON.stringify(previewData.transports?.slice(0, 3).map((t: any) => ({
                    id: t.id,
                    nombre: t.nombre,
                    precio: t.precioPerVehicle,
                  })), null, 2)}
                  {previewData.transports?.length > 3 && (
                    <div>... y {previewData.transports.length - 3} más</div>
                  )}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Estilos
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '24px',
  },
  statusCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  label: {
    color: '#666',
    fontWeight: '500',
  },
  value: {
    color: '#333',
    fontWeight: '600',
  },
  updateAlert: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 12px',
    borderRadius: '4px',
    marginTop: '8px',
  },
  countsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  countCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  countValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0066cc',
  },
  countLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: '#FF6600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#2FA9B8',
    color: '#fff',
  },
  outlineButton: {
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    border: '1px solid #b3d9ff',
    borderRadius: '8px',
    padding: '16px',
  },
  infoList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    color: '#004085',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalBody: {
    padding: '16px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    padding: '8px 0',
    color: '#333',
  },
  pre: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
}

export default TariffSyncPanel
