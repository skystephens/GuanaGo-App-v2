import React from 'react'
import { TAXI_ZONES } from '../constants/taxiZones'

interface TaxiZonesMapProps {
  onZoneSelect?: (zoneId: string) => void
  selectedZone?: string
  hasLuggage?: boolean
  onLuggageChange?: (hasLuggage: boolean) => void
}

export const TaxiZonesMap: React.FC<TaxiZonesMapProps> = ({ 
  onZoneSelect, 
  selectedZone,
  hasLuggage = false,
  onLuggageChange
}) => {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {/* 🗺️ Mapa visual de zonas (compacto) */}
      <div style={{
        flex: '0 1 320px',
        maxWidth: '420px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
      }}>
        <img
          src="https://guiasanandresislas.com/wp-content/uploads/2026/01/Mapa-traslados-taxi-1.png"
          alt="Mapa de Zonas de Traslados - San Andrés"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: 'rotate(270deg)'
          }}
        />
      </div>

      {/* Tabla resumen de tarifas */}
      <div style={{
        flex: '1 1 480px',
        backgroundColor: '#FFF7ED',
        border: '1px solid #FEDBA8',
        borderRadius: '8px',
        padding: '1rem',
        overflow: 'auto',
        marginBottom: '1rem'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead>
            <tr style={{
              borderBottom: '2px solid #FF6600',
              color: '#FF6600',
              fontWeight: 'bold'
            }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Zona</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>1 Taxi ({hasLuggage ? '3' : '4'} pax máx)</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Sectores</th>
            </tr>
          </thead>
          <tbody>
            {TAXI_ZONES.map((zone, idx) => (
              <tr
                key={zone.id}
                style={{
                  backgroundColor: selectedZone === zone.id ? `${zone.color}20` : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
                onClick={() => onZoneSelect?.(zone.id)}
              >
                <td style={{
                  padding: '0.75rem',
                  fontWeight: 'bold',
                  color: zone.color
                }}>
                  {zone.name}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                  ${zone.priceSmall.toLocaleString('es-CO')}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                  {zone.sectors}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notas importantes */}
      <div style={{
        width: '100%',
        padding: '1rem',
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#1E40AF'
      }}>
        <strong>ℹ️ Cómo funciona nuestro sistema de tarifas:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
          <li><strong>1-{hasLuggage ? '3' : '4'} pasajeros:</strong> 1 taxi con la tarifa de la zona</li>
          <li><strong>5+ pasajeros:</strong> Se distribuyen en múltiples taxis (cada uno cuesta igual)</li>
          <li><strong>Ejemplo:</strong> 6 pasajeros en Zona 1 = 2 taxis × $40.000 = $80.000</li>
          {hasLuggage && <li><strong>Con maletas:</strong> Máximo 3 pax por taxi para mayor comodidad</li>}
        </ul>
      </div>
    </div>
  )
}
