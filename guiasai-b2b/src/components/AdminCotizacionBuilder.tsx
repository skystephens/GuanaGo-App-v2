import { useState, useEffect, useRef } from 'react'
import {
  createCotizacionGG,
  getCotizadorTours,
  getCotizadorPaquetes,
  getCotizadorAlojamientos,
  getCotizadorTiquetes,
  getCotizadorTraslados,
  getCotizadorAlojamientosSAI,
} from '../services/airtableService'

const ORANGE = '#FF6600'
const TEAL = '#2FA9B8'
const CARD_BG = '#EFF6FF'
const INPUT_BG = '#FFFFFF'
const BORDER_COLOR = '#BFDBFE'
const TEXT_DARK = '#1e3a5f'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ItemCotizacion {
  id: string
  tipo: 'Alojamiento' | 'Tour' | 'Paquete' | 'Tiquete' | 'Traslado'
  nombre: string
  precio: number          // precio unitario calculado
  cantidad: number        // personas o noches según tipo
  subtotal: number
  fecha?: string
  notas?: string
  imageUrl?: string
  // Datos enriquecidos para vista de detalle
  imageUrls?: string[]
  slug?: string
  descripcion?: string
  ubicacion?: string
  capacidad?: number
  duracion?: string
  incluye?: string[]
  extra?: Record<string, any>  // campos tipo-específicos (camas, aerolínea, vehículo, etc.)
}

interface ClienteInfo {
  nombre: string
  email: string
  telefono: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
  return n.toLocaleString('es-CO') + ' COP'
}

/** YYYY-MM-DD → "5 nov 2026". Devuelve '' si la fecha no es válida. */
function formatFechaCorta(iso: string) {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return ''
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 1
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return 1
  const diff = db.getTime() - da.getTime()
  return Math.max(1, Math.round(diff / 86400000))
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
          border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK,
          fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Vista previa estilo voucher ─────────────────────────────────────────────

function CotizacionPreview({ cliente, fechaInicio, fechaFin, adultos, ninos, bebes, items, notas, cotizacionId }: {
  cliente: ClienteInfo
  fechaInicio: string
  fechaFin: string
  adultos: number
  ninos: number
  bebes: number
  items: ItemCotizacion[]
  notas: string
  cotizacionId: string
}) {
  const [detalleItem, setDetalleItem] = useState<ItemCotizacion | null>(null)
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const paxTotal = adultos + ninos + bebes

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto',
      borderRadius: '20px', overflow: 'hidden',
      boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15)',
      fontFamily: "'Poppins','Inter',sans-serif",
      border: '1px solid #e8f4f5',
    }}>
      {/* HEADER naranja */}
      <div style={{
        background: `linear-gradient(135deg, ${ORANGE} 0%, #cc4400 100%)`,
        padding: '1.75rem 1.5rem 2.5rem',
        position: 'relative',
      }}>
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
          Cotización de Viaje • GuiaSAI B2B
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.02em', paddingRight: '110px', lineHeight: 1.2 }}>
          {cliente.nombre || 'Sin nombre'}
        </h1>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          {cliente.email}{cliente.telefono ? ` · ${cliente.telefono}` : ''}
        </div>
        {/* Logo + ID cotización — esquina superior derecha */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <img
            src="/agencias/LOGO_GUIASAI.png"
            alt="GuiaSAI"
            style={{ height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {cotizacionId && (
            <span style={{
              background: 'rgba(255,255,255,0.2)', color: '#fff',
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
              padding: '0.2rem 0.65rem', borderRadius: '999px', textTransform: 'uppercase',
            }}>
              {cotizacionId}
            </span>
          )}
        </div>
        {/* Separador decorativo tipo ticket */}
        <div style={{
          position: 'absolute', bottom: '-12px', left: 0, right: 0,
          height: '24px', background: '#fff',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        }} />
      </div>

      {/* CUERPO blanco */}
      <div style={{ background: '#fff', padding: '2rem 1.5rem 1.5rem' }}>

        {/* Fechas + Pax */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {fechaInicio && <DataCard label="Llegada" value={formatFechaCorta(fechaInicio) || fechaInicio} />}
          {fechaFin && <DataCard label="Salida" value={formatFechaCorta(fechaFin) || fechaFin} />}
          <DataCard label="Pax" value={paxTotal > 0 ? `${paxTotal} persona${paxTotal !== 1 ? 's' : ''}` : '—'} />
        </div>

        {/* Items */}
        <div style={{ marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Servicios incluidos
          </div>
          {items.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>
              Sin servicios agregados
            </div>
          )}
          {items.map((item, i) => {
            const tipoColor = item.tipo === 'Alojamiento' ? TEAL : item.tipo === 'Tour' ? ORANGE : item.tipo === 'Tiquete' ? '#3B82F6' : item.tipo === 'Traslado' ? '#10b981' : '#8b5cf6'
            return (
              <div key={item.id + i} style={{
                padding: '0.75rem 0',
                borderBottom: i < items.length - 1 ? '1px dashed #f1f5f9' : 'none',
              }}>
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <div
                      onClick={() => setDetalleItem(item)}
                      style={{
                        width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden',
                        flexShrink: 0, cursor: 'pointer', border: `2px solid ${tipoColor}30`,
                        position: 'relative',
                      }}
                    >
                      <img src={item.imageUrl} alt={item.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.background = '#f1f5f9' }}
                      />
                      {item.imageUrls && item.imageUrls.length > 1 && (
                        <div style={{
                          position: 'absolute', bottom: '2px', right: '2px',
                          background: 'rgba(0,0,0,0.6)', color: '#fff',
                          fontSize: '0.48rem', fontWeight: 700, padding: '1px 4px', borderRadius: '4px',
                        }}>+{item.imageUrls.length - 1}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '10px', flexShrink: 0,
                      background: `${tipoColor}15`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.4rem',
                      border: `1px solid ${tipoColor}25`,
                    }}>
                      {item.tipo === 'Alojamiento' ? '🏨' : item.tipo === 'Tour' ? '🎫' : item.tipo === 'Paquete' ? '📦' : item.tipo === 'Tiquete' ? '✈️' : '🚕'}
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em',
                        padding: '0.1rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase',
                        background: `${tipoColor}20`, color: tipoColor,
                      }}>{item.tipo}</span>
                      {formatFechaCorta(item.fecha || '') && (
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {formatFechaCorta(item.fecha || '')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{item.nombre}</div>
                    {item.ubicacion && <div style={{ fontSize: '0.68rem', color: '#64748b' }}>📍 {item.ubicacion}</div>}
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      {formatCOP(item.precio)} × {Math.max(1, item.cantidad || 1)} {item.tipo === 'Alojamiento' ? 'noche(s)' : 'pax'}
                    </div>
                    {item.notas && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{item.notas}</div>}
                  </div>

                  {/* Precio + botón ver */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: ORANGE, whiteSpace: 'nowrap' }}>
                      {formatCOP(item.subtotal)}
                    </div>
                    <button
                      onClick={() => setDetalleItem(item)}
                      title="Ver ficha completa"
                      style={{
                        fontSize: '0.62rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                        borderRadius: '6px', border: `1px solid ${tipoColor}40`,
                        background: `${tipoColor}10`, color: tipoColor, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      👁 Ver
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div style={{
          backgroundColor: '#fff8f5',
          border: `1px solid ${ORANGE}30`,
          borderLeft: `4px solid ${ORANGE}`,
          borderRadius: '0 12px 12px 0',
          padding: '0.9rem 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3000', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total cotización
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: ORANGE }}>
            {formatCOP(total)}
          </span>
        </div>

        {/* Notas */}
        {notas && (
          <div style={{
            backgroundColor: '#f0fdfe',
            border: `1px solid ${TEAL}40`,
            borderLeft: `4px solid ${TEAL}`,
            borderRadius: '0 12px 12px 0',
            padding: '0.9rem 1rem', marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>⚠ Nota</div>
            <div style={{ fontSize: '0.82rem', color: '#0f6b70', lineHeight: 1.5, fontWeight: 600 }}>{notas}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#1e293b', fontWeight: 700 }}>📞 +57 315 383 6043</div>
          <div style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: 600 }}>guiasanandresislas.com</div>
          <div style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: 600 }}>RNT: 48674</div>
        </div>
      </div>

      {/* Modal de detalle — fuera del contenido imprimible */}
      {detalleItem && (
        <DetalleServicioModal item={detalleItem} onClose={() => setDetalleItem(null)} />
      )}
    </div>
  )
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
      <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{value || '—'}</div>
    </div>
  )
}

// ─── Modal de detalle de servicio ───────────────────────────────────────────

function DetalleServicioModal({ item, onClose }: { item: ItemCotizacion; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)
  const imgs = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []
  const ex = item.extra || {}

  const tipoColor: Record<string, string> = {
    Alojamiento: TEAL, Tour: ORANGE, Paquete: '#8b5cf6', Tiquete: '#3B82F6', Traslado: '#10b981',
  }
  const color = tipoColor[item.tipo] || ORANGE

  const tipoEmoji: Record<string, string> = {
    Alojamiento: '🏨', Tour: '🎫', Paquete: '📦', Tiquete: '✈️', Traslado: '🚕',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
          maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          fontFamily: "'Poppins','Inter',sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '1rem 1.25rem 0.75rem', borderBottom: `3px solid ${color}10`,
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
              padding: '0.2rem 0.65rem', borderRadius: '99px', textTransform: 'uppercase',
              background: `${color}18`, color,
            }}>{tipoEmoji[item.tipo]} {item.tipo}</span>
            <h2 style={{ margin: '0.4rem 0 0', fontSize: '1rem', fontWeight: 800, color: TEXT_DARK, lineHeight: 1.3 }}>
              {item.nombre}
            </h2>
            {item.ubicacion && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>📍 {item.ubicacion}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: '0.75rem',
            }}
          >✕</button>
        </div>

        {/* Carrusel de fotos */}
        {imgs.length > 0 && (
          <div style={{ position: 'relative', background: '#f1f5f9' }}>
            <div style={{ paddingBottom: '56%', position: 'relative', overflow: 'hidden' }}>
              <img
                src={imgs[imgIdx]}
                alt={item.nombre}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
              />
            </div>
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => i === 0 ? imgs.length - 1 : i - 1)}
                  style={{
                    position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >‹</button>
                <button
                  onClick={() => setImgIdx(i => i === imgs.length - 1 ? 0 : i + 1)}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >›</button>
                <div style={{
                  position: 'absolute', bottom: '8px', right: '10px',
                  background: 'rgba(0,0,0,0.5)', color: '#fff',
                  fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px',
                }}>
                  {imgIdx + 1} / {imgs.length}
                </div>
                {/* Miniaturas */}
                <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', background: 'rgba(0,0,0,0.35)', flexWrap: 'wrap' }}>
                  {imgs.slice(0, 8).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setImgIdx(idx)}
                      style={{
                        width: '44px', height: '36px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
                        border: imgIdx === idx ? `2px solid ${ORANGE}` : '2px solid transparent',
                        flexShrink: 0,
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Precio + capacidad */}
        <div style={{ padding: '1rem 1.25rem 0' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <div style={{ flex: 1, minWidth: '100px', background: `${color}10`, borderRadius: '10px', padding: '0.65rem 0.85rem', border: `1px solid ${color}25` }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.15rem' }}>
                {item.tipo === 'Alojamiento' ? 'Precio / noche' : 'Precio unitario'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color }}>${item.precio.toLocaleString('es-CO')}</div>
            </div>
            {item.capacidad > 0 && (
              <div style={{ flex: 1, minWidth: '100px', background: '#f8fafc', borderRadius: '10px', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.15rem' }}>Capacidad</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: TEXT_DARK }}>{item.capacidad} pax</div>
              </div>
            )}
            {item.duracion && (
              <div style={{ flex: 1, minWidth: '100px', background: '#f8fafc', borderRadius: '10px', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.15rem' }}>Duración</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: TEXT_DARK }}>{item.duracion}</div>
              </div>
            )}
          </div>

          {/* Contenido específico por tipo */}

          {/* ALOJAMIENTO */}
          {item.tipo === 'Alojamiento' && (
            <>
              {/* Camas */}
              {(ex.camasSencillas > 0 || ex.camasDobles > 0 || ex.camaQueen > 0 || ex.camaKing > 0) && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.4rem' }}>🛏 Configuración de camas</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { val: ex.camasSencillas, label: 'Sencilla' },
                      { val: ex.camasDobles, label: 'Doble' },
                      { val: ex.camaQueen, label: 'Queen' },
                      { val: ex.camaKing, label: 'King' },
                    ].filter(c => c.val > 0).map(c => (
                      <span key={c.label} style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem',
                        borderRadius: '99px', background: `${TEAL}15`, color: TEAL,
                        border: `1px solid ${TEAL}30`,
                      }}>
                        {c.val} {c.label}{c.val > 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Amenidades */}
              {(ex.accesoPiscina || ex.accesoJacuzzi || ex.tieneCocina) && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.4rem' }}>✨ Amenidades</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ex.accesoPiscina && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#DBEAFE', color: '#1d4ed8' }}>🏊 Piscina</span>}
                    {ex.accesoJacuzzi && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#FEE2E2', color: '#b91c1c' }}>♨️ Jacuzzi</span>}
                    {ex.tieneCocina && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#F0FDF4', color: '#15803d' }}>🍳 Cocina</span>}
                    {ex.vistaMar && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '99px', background: `${TEAL}15`, color: TEAL }}>🌊 Vista al mar</span>}
                  </div>
                </div>
              )}
              {/* Precios por huéspedes */}
              {(ex.precio2Huespedes > 0 || ex.precio3Huespedes > 0 || ex.precio4Huespedes > 0) && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.4rem' }}>💰 Tarifas por cantidad de huéspedes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem' }}>
                    {[
                      { label: '2 pax', val: ex.precio2Huespedes },
                      { label: '3 pax', val: ex.precio3Huespedes },
                      { label: '4+ pax', val: ex.precio4Huespedes },
                    ].filter(t => t.val > 0).map(t => (
                      <div key={t.label} style={{ background: '#FFF7ED', borderRadius: '8px', padding: '0.5rem 0.65rem', border: `1px solid ${ORANGE}20`, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: '#92400e', fontWeight: 600 }}>{t.label}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: ORANGE }}>${t.val.toLocaleString('es-CO')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TOUR / PAQUETE */}
          {(item.tipo === 'Tour' || item.tipo === 'Paquete') && (
            <>
              {item.incluye && item.incluye.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.4rem' }}>✅ Qué incluye</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {item.incluye.map((inc, i) => (
                      <li key={i} style={{ fontSize: '0.78rem', color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ex.diasOperacion && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.2rem' }}>🗓 Días / Horarios</div>
                  <div style={{ fontSize: '0.8rem', color: TEXT_DARK }}>{ex.diasOperacion}</div>
                </div>
              )}
            </>
          )}

          {/* TIQUETE */}
          {item.tipo === 'Tiquete' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[
                  { label: 'Origen', val: ex.origen }, { label: 'Destino', val: ex.destino },
                  { label: 'Aerolínea', val: ex.aerolinea }, { label: 'Tipo vuelo', val: ex.tipoVuelo },
                  { label: 'Hora salida', val: ex.horarioSalida }, { label: 'Duración vuelo', val: ex.duracionVuelo },
                ].filter(r => r.val).map(r => (
                  <div key={r.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem 0.65rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>{r.label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_DARK }}>{r.val}</div>
                  </div>
                ))}
              </div>
              {ex.incluyeEquipaje && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#F0FDF4', color: '#15803d' }}>
                  🧳 Equipaje {ex.equipajeBodegaKG > 0 ? `${ex.equipajeBodegaKG}kg` : 'incluido'}
                </span>
              )}
            </div>
          )}

          {/* TRASLADO */}
          {item.tipo === 'Traslado' && (
            <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { label: 'Origen', val: ex.origen }, { label: 'Destino', val: ex.destino },
                { label: 'Vehículo', val: ex.vehiculo || ex.tipoVehiculo }, { label: 'Capacidad', val: ex.capacidadVehiculo ? `${ex.capacidadVehiculo} pax` : '' },
              ].filter(r => r.val).map(r => (
                <div key={r.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem 0.65rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>{r.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_DARK }}>{r.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Descripción */}
          {item.descripcion && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.3rem' }}>📄 Descripción</div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.65 }}>{item.descripcion}</p>
            </div>
          )}

          {/* Ver en catálogo público */}
          {item.slug && (item.tipo === 'Tour' || item.tipo === 'Paquete') && (
            <a
              href={`${(import.meta as any).env.BASE_URL}servicio/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                marginBottom: '1rem', padding: '0.6rem 1rem',
                background: `${TEAL}15`, color: TEAL, borderRadius: '8px',
                fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none',
                border: `1px solid ${TEAL}30`,
              }}
            >
              🌐 Ver ficha completa en catálogo
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Catálogo de servicios ───────────────────────────────────────────────────

function CatalogoServicio({ service, tipo, adultos, fechaInicio, fechaFin, onAdd }: {
  service: any
  tipo: 'Alojamiento' | 'Tour' | 'Paquete' | 'Tiquete' | 'Traslado'
  adultos: number
  fechaInicio: string
  fechaFin: string
  onAdd: (item: ItemCotizacion) => void
}) {
  const calcPrecio = () => {
    if (tipo === 'Alojamiento') {
      const pax = Math.max(1, adultos)
      if (pax === 2 && service.precio2Huespedes) return service.precio2Huespedes
      if (pax === 3 && service.precio3Huespedes) return service.precio3Huespedes
      if (pax >= 4 && service.precio4Huespedes) return service.precio4Huespedes
      return service.precioBase || service.precioActualizado || 0
    }
    if (tipo === 'Tiquete') return service.precioAdulto || service.precioBase || 0
    if (tipo === 'Traslado') return service.precioBase || service.precioPorPersona || 0
    return service.precioBase || service.precioPerPerson || 0
  }

  const precio = calcPrecio()
  const noches = tipo === 'Alojamiento' ? nightsBetween(fechaInicio, fechaFin) : 1
  const cantidad = tipo === 'Alojamiento' ? noches : Math.max(1, adultos)
  const subtotal = precio * cantidad

  const unidadLabel =
    tipo === 'Alojamiento' ? `${noches} noche(s)` :
    tipo === 'Tiquete' ? `${cantidad} pax` :
    tipo === 'Traslado' ? `${cantidad} pax` :
    `${cantidad} pax`

  const handleAdd = () => {
    const imgs: string[] = service.images?.length > 0
      ? service.images
      : service.imageUrl ? [service.imageUrl] : []
    onAdd({
      id: service.id || service.slug,
      tipo,
      nombre: service.nombre,
      precio,
      cantidad,
      subtotal,
      fecha: fechaInicio || undefined,
      imageUrl: imgs[0] || '',
      imageUrls: imgs,
      slug: service.slug || '',
      descripcion: service.descripcion || '',
      ubicacion: service.ubicacion || '',
      capacidad: service.capacidad || service.capacidadMax || 0,
      duracion: service.duracion || '',
      incluye: service.incluye || [],
      extra: { ...service },
    })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 0.75rem', borderRadius: '10px',
      background: CARD_BG, border: `1px solid ${BORDER_COLOR}`,
      marginBottom: '0.4rem',
    }}>
      {service.imageUrl && (
        <img src={service.imageUrl} alt={service.nombre}
          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {service.nombre}
          </div>
          {!service.publicado && (
            <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '99px', background: '#DBEAFE', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
              no publicado
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {formatCOP(precio)} · {unidadLabel}
          {' · '}<span style={{ color: ORANGE, fontWeight: 600 }}>{formatCOP(subtotal)}</span>
        </div>
      </div>
      <button onClick={handleAdd} style={{
        background: ORANGE, color: '#fff', border: 'none', borderRadius: '8px',
        padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700,
        cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        + Agregar
      </button>
    </div>
  )
}

// ─── Generador de propuesta para clientes ───────────────────────────────────

function GeneradorPropuesta() {
  const [open, setOpen] = useState(false)
  const [llegada, setLlegada] = useState('')
  const [salida, setSalida] = useState('')
  const [adultos, setAdultos] = useState(2)
  const [ninos, setNinos] = useState(0)
  const [agente, setAgente] = useState('Sky - GuiaSAI')
  const [waNumber, setWaNumber] = useState('573153836043')
  const [alojamientosSAI, setAlojamientosSAI] = useState<any[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [loadingAloj, setLoadingAloj] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  useEffect(() => {
    if (open && alojamientosSAI.length === 0) {
      setLoadingAloj(true)
      getCotizadorAlojamientosSAI().then(d => setAlojamientosSAI(d)).finally(() => setLoadingAloj(false))
    }
  }, [open])

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const generarLink = () => {
    const base = window.location.origin + (import.meta as any).env.BASE_URL
    const params = new URLSearchParams()
    if (seleccionados.size > 0) params.set('ids', [...seleccionados].join(','))
    if (llegada) params.set('llegada', llegada)
    if (salida) params.set('salida', salida)
    params.set('adultos', String(adultos))
    params.set('ninos', String(ninos))
    params.set('agente', agente)
    params.set('wa', waNumber)
    return `${base}propuesta?${params.toString()}`
  }

  const copiarLink = async () => {
    const link = generarLink()
    await navigator.clipboard.writeText(link)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  const abrirPrevistaLink = () => window.open(generarLink(), '_blank')

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
          border: `1.5px solid ${TEAL}`, background: open ? `${TEAL}15` : '#fff',
          color: TEAL, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}
      >
        🔗 {open ? 'Cerrar generador de propuesta' : 'Generar propuesta para cliente'}
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', background: '#F0FDFE', borderRadius: '12px', border: `1px solid ${TEAL}30`, padding: '1.1rem' }}>
          <p style={{ margin: '0 0 0.9rem', fontSize: '0.78rem', color: '#0f6b70', lineHeight: 1.5 }}>
            Selecciona alojamientos, completa fechas y pax → copia el link y envíaselo al cliente por WhatsApp.
          </p>

          {/* Fechas + pax */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.8rem' }}>
            {[
              { label: 'Llegada', value: llegada, onChange: setLlegada, type: 'date' },
              { label: 'Salida', value: salida, onChange: setSalida, type: 'date' },
            ].map(f => (
              <div key={f.label}>
                <SectionLabel>{f.label}</SectionLabel>
                <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '7px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {[
              { label: 'Adultos', value: adultos, onChange: setAdultos },
              { label: 'Niños', value: ninos, onChange: setNinos },
            ].map(f => (
              <div key={f.label}>
                <SectionLabel>{f.label}</SectionLabel>
                <input type="number" min={0} value={f.value} onChange={e => f.onChange(+e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '7px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.9rem' }}>
            <div>
              <SectionLabel>Tu nombre (agente)</SectionLabel>
              <input value={agente} onChange={e => setAgente(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '7px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <SectionLabel>WhatsApp (sin +)</SectionLabel>
              <input value={waNumber} onChange={e => setWaNumber(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '7px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Lista de alojamientos */}
          <SectionLabel>Alojamientos a incluir ({seleccionados.size === 0 ? 'todos' : `${seleccionados.size} seleccionados`})</SectionLabel>
          {loadingAloj && <div style={{ fontSize: '0.78rem', color: TEAL, padding: '0.5rem 0' }}>Cargando alojamientos...</div>}
          <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '0.9rem', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', background: '#fff' }}>
            {alojamientosSAI.map(aloj => (
              <label key={aloj.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.75rem', cursor: 'pointer',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                background: seleccionados.has(aloj.id) ? `${TEAL}10` : 'transparent',
              }}>
                <input type="checkbox" checked={seleccionados.has(aloj.id)} onChange={() => toggleSeleccion(aloj.id)}
                  style={{ accentColor: TEAL, width: '15px', height: '15px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aloj.nombre}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{aloj.tipo} · Cap. {aloj.capacidadMax} · ${(aloj.precioBase||0).toLocaleString('es-CO')}/noche</div>
                </div>
              </label>
            ))}
            {!loadingAloj && alojamientosSAI.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>No hay alojamientos publicados en Airtable</div>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={copiarLink} style={{
              flex: 1, padding: '0.65rem', borderRadius: '9px', border: 'none',
              background: linkCopiado ? '#22c55e' : ORANGE, color: '#fff',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}>
              {linkCopiado ? '✅ ¡Link copiado!' : '📋 Copiar link'}
            </button>
            <button onClick={abrirPrevistaLink} style={{
              padding: '0.65rem 0.9rem', borderRadius: '9px',
              border: `1px solid ${TEAL}`, background: 'transparent',
              color: TEAL, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}>
              👁️ Previsualizar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function AdminCotizacionBuilder() {
  // Datos del cliente
  const [cliente, setCliente] = useState<ClienteInfo>({ nombre: '', email: '', telefono: '' })
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [adultos, setAdultos] = useState(2)
  const [ninos, setNinos] = useState(0)
  const [bebes, setBebes] = useState(0)
  const [notas, setNotas] = useState('')

  // Items seleccionados
  const [items, setItems] = useState<ItemCotizacion[]>([])

  // Catálogo
  const [allAcc, setAllAcc] = useState<any[]>([])
  const [allTours, setAllTours] = useState<any[]>([])
  const [allPaquetes, setAllPaquetes] = useState<any[]>([])
  const [allTiquetes, setAllTiquetes] = useState<any[]>([])
  const [allTraslados, setAllTraslados] = useState<any[]>([])
  const [catalogTab, setCatalogTab] = useState<'tours' | 'alojamientos' | 'paquetes' | 'tiquetes' | 'traslados'>('tours')
  const [busqueda, setBusqueda] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  // Vista
  const [vista, setVista] = useState<'builder' | 'preview'>('builder')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState('')
  const [error, setError] = useState('')

  const cotizacionId = useRef(`QT-${Date.now()}`)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoadingCatalog(true)
    Promise.all([
      getCotizadorTours().then(setAllTours),
      getCotizadorAlojamientos().then(setAllAcc),
      getCotizadorTiquetes().then(setAllTiquetes),
      getCotizadorTraslados().then(setAllTraslados),
      getCotizadorPaquetes().then(setAllPaquetes),
    ]).finally(() => setLoadingCatalog(false))
  }, [])

  const addItem = (item: ItemCotizacion) => {
    setItems(prev => [...prev, { ...item, id: item.id + '-' + Date.now() }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateCantidad = (idx: number, cantidad: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const c = Math.max(1, cantidad)
      return { ...item, cantidad: c, subtotal: item.precio * c }
    }))
  }

  const updatePrecio = (idx: number, precio: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const p = Math.max(0, precio)
      return { ...item, precio: p, subtotal: p * item.cantidad }
    }))
  }

  const updateSubtotal = (idx: number, subtotal: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      return { ...item, subtotal: Math.max(0, subtotal) }
    }))
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  const filtrar = (list: any[]) => {
    if (!busqueda.trim()) return list
    const q = busqueda.toLowerCase()
    return list.filter(s => s.nombre?.toLowerCase().includes(q) || s.descripcion?.toLowerCase().includes(q))
  }

  const handleGuardar = async () => {
    if (!cliente.nombre) { setError('El nombre del cliente es obligatorio'); return }
    if (items.length === 0) { setError('Agrega al menos un servicio'); return }
    setError('')
    setSaving(true)
    try {
      const result = await createCotizacionGG({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        adultos,
        ninos,
        bebes,
        precioTotal: total,
        notasInternas: `Creada por staff GuiaSAI (B2B Admin)\n\n${notas}`,
        tours: items.filter(i => i.tipo === 'Tour' || i.tipo === 'Paquete').map(i => ({
          nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: i.subtotal, fecha: i.fecha
        })),
        accommodations: items.filter(i => i.tipo === 'Alojamiento').map(i => ({
          nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: i.subtotal, fecha: i.fecha
        })),
      })
      setSavedId(result.cotizacionId)
      setVista('preview')
    } catch (err: any) {
      setError('Error al guardar: ' + (err?.message || 'intenta de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = () => {
    if (!previewRef.current) return
    const html = previewRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Cotización ${cotizacionId.current}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:24px;background:#EFF6FF;font-family:'Poppins',sans-serif;}@media print{body{padding:0;background:#fff;}}</style>
      </head><body>${html}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  const CATALOG_TABS = [
    { id: 'tours', label: 'Tours', count: allTours.length },
    { id: 'alojamientos', label: 'Alojamientos', count: allAcc.length },
    { id: 'tiquetes', label: 'Tiquetes', count: allTiquetes.length },
    { id: 'traslados', label: 'Traslados', count: allTraslados.length },
    { id: 'paquetes', label: 'Paquetes', count: allPaquetes.length },
  ] as const

  const currentList =
    catalogTab === 'tours' ? allTours :
    catalogTab === 'alojamientos' ? allAcc :
    catalogTab === 'tiquetes' ? allTiquetes :
    catalogTab === 'traslados' ? allTraslados :
    allPaquetes
  const currentTipo: 'Tour' | 'Alojamiento' | 'Paquete' | 'Tiquete' | 'Traslado' =
    catalogTab === 'tours' ? 'Tour' :
    catalogTab === 'alojamientos' ? 'Alojamiento' :
    catalogTab === 'tiquetes' ? 'Tiquete' :
    catalogTab === 'traslados' ? 'Traslado' :
    'Paquete'

  if (vista === 'preview') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ color: TEXT_DARK, margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Vista Previa de Cotización</h2>
            {savedId && <div style={{ color: '#22c55e', fontSize: '0.8rem', marginTop: '0.2rem' }}>✅ Guardada en Airtable: {savedId}</div>}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => setVista('builder')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, background: 'transparent', color: '#3B82F6', cursor: 'pointer', fontSize: '0.82rem' }}>
              ← Editar
            </button>
            <button onClick={handleImprimir} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: TEAL, color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
              🖨️ Imprimir
            </button>
            {!savedId && (
              <button onClick={handleGuardar} disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: ORANGE, color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                {saving ? 'Guardando...' : '💾 Guardar en Airtable'}
              </button>
            )}
          </div>
        </div>
        <div ref={previewRef}>
          <CotizacionPreview
            cliente={cliente}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            adultos={adultos}
            ninos={ninos}
            bebes={bebes}
            items={items}
            notas={notas}
            cotizacionId={savedId || cotizacionId.current}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <GeneradorPropuesta />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>

      {/* COLUMNA IZQUIERDA: Info cliente + catálogo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Info cliente */}
        <div style={{ background: CARD_BG, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${BORDER_COLOR}` }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: TEXT_DARK }}>👤 Información del Cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Input label="Nombre *" value={cliente.nombre} onChange={v => setCliente(c => ({ ...c, nombre: v }))} placeholder="Nombre completo" />
            <Input label="Email" value={cliente.email} onChange={v => setCliente(c => ({ ...c, email: v }))} placeholder="email@agencia.com" type="email" />
            <Input label="Teléfono" value={cliente.telefono} onChange={v => setCliente(c => ({ ...c, telefono: v }))} placeholder="+57 300..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
            <Input label="Llegada" value={fechaInicio} onChange={setFechaInicio} type="date" />
            <Input label="Salida" value={fechaFin} onChange={setFechaFin} type="date" />
            <div>
              <SectionLabel>Adultos</SectionLabel>
              <input type="number" min={1} value={adultos} onChange={e => setAdultos(+e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <SectionLabel>Niños</SectionLabel>
              <input type="number" min={0} value={ninos} onChange={e => setNinos(+e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <SectionLabel>Bebés</SectionLabel>
              <input type="number" min={0} value={bebes} onChange={e => setBebes(+e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Catálogo */}
        <div style={{ background: CARD_BG, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${BORDER_COLOR}` }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: TEXT_DARK }}>🗂️ Catálogo de Servicios</h3>

          {/* Tabs catálogo */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {CATALOG_TABS.map(tab => (
              <button key={tab.id} onClick={() => { setCatalogTab(tab.id); setBusqueda('') }}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  background: catalogTab === tab.id ? ORANGE : '#DBEAFE',
                  color: catalogTab === tab.id ? '#fff' : '#1e40af',
                }}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <input
            placeholder={`Buscar ${catalogTab}...`}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
              border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK,
              fontSize: '0.85rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box',
            }}
          />

          {/* Lista */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {loadingCatalog && (
              <div style={{ color: '#3B82F6', textAlign: 'center', padding: '2rem', fontSize: '0.82rem' }}>
                Cargando catálogo...
              </div>
            )}
            {!loadingCatalog && filtrar(currentList).length === 0 && (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.82rem' }}>
                {busqueda ? 'Sin resultados' : catalogTab === 'tiquetes' || catalogTab === 'traslados' ? 'Tabla pendiente de crear en Airtable' : 'Sin servicios disponibles'}
              </div>
            )}
            {!loadingCatalog && filtrar(currentList).map(service => (
              <CatalogoServicio
                key={service.id || service.slug}
                service={service}
                tipo={currentTipo}
                adultos={adultos}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onAdd={addItem}
              />
            ))}
          </div>
        </div>

        {/* Notas */}
        <div style={{ background: CARD_BG, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${BORDER_COLOR}` }}>
          <SectionLabel>Notas internas / observaciones</SectionLabel>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Notas para la cotización (recomendaciones, condiciones, etc.)..."
            rows={3}
            style={{
              width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
              border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK,
              fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* COLUMNA DERECHA: Items + total */}
      <div style={{ position: 'sticky', top: '1rem' }}>
        <div style={{ background: CARD_BG, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${BORDER_COLOR}` }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: TEXT_DARK }}>
            🧾 Cotización ({items.length} servicio{items.length !== 1 ? 's' : ''})
          </h3>

          {items.length === 0 && (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.82rem' }}>
              Agrega servicios desde el catálogo
            </div>
          )}

          {items.map((item, idx) => (
            <div key={item.id + idx} style={{ padding: '0.65rem 0', borderBottom: `1px dashed ${BORDER_COLOR}` }}>
              {/* Nombre + quitar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT_DARK, lineHeight: 1.3, flex: 1, paddingRight: '0.5rem' }}>
                  {item.nombre}
                </div>
                <button onClick={() => removeItem(idx)} style={{
                  background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '0', flexShrink: 0,
                }}>✕</button>
              </div>
              {/* Precio × cantidad = subtotal — todos editables */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '0.25rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.52rem', color: '#64748b', marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Precio unit.
                  </div>
                  <input
                    type="number" min={0} value={item.precio}
                    onChange={e => updatePrecio(idx, +e.target.value)}
                    style={{
                      width: '100%', padding: '0.3rem 0.4rem', borderRadius: '6px',
                      border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK,
                      fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', paddingTop: '1rem' }}>×</span>
                <div>
                  <div style={{ fontSize: '0.52rem', color: '#64748b', marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {item.tipo === 'Alojamiento' ? 'Noches' : item.tipo === 'Traslado' ? 'Viajes' : 'Pax'}
                  </div>
                  <input
                    type="number" min={1} value={item.cantidad}
                    onChange={e => updateCantidad(idx, +e.target.value)}
                    style={{
                      width: '100%', padding: '0.3rem 0.4rem', borderRadius: '6px',
                      border: `1px solid ${BORDER_COLOR}`, background: INPUT_BG, color: TEXT_DARK,
                      fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', paddingTop: '1rem' }}>=</span>
                <div>
                  <div style={{ fontSize: '0.52rem', color: ORANGE, marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    Subtotal
                  </div>
                  <input
                    type="number" min={0} value={item.subtotal}
                    onChange={e => updateSubtotal(idx, +e.target.value)}
                    style={{
                      width: '100%', padding: '0.3rem 0.4rem', borderRadius: '6px',
                      border: `1px solid ${ORANGE}60`, background: '#FFF7ED', color: ORANGE,
                      fontSize: '0.75rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <div style={{
              marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `2px solid ${ORANGE}40`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: ORANGE }}>{formatCOP(total)}</span>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.78rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexDirection: 'column' }}>
            <button onClick={() => setVista('preview')} style={{
              width: '100%', padding: '0.7rem', borderRadius: '10px', border: 'none',
              background: '#DBEAFE', color: '#1e40af', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}>
              👁️ Vista previa
            </button>
            <button onClick={handleGuardar} disabled={saving || items.length === 0 || !cliente.nombre} style={{
              width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none',
              background: items.length === 0 || !cliente.nombre ? '#E2E8F0' : ORANGE,
              color: items.length === 0 || !cliente.nombre ? '#94a3b8' : '#fff',
              cursor: items.length === 0 || !cliente.nombre ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem', fontWeight: 700,
            }}>
              {saving ? 'Guardando...' : '💾 Guardar en Airtable'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
