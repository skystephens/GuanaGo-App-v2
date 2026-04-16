import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuotationStore } from '../stores/quotationStore'
import {
  getVouchers, createVoucher, getServiciosTuristicosVoucher,
  type VoucherRecord, type VoucherFormData, type ServicioTuristico,
} from '../services/airtableService'
import { NavigationBar } from '../components/NavigationBar'
import '../styles/guiasai-theme.css'

const ORANGE = '#FF6600'
const TEAL = '#00c4cc'

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  TEAL,
  CONFIRMADO: '#22c55e',
  CANCELADO:  '#ef4444',
  COMPLETADO: '#6366f1',
}

const PUNTOS_ENCUENTRO = [
  'MUELLE CASA DE LA CULTURA',
  'MUELLE PORTOFINO',
  'MUELLE TONY',
  'AEROPUERTO GUSTAVO ROJAS PINILLA',
  'HOTEL DEL CLIENTE',
  'OTRO',
]

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO']

const EMPTY_FORM: VoucherFormData = {
  titular: '', telefono: '', email: '', pax: '',
  fecha: '', hora: '', puntoEncuentro: '',
  observaciones: '', notasAdicionales: '',
  tourId: '', estado: 'PENDIENTE',
}

export function VouchersListPage() {
  const navigate = useNavigate()
  const { isAuthenticated, agencyInfo, logout } = useQuotationStore()
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal nuevo voucher
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<VoucherFormData>(EMPTY_FORM)
  const [servicios, setServicios] = useState<ServicioTuristico[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    getVouchers(100).then(setVouchers).finally(() => setLoading(false))
    getServiciosTuristicosVoucher().then(setServicios)
  }, [isAuthenticated])

  const filtered = vouchers.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.titular.toLowerCase().includes(q) ||
      v.tourName.toLowerCase().includes(q) ||
      v.reservaNum.toLowerCase().includes(q) ||
      v.puntoEncuentro.toLowerCase().includes(q)
    )
  })

  const handleSave = async () => {
    if (!form.titular || !form.fecha || !form.tourId) {
      setSaveError('Completa los campos obligatorios: Titular, Fecha y Tour.')
      return
    }
    setSaving(true)
    setSaveError('')
    const created = await createVoucher(form)
    setSaving(false)
    if (created) {
      setVouchers((prev) => [created, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } else {
      setSaveError('Error al crear el voucher. Intenta de nuevo.')
    }
  }

  if (!isAuthenticated || !agencyInfo) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '4rem' }}>
      <NavigationBar
        activeSectionId="vouchers"
        userInitials={agencyInfo.name.substring(0, 2).toUpperCase()}
        userName={agencyInfo.name}
        onProfileClick={() => {}}
        onLogout={() => { logout(); navigate('/') }}
        isAuthenticated={true}
        quotationCount={0}
        onQuotationClick={() => navigate('/')}
      />

      <div className="container" style={{ marginTop: '100px' }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${ORANGE} 0%, #cc4400 100%)`,
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: `0 10px 25px -5px ${ORANGE}40`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <button
                onClick={() => navigate('/admin')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  marginBottom: '0.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                ← Volver al Panel
              </button>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                Vouchers de Reserva
              </h1>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                {filtered.length} vouchers {search ? 'encontrados' : 'en total'}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: '#fff',
                color: ORANGE,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              + Nuevo Voucher
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Buscar por cliente, tour, ID reserva, punto de encuentro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
              border: '2px solid #e2e8f0', fontSize: '0.9rem', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid #f1f5f9', borderTop: `3px solid ${ORANGE}`,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }} />
            Cargando vouchers…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {search ? `No se encontraron vouchers para "${search}"` : 'No hay vouchers registrados'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((v) => <VoucherRow key={v.id} voucher={v} />)}
          </div>
        )}
      </div>

      {/* Modal nuevo voucher */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '540px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                Nuevo Voucher
              </h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSaveError('') }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>
                ×
              </button>
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <FormRow label="Tour *">
                <select value={form.tourId} onChange={e => setForm({ ...form, tourId: e.target.value })} style={inputStyle}>
                  <option value="">— Selecciona un tour —</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </FormRow>

              <FormRow label="Titular (Nombre completo) *">
                <input type="text" value={form.titular} onChange={e => setForm({ ...form, titular: e.target.value })}
                  placeholder="Nombre completo del cliente" style={inputStyle} />
              </FormRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormRow label="Teléfono">
                  <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+57 300..." style={inputStyle} />
                </FormRow>
                <FormRow label="Pax">
                  <input type="text" value={form.pax} onChange={e => setForm({ ...form, pax: e.target.value })}
                    placeholder="2" style={inputStyle} />
                </FormRow>
              </div>

              <FormRow label="Email">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@email.com" style={inputStyle} />
              </FormRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormRow label="Fecha *">
                  <input type="text" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                    placeholder="ej: 15/04/2026" style={inputStyle} />
                </FormRow>
                <FormRow label="Hora de cita">
                  <input type="text" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })}
                    placeholder="ej: 9:00 AM" style={inputStyle} />
                </FormRow>
              </div>

              <FormRow label="Punto de encuentro">
                <select value={form.puntoEncuentro} onChange={e => setForm({ ...form, puntoEncuentro: e.target.value })} style={inputStyle}>
                  <option value="">— Selecciona punto —</option>
                  {PUNTOS_ENCUENTRO.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FormRow>

              <FormRow label="Estado">
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inputStyle}>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </FormRow>

              <FormRow label="Observaciones especiales">
                <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Ej: Pagan impuesto $20.000 por persona en efectivo al llegar"
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </FormRow>

              <FormRow label="Notas adicionales">
                <textarea value={form.notasAdicionales} onChange={e => setForm({ ...form, notasAdicionales: e.target.value })}
                  placeholder="Información adicional para el cliente"
                  rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </FormRow>

              {saveError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', color: '#dc2626', fontSize: '0.85rem' }}>
                  {saveError}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSaveError('') }}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: '0.75rem', background: `linear-gradient(135deg, ${ORANGE}, #cc4400)`, border: 'none', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creando…' : '🎫 Crear Voucher'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VoucherRow({ voucher }: { voucher: VoucherRecord }) {
  const estadoColor = ESTADO_COLORS[voucher.estado?.toUpperCase()] ?? TEAL
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '12px', padding: '1rem 1.25rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex',
      alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      border: '1px solid #f1f5f9',
    }}>
      <span style={{
        backgroundColor: estadoColor, color: '#fff', fontSize: '0.6rem',
        fontWeight: 700, letterSpacing: '0.08em', padding: '0.2rem 0.6rem',
        borderRadius: '999px', textTransform: 'uppercase', flexShrink: 0,
      }}>
        {voucher.estado || '—'}
      </span>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{voucher.titular || 'Sin nombre'}</div>
        <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.1rem' }}>{voucher.tourName || 'Servicio no especificado'}</div>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
        <Info label="ID" value={voucher.reservaNum} color={ORANGE} />
        <Info label="Pax" value={voucher.pax} />
        <Info label="Fecha" value={voucher.fecha} />
        <Info label="Hora" value={voucher.hora} color={TEAL} />
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', minWidth: '140px', maxWidth: '200px' }}>
        {voucher.puntoEncuentro}
      </div>
      <Link to={`/vouchers/${voucher.id}`} style={{
        padding: '0.5rem 1rem', backgroundColor: ORANGE, color: '#fff',
        borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
        fontSize: '0.8rem', flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        Ver →
      </Link>
    </div>
  )
}

function Info({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: color ?? '#1e293b', marginTop: '1px' }}>{value || '—'}</div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px',
  border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', color: '#1e293b',
}
