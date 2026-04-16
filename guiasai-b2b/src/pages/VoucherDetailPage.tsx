import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVoucherById, type VoucherRecord } from '../services/airtableService'
import { VoucherTicket } from '../components/VoucherTicket'

export function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [voucher, setVoucher] = useState<VoucherRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return }
    getVoucherById(id)
      .then((data) => {
        if (data) setVoucher(data)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={spinnerWrapStyle}>
          <div style={spinnerStyle} />
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem', fontSize: '0.85rem' }}>
            Cargando voucher…
          </p>
        </div>
      </div>
    )
  }

  if (error || !voucher) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Voucher no encontrado</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            El ID proporcionado no corresponde a ninguna reserva registrada.
          </p>
          <Link to="/vouchers" style={linkBtnStyle}>
            Ver todos los vouchers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Barra superior */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 0.25rem',
      }}>
        <Link to="/vouchers" style={{
          color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          ← Todos los vouchers
        </Link>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#FF6600',
          textTransform: 'uppercase',
        }}>
          GuiaSAI
        </span>
      </div>

      <VoucherTicket voucher={voucher} />

      {/* Botón imprimir / compartir */}
      <div style={{
        maxWidth: '420px',
        width: '100%',
        margin: '1rem auto 0',
        display: 'flex',
        gap: '0.75rem',
      }}>
        <button
          onClick={() => window.print()}
          style={actionBtnStyle}
        >
          🖨 Imprimir
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `Voucher ${voucher.reservaNum}`, url: window.location.href })
            } else {
              navigator.clipboard.writeText(window.location.href)
              alert('Enlace copiado al portapapeles')
            }
          }}
          style={{ ...actionBtnStyle, backgroundColor: '#00c4cc', color: '#fff', border: 'none' }}
        >
          🔗 Compartir
        </button>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f0fdfe',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem 1rem 3rem',
}

const spinnerWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255,102,0,0.2)',
  borderTop: '3px solid #FF6600',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.5rem',
  backgroundColor: '#FF6600',
  color: '#fff',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
}

const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  backgroundColor: '#fff',
  color: '#1e293b',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
}
