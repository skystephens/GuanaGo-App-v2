/**
 * PropuestaAlojamientosPage
 * Página pública (sin auth) que muestra opciones de alojamiento para un cliente.
 * URL: /propuesta?ids=rec1,rec2&llegada=2025-11-06&salida=2025-11-09&adultos=3&ninos=3&agente=Sky&wa=573153836043
 */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCotizadorAlojamientosSAI } from '../services/airtableService'

const ORANGE = '#FF6600'
const TEAL = '#2FA9B8'

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO')
}

function formatFecha(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const meses = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d} ${meses[parseInt(m)]} ${y}`
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function calcPrecio(aloj: any, totalPax: number) {
  const pax = Math.max(1, totalPax)
  if (pax >= 4 && aloj.precio4Huespedes) return aloj.precio4Huespedes
  if (pax === 3 && aloj.precio3Huespedes) return aloj.precio3Huespedes
  if (pax === 2 && aloj.precio2Huespedes) return aloj.precio2Huespedes
  return aloj.precioBase || 0
}

function CamasBadge({ aloj }: { aloj: any }) {
  const items: string[] = []
  if (aloj.camasSencillas > 0) items.push(`${aloj.camasSencillas} sencilla${aloj.camasSencillas > 1 ? 's' : ''}`)
  if (aloj.camasDobles > 0) items.push(`${aloj.camasDobles} doble${aloj.camasDobles > 1 ? 's' : ''}`)
  if (aloj.camaQueen > 0) items.push(`${aloj.camaQueen} queen`)
  if (aloj.camaKing > 0) items.push(`${aloj.camaKing} king`)
  if (items.length === 0) return null
  return (
    <span style={{ fontSize: '0.75rem', color: '#475569' }}>
      🛏 {items.join(' · ')}
    </span>
  )
}

function AmenidadesBadges({ aloj }: { aloj: any }) {
  const badges = [
    aloj.vistaMar && { icon: '🌊', label: 'Vista al mar' },
    aloj.accesoPiscina && { icon: '🏊', label: 'Piscina' },
    aloj.accesoJacuzzi && { icon: '♨️', label: 'Jacuzzi' },
    aloj.tieneCocina && { icon: '🍳', label: 'Cocina' },
    aloj.accesoBar && { icon: '🍹', label: 'Bar' },
    aloj.aceptaBebes && { icon: '👶', label: 'Acepta bebés' },
  ].filter(Boolean) as { icon: string; label: string }[]

  if (badges.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
      {badges.map(b => (
        <span key={b.label} style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem',
          borderRadius: '99px', background: `${TEAL}18`, color: TEAL,
          border: `1px solid ${TEAL}30`,
        }}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  )
}

function TarjetaAlojamiento({
  aloj, noches, adultos, ninos, llegada, salida, waNumber, agente
}: {
  aloj: any
  noches: number
  adultos: number
  ninos: number
  llegada: string
  salida: string
  waNumber: string
  agente: string
}) {
  const totalPax = adultos + ninos
  const precioPorNoche = calcPrecio(aloj, totalPax)
  const totalEstadia = precioPorNoche * Math.max(1, noches)

  const waMsg = encodeURIComponent(
    `Hola ${agente}, me interesa el alojamiento *${aloj.nombre}* 🏨\n` +
    `📅 Llegada: ${formatFecha(llegada)} → Salida: ${formatFecha(salida)}\n` +
    `👥 ${adultos} adulto${adultos !== 1 ? 's' : ''} + ${ninos} niño${ninos !== 1 ? 's' : ''}\n` +
    `¿Tienen disponibilidad?`
  )
  const waLink = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${waMsg}`

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      border: '1px solid #e2e8f0',
      fontFamily: "'Poppins','Inter',sans-serif",
    }}>
      {/* Foto */}
      {aloj.imageUrl ? (
        <div style={{ position: 'relative', paddingBottom: '56%', background: '#f1f5f9' }}>
          <img
            src={aloj.imageUrl}
            alt={aloj.nombre}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
          {aloj.tipo && (
            <span style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.65rem',
              borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {aloj.tipo}
            </span>
          )}
        </div>
      ) : (
        <div style={{ height: '160px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
      )}

      {/* Contenido */}
      <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', lineHeight: 1.3 }}>
            {aloj.nombre}
          </h3>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>por noche</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: ORANGE }}>{formatCOP(precioPorNoche)}</div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
          📍 {aloj.ubicacion}
          {aloj.capacidadMax > 0 && ` · Hasta ${aloj.capacidadMax} pax`}
          {aloj.minimoNoches > 1 && ` · Mín. ${aloj.minimoNoches} noches`}
        </div>

        <CamasBadge aloj={aloj} />
        <AmenidadesBadges aloj={aloj} />

        {aloj.descripcion ? (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {aloj.descripcion}
          </p>
        ) : null}

        {/* Precio total estadía */}
        {noches > 0 && (
          <div style={{
            marginTop: '0.9rem',
            padding: '0.65rem 0.9rem',
            background: '#FFF7ED',
            borderRadius: '8px',
            border: `1px solid ${ORANGE}30`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>
              {noches} noche{noches !== 1 ? 's' : ''} · {totalPax} pax
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: ORANGE }}>{formatCOP(totalEstadia)}</span>
          </div>
        )}

        {/* Botón CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            marginTop: '0.9rem', padding: '0.75rem 1rem',
            background: ORANGE, color: '#fff', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
            boxShadow: `0 4px 12px ${ORANGE}40`,
          }}
        >
          <span>💬</span> Me interesa este alojamiento
        </a>
      </div>
    </div>
  )
}

export default function PropuestaAlojamientosPage() {
  const [params] = useSearchParams()
  const [alojamientos, setAlojamientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const idsParam = params.get('ids') || ''
  const llegada = params.get('llegada') || ''
  const salida = params.get('salida') || ''
  const adultos = parseInt(params.get('adultos') || '2')
  const ninos = parseInt(params.get('ninos') || '0')
  const agente = params.get('agente') || 'GuiaSAI'
  const waNumber = params.get('wa') || '573153836043'
  const noches = nightsBetween(llegada, salida)
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : []

  useEffect(() => {
    getCotizadorAlojamientosSAI(ids.length > 0 ? ids : undefined)
      .then(data => {
        setAlojamientos(data)
        if (data.length === 0) setError('No se encontraron alojamientos disponibles.')
      })
      .catch(() => setError('Error cargando alojamientos. Intenta recargar.'))
      .finally(() => setLoading(false))
  }, [idsParam])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F9FF', fontFamily: "'Poppins','Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #cc4400 100%)`, padding: '1.5rem 1.25rem 2.5rem', position: 'relative' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <img
              src="/agencias/LOGO_GUIASAI.png"
              alt="GuiaSAI"
              style={{ height: '32px', filter: 'brightness(0) invert(1)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Opciones de Alojamiento
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
            Seleccionadas especialmente para tu viaje a San Andrés
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: '-12px', left: 0, right: 0, height: '24px', background: '#F0F9FF', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
      </div>

      {/* Resumen viaje */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem 0' }}>
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '0.9rem 1.1rem',
          border: '1px solid #BFDBFE', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem',
          marginBottom: '1.25rem',
        }}>
          {llegada && (
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Llegada</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a5f' }}>{formatFecha(llegada)}</div>
            </div>
          )}
          {salida && (
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Salida</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a5f' }}>{formatFecha(salida)}</div>
            </div>
          )}
          {noches > 0 && (
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Noches</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a5f' }}>{noches}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Pasajeros</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a5f' }}>
              {adultos} adulto{adultos !== 1 ? 's' : ''}{ninos > 0 ? ` + ${ninos} niño${ninos !== 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Agente</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: TEAL }}>{agente}</div>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#3B82F6', fontSize: '0.9rem' }}>
            Cargando opciones de alojamiento...
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', fontSize: '0.88rem' }}>{error}</div>
        )}

        {/* Tarjetas */}
        {!loading && alojamientos.length > 0 && (
          <>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
              {alojamientos.length} opción{alojamientos.length !== 1 ? 'es' : ''} disponible{alojamientos.length !== 1 ? 's' : ''} · Toca "Me interesa" para contactar al agente por WhatsApp
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', paddingBottom: '2rem' }}>
              {alojamientos.map(aloj => (
                <TarjetaAlojamiento
                  key={aloj.id}
                  aloj={aloj}
                  noches={noches}
                  adultos={adultos}
                  ninos={ninos}
                  llegada={llegada}
                  salida={salida}
                  waNumber={waNumber}
                  agente={agente}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '1rem', paddingBottom: '2.5rem', textAlign: 'center',
          borderTop: '1px solid #BFDBFE', paddingTop: '1.5rem',
        }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e3a5f', marginBottom: '0.65rem' }}>
            <strong style={{ color: ORANGE }}>GuiaSAI</strong> · Agencia de viajes certificada · RNT: 48674
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <a
              href="https://wa.me/573153836043"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 1rem', background: '#25D366', color: '#fff',
                borderRadius: '99px', fontWeight: 700, fontSize: '0.8rem',
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
              }}
            >
              <span>💬</span> +57 315 383 6043
            </a>
            <a
              href="https://www.guiasai.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 1rem', background: TEAL, color: '#fff',
                borderRadius: '99px', fontWeight: 700, fontSize: '0.8rem',
                textDecoration: 'none', boxShadow: `0 2px 8px ${TEAL}40`,
              }}
            >
              <span>🌐</span> www.guiasai.com
            </a>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            guiasanandresislas.com · San Andrés Isla, Colombia
          </div>
        </div>
      </div>
    </div>
  )
}
