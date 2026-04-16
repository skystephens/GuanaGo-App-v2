/**
 * CotizacionCompartidaPage
 * Página pública para compartir una cotización con el cliente.
 * URL: /cotizacion-compartida?data=BASE64_JSON
 *
 * El agente genera esta URL desde AdminCotizacionBuilder ("Compartir con cliente").
 * El cliente ve cada servicio con foto, descripción y categoría — sin necesidad de auth.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const ORANGE = '#FF6600'
const TEAL = '#2FA9B8'
const TEXT_DARK = '#1e3a5f'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFechaLarga(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

function formatCOP(n: number): string {
  return '$' + Number(n || 0).toLocaleString('es-CO') + ' COP'
}

const TIPO_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  Alojamiento: { icon: '🏠', color: '#2FA9B8', label: 'Alojamiento' },
  Tour:        { icon: '🎟️', color: '#FF6600', label: 'Tour' },
  Paquete:     { icon: '📦', color: '#8b5cf6', label: 'Paquete' },
  Tiquete:     { icon: '✈️', color: '#3B82F6', label: 'Tiquete aéreo' },
  Traslado:    { icon: '🚐', color: '#10b981', label: 'Traslado' },
}

// ─── Componente de tarjeta de servicio ──────────────────────────────────────

interface ItemData {
  id: string
  tipo: string
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
  fecha?: string
  notas?: string
  imageUrl?: string
  imageUrls?: string[]
  descripcion?: string
  ubicacion?: string
  capacidad?: number
  duracion?: string
  incluye?: string[]
  extra?: Record<string, any>
}

function TarjetaServicio({ item, wa, agente }: { item: ItemData; wa: string; agente: string }) {
  const [imgIdx, setImgIdx] = useState(0)
  const imgs = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []
  const cfg = TIPO_CONFIG[item.tipo] || { icon: '🔧', color: '#64748b', label: item.tipo }
  const [imgError, setImgError] = useState(false)

  const handleWa = () => {
    const msg = encodeURIComponent(
      `Hola, me interesa este servicio de su cotización:\n*${item.nombre}*${item.descripcion ? '\n' + item.descripcion : ''}\n\nQuedo atento/a.`
    )
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: '1px solid #e8f4f5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Foto */}
      <div style={{ position: 'relative', height: '200px', background: '#f1f5f9', flexShrink: 0 }}>
        {imgs.length > 0 && !imgError ? (
          <img
            src={imgs[imgIdx]}
            alt={item.nombre}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: `${cfg.color}15` }}>
            {cfg.icon}
          </div>
        )}

        {/* Navegación fotos */}
        {imgs.length > 1 && !imgError && (
          <>
            <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
            <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
            <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
              {imgIdx + 1}/{imgs.length}
            </div>
          </>
        )}

        {/* Badge tipo */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          background: cfg.color, color: '#fff',
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
          padding: '0.25rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase',
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Contenido */}
      <div style={{ padding: '1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT_DARK, lineHeight: 1.3 }}>
          {item.nombre}
        </h3>

        {item.ubicacion && (
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {item.ubicacion}</div>
        )}

        {item.descripcion && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.55, flex: 1 }}>
            {item.descripcion.length > 220 ? item.descripcion.slice(0, 220) + '…' : item.descripcion}
          </p>
        )}

        {/* Detalles tipo-específicos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
          {item.duracion && <Chip icon="⏱️" text={item.duracion} />}
          {item.capacidad && item.capacidad > 0 && <Chip icon="👥" text={`Hasta ${item.capacidad} pax`} />}
          {item.extra?.tipo_alojamiento && <Chip icon="🏠" text={item.extra.tipo_alojamiento} />}
          {item.extra?.aerolinea && <Chip icon="✈️" text={item.extra.aerolinea} />}
          {item.extra?.tipo_vehiculo && <Chip icon="🚐" text={item.extra.tipo_vehiculo} />}
        </div>

        {/* Qué incluye (tours/paquetes) */}
        {item.incluye && item.incluye.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#22c55e', lineHeight: 1.5 }}>
            ✓ {item.incluye.slice(0, 3).join(' · ')}{item.incluye.length > 3 ? ' …' : ''}
          </div>
        )}

        {/* Precio */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {item.tipo === 'Alojamiento' ? 'por noche' : 'por persona'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: ORANGE }}>
              {formatCOP(item.precio)}
            </div>
          </div>
          <button
            onClick={handleWa}
            style={{
              background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            💬 Me interesa
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.55rem',
      borderRadius: '99px', background: '#f1f5f9', color: '#475569',
      border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    }}>
      {icon} {text}
    </span>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function CotizacionCompartidaPage() {
  const [params] = useSearchParams()

  // Decodificar datos del parámetro ?data=
  let data: any = null
  let decodeError = false
  try {
    const raw = params.get('data')
    if (raw) {
      data = JSON.parse(atob(decodeURIComponent(raw)))
    }
  } catch {
    decodeError = true
  }

  const wa = params.get('wa') || '573153836043'
  const agente = params.get('agente') || 'GuiaSAI'

  if (decodeError || !data) {
    return (
      <div style={{ fontFamily: "'Poppins',sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
          <h2 style={{ color: TEXT_DARK }}>Enlace no válido</h2>
          <p style={{ color: '#64748b' }}>Este enlace de cotización no contiene datos válidos o ha expirado.</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Contacta a tu agente para que te envíe un nuevo enlace.</p>
        </div>
      </div>
    )
  }

  const { cliente, fechaInicio, fechaFin, adultos = 0, ninos = 0, bebes = 0, items = [], cotizacionId } = data
  const paxTotal = adultos + ninos + bebes

  return (
    <div style={{ fontFamily: "'Poppins','Inter',sans-serif", minHeight: '100vh', background: '#EFF6FF' }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${TEXT_DARK} 0%, #0a6080 100%)`,
        padding: '2rem 1.5rem 3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorativo */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: `${TEAL}20` }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: `${ORANGE}20` }} />

        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          {/* Logo + ID */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: `${TEAL}`, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                GuiaSAI · Tu agencia en San Andrés
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>guiasai.com</div>
            </div>
            {cotizacionId && (
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0.3rem 0.75rem', borderRadius: '99px', textTransform: 'uppercase' }}>
                {cotizacionId}
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: `${ORANGE}`, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Propuesta de viaje para
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            {cliente?.nombre || 'Viajero'}
          </h1>

          {/* Fechas + pax */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            {fechaInicio && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.5rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.15rem' }}>Llegada</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatFechaLarga(fechaInicio)}</div>
              </div>
            )}
            {fechaFin && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.5rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.15rem' }}>Salida</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatFechaLarga(fechaFin)}</div>
              </div>
            )}
            {paxTotal > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.5rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.15rem' }}>Viajeros</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{paxTotal} persona{paxTotal !== 1 ? 's' : ''}</div>
              </div>
            )}
          </div>
        </div>

        {/* Separador tipo ticket */}
        <div style={{ position: 'absolute', bottom: '-12px', left: 0, right: 0, height: '24px', background: '#EFF6FF', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
      </div>

      {/* SERVICIOS */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
            <p>Esta cotización no tiene servicios incluidos.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {items.length} servicio{items.length !== 1 ? 's' : ''} incluido{items.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {items.map((item: ItemData, i: number) => (
                <TarjetaServicio key={item.id + i} item={item} wa={wa} agente={agente} />
              ))}
            </div>
          </>
        )}

        {/* CTA contacto */}
        <div style={{
          marginTop: '2.5rem', padding: '1.5rem',
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: TEXT_DARK, marginBottom: '0.4rem' }}>
            ¿Tienes preguntas sobre esta propuesta?
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Escríbenos por WhatsApp y te respondemos en minutos.
          </div>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, tengo preguntas sobre mi cotización ${cotizacionId || ''} de GuiaSAI.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#25D366', color: '#fff', borderRadius: '10px',
              padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            💬 Hablar con {agente}
          </a>
        </div>

        {/* Footer GuiaSAI */}
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', paddingBottom: '2rem' }}>
          <div style={{ fontWeight: 700, color: TEAL, fontSize: '0.85rem', marginBottom: '0.3rem' }}>GuiaSAI · San Andrés Isla</div>
          <div>RNT 48674 · guiasai.com · +57 315 383 6043</div>
        </div>
      </div>
    </div>
  )
}
