import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuotationStore } from '../stores/quotationStore'
import { NavigationBar } from '../components/NavigationBar'
import { getCotizacionesByEmail, downloadRatesAsCSV, forceRefreshData, getLastUpdateDate } from '../services/airtableService'
import '../styles/guiasai-theme.css'

export const AgencyPanel = () => {
  const navigate = useNavigate()
  const { isAuthenticated, agencyInfo, logout, mockQuotation } = useQuotationStore()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string | null>(getLastUpdateDate())

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated || !agencyInfo) {
      navigate('/')
    }
  }, [isAuthenticated, agencyInfo, navigate])

  // Cargar historial de cotizaciones
  useEffect(() => {
    const fetchHistory = async () => {
      if (agencyInfo?.email) {
        setLoading(true)
        const data = await getCotizacionesByEmail(agencyInfo.email)
        setQuotations(data)
        setLoading(false)
      }
    }
    fetchHistory()
  }, [agencyInfo])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleRefreshRates = async () => {
    if (!confirm('¿Deseas actualizar las tarifas desde Airtable? Esto puede tomar unos segundos.')) return
    
    setLoading(true)
    const result = await forceRefreshData()
    setLoading(false)
    
    if (result.success) {
      setLastUpdate(new Date().toISOString())
      alert(`✅ Tarifas actualizadas correctamente.\n\nSe han sincronizado ${result.count} servicios.`)
    } else {
      alert('❌ Error actualizando tarifas. Intenta nuevamente.')
    }
  }

  if (!isAuthenticated || !agencyInfo) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '4rem' }}>
      <NavigationBar
        activeSectionId="panel"
        userInitials={agencyInfo.name.substring(0, 2).toUpperCase()}
        userName={agencyInfo.name}
        onProfileClick={() => {}}
        onLogout={handleLogout}
        isAuthenticated={true}
        quotationCount={mockQuotation.accommodations.length + mockQuotation.tours.length + mockQuotation.transports.length}
        onQuotationClick={() => navigate('/')}
      />

      <div className="container" style={{ marginTop: '100px' }}>
        {/* Header del Panel */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ 
                display: 'inline-block', 
                backgroundColor: '#FF6600', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '999px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}>
                AGENCIA PRO
              </div>
              <h1 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Poppins', sans-serif" }}>Hola, {agencyInfo.name}</h1>
              <p style={{ opacity: 0.8, margin: '0.5rem 0 0 0' }}>{agencyInfo.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => navigate('/')}
                className="btn"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                ➕ Nueva Cotización
              </button>
              <button 
                onClick={handleRefreshRates}
                className="btn"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                🔄 Sincronizar Tarifas
              </button>
              <button 
                onClick={() => downloadRatesAsCSV([], [], [])} // TODO: Pasar datos reales si es necesario
                className="btn"
                style={{ backgroundColor: 'white', color: '#1a1a1a' }}
              >
                📥 Descargar Tarifario
              </button>
            </div>
          </div>
          {lastUpdate && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7, textAlign: 'right' }}>
              Última actualización de tarifas: {new Date(lastUpdate).toLocaleString('es-CO')}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Columna Izquierda: Historial */}
          <div style={{ gridColumn: 'span 2' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1a1a1a' }}>📜 Historial de Cotizaciones</h2>
            
            {loading ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                <p>Cargando historial...</p>
              </div>
            ) : quotations.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {quotations.map((quote) => (
                  <div key={quote.id} className="card" style={{ 
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid #FF6600',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1a1a1a' }}>
                          {quote['Nombre'] || 'Cliente sin nombre'}
                        </span>
                        <span style={{ 
                          backgroundColor: '#e6fffa', 
                          color: '#047857', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold' 
                        }}>
                          ENVIADA
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        📅 Viaje: {quote['Fecha Inicio'] || 'N/D'} 
                        {quote['Fecha Fin'] ? ` al ${quote['Fecha Fin']}` : ''}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#888' }}>
                        ID: {quote.id} • Creada: {new Date(quote.createdTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#FF6600', margin: '0 0 0.5rem 0' }}>
                        ${(quote['Precio total'] || 0).toLocaleString('es-CO')}
                      </p>
                      <button 
                        className="btn-small"
                        style={{ backgroundColor: '#f0f0f0', color: '#333' }}
                        onClick={() => alert('Detalle completo próximamente.\n\nResumen:\n' + (quote['Cotizaciones_Items'] || 'Sin detalles'))}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No has realizado cotizaciones aún.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                  Crear mi primera cotización
                </button>
              </div>
            )}
          </div>

          {/* Columna Derecha: Info y Ofertas */}
          <div>
            {/* Tarjeta de Asesor */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #FF6600 0%, #FF8C42 100%)', color: 'white', border: 'none' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>👩‍💼 Tu Asesor Asignado</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  🎧
                </div>
                <div>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>Equipo GuiaSAI</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Soporte B2B Premium</p>
                </div>
              </div>
              <button 
                className="btn" 
                style={{ width: '100%', backgroundColor: 'white', color: '#FF6600' }}
                onClick={() => window.open('https://wa.me/573153836043', '_blank')}
              >
                Contactar por WhatsApp
              </button>
            </div>

            {/* Novedades */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', color: '#1a1a1a' }}>📢 Novedades y Ofertas</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontSize: '0.75rem', color: '#FF6600', fontWeight: 'bold' }}>NUEVO SERVICIO</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1rem' }}>Tour de Mantarrayas VIP</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                    Ya disponible para reservar. Incluye fotos y bebidas.
                  </p>
                </div>
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>OFERTA</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1rem' }}>5% Extra en Hoteles</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                    Comisión adicional en reservas de Hotel Las Palmeras este mes.
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 'bold' }}>ACTUALIZACIÓN</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1rem' }}>Nuevas tarifas de Taxis</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                    Actualizamos el mapa de zonas y precios para 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}