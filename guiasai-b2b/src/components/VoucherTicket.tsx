import type { VoucherRecord } from '../services/airtableService'

const TEAL = '#00c4cc'
const ORANGE = '#FF6600'

const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  PENDIENTE:   { bg: TEAL,      text: '#fff' },
  CONFIRMADO:  { bg: '#22c55e', text: '#fff' },
  CANCELADO:   { bg: '#ef4444', text: '#fff' },
  COMPLETADO:  { bg: '#6366f1', text: '#fff' },
}

function estadoStyle(estado: string) {
  return ESTADO_COLORS[estado?.toUpperCase()] ?? { bg: TEAL, text: '#fff' }
}

export function VoucherTicket({ voucher }: { voucher: VoucherRecord }) {
  const { bg: estadoBg, text: estadoText } = estadoStyle(voucher.estado)

  return (
    <div style={{
      maxWidth: '420px',
      width: '100%',
      margin: '0 auto',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15)',
      fontFamily: "'Poppins', 'Inter', sans-serif",
      border: '1px solid #e8f4f5',
    }}>

      {/* HEADER naranja */}
      <div style={{
        background: `linear-gradient(135deg, ${ORANGE} 0%, #cc4400 100%)`,
        padding: '1.75rem 1.5rem 2rem',
        position: 'relative',
      }}>
        {/* Etiqueta superior */}
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          Experiencia Reservada
        </div>

        {/* Nombre del tour */}
        <h1 style={{
          fontSize: '1.55rem',
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.15,
          margin: '0 0 0.5rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          paddingRight: '95px',
        }}>
          {voucher.tourName || 'Servicio turístico'}
        </h1>

        {/* Badge estado */}
        {voucher.estado && (
          <span style={{
            position: 'absolute',
            top: '1.75rem',
            right: '1.5rem',
            backgroundColor: estadoBg,
            color: estadoText,
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '0.3rem 0.8rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {voucher.estado}
          </span>
        )}

        {/* Separador decorativo tipo ticket */}
        <div style={{
          position: 'absolute',
          bottom: '-12px',
          left: 0,
          right: 0,
          height: '24px',
          background: '#fff',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        }} />
      </div>

      {/* CUERPO blanco */}
      <div style={{ backgroundColor: '#fff', padding: '2rem 1.5rem 1.5rem' }}>

        {/* Titular */}
        <div style={{
          marginBottom: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px dashed #e2e8f0',
        }}>
          <div style={labelStyle}>Titular de Reserva</div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#1e293b',
            textTransform: 'uppercase',
            lineHeight: 1.3,
          }}>
            {voucher.titular}
          </div>
        </div>

        {/* ID + PAX */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <DataCard label="ID Reserva" value={voucher.reservaNum} valueColor={ORANGE} />
          <DataCard label="Pax" value={voucher.pax} />
        </div>

        {/* Fecha + Hora */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <DataCard label="Fecha" value={voucher.fecha} />
          <DataCard label="Hora de Encuentro" value={voucher.hora} valueColor={TEAL} valueLarge />
        </div>

        {/* Punto de encuentro */}
        {voucher.puntoEncuentro && (
          <div style={{
            backgroundColor: '#fff8f5',
            border: `1px solid ${ORANGE}30`,
            borderLeft: `4px solid ${ORANGE}`,
            borderRadius: '0 12px 12px 0',
            padding: '0.9rem 1rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: ORANGE,
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span>◆</span> Punto de Encuentro
            </div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#7c3000',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}>
              {voucher.puntoEncuentro}
            </div>
          </div>
        )}

        {/* Observaciones / Notas */}
        {voucher.observaciones && (
          <NoteCard text={voucher.observaciones} />
        )}
        {voucher.notasAdicionales && voucher.notasAdicionales !== voucher.observaciones && (
          <NoteCard text={voucher.notasAdicionales} />
        )}

        {/* Botón cómo llegar */}
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(voucher.puntoEncuentro || 'San Andrés Islas Colombia')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.9rem',
            marginTop: '1.25rem',
            background: `linear-gradient(135deg, ${TEAL}, #009aa0)`,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: `0 4px 15px ${TEAL}40`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Cómo llegar al punto
        </a>

        {/* Footer */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}>
          <div style={{ fontSize: '0.7rem', color: '#1e293b', fontWeight: 700, letterSpacing: '0.04em' }}>
            📞 +57 315 383 6043
          </div>
          <div style={{ fontSize: '0.62rem', color: '#1e293b', fontWeight: 600, letterSpacing: '0.06em', textAlign: 'center' }}>
            guiasanandresislas.com
          </div>
          <div style={{ fontSize: '0.62rem', color: '#1e293b', fontWeight: 600, letterSpacing: '0.04em' }}>
            RNT: 48674
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: '#94a3b8',
  textTransform: 'uppercase',
  marginBottom: '0.25rem',
}

function DataCard({ label, value, valueColor, valueLarge }: {
  label: string
  value: string
  valueColor?: string
  valueLarge?: boolean
}) {
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '0.75rem 0.9rem',
    }}>
      <div style={labelStyle}>{label}</div>
      <div style={{
        fontSize: valueLarge ? '1.35rem' : '0.95rem',
        fontWeight: 700,
        color: valueColor ?? '#1e293b',
        lineHeight: 1.2,
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

function NoteCard({ text }: { text: string }) {
  return (
    <div style={{
      backgroundColor: '#f0fdfe',
      border: `1px solid ${TEAL}40`,
      borderLeft: `4px solid ${TEAL}`,
      borderRadius: '0 12px 12px 0',
      padding: '0.9rem 1rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: TEAL,
        textTransform: 'uppercase',
        marginBottom: '0.35rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}>
        <span>⚠</span> Nota Importante
      </div>
      <div style={{
        fontSize: '0.82rem',
        color: '#0f6b70',
        lineHeight: 1.5,
        textTransform: 'uppercase',
        fontWeight: 600,
      }}>
        {text}
      </div>
    </div>
  )
}
