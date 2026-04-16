import React, { useState } from 'react'
import { X } from 'lucide-react'

type TabId = 'login' | 'register'

interface AuthModalProps {
  onClose: () => void
  onLogin: (email: string, password: string) => void
  onRegister: (data: { name: string; phone: string; email: string }) => void
  defaultTab?: TabId
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLogin,
  onRegister,
  defaultTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  // ── Login state ──
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // ── Register state ──
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})
  const [regLoading, setRegLoading] = useState(false)

  // ── Handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim()) {
      setLoginError('El email es requerido')
      return
    }
    if (!loginPassword.trim()) {
      setLoginError('La contraseña es requerida')
      return
    }
    setLoginLoading(true)
    setLoginError('')
    try {
      await onLogin(loginEmail.trim(), loginPassword)
    } catch {
      setLoginError('Error al iniciar sesión. Por favor intenta de nuevo.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!regName.trim()) errors.name = 'El nombre es requerido'
    if (!regPhone.trim()) errors.phone = 'El teléfono es requerido'
    if (!regEmail.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      errors.email = 'Ingresa un email válido'
    }
    if (Object.keys(errors).length > 0) {
      setRegErrors(errors)
      return
    }
    setRegLoading(true)
    try {
      await onRegister({ name: regName.trim(), phone: regPhone.trim(), email: regEmail.trim() })
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoRow}>
            <span style={s.logoText}>GuiaSAI</span>
            <span style={s.logoDot}>·</span>
            <span style={s.logoSub}>Business Hub</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {([
            { id: 'login', label: 'Iniciar Sesión' },
            { id: 'register', label: 'Registrarse' },
          ] as { id: TabId; label: string }[]).map(tab => (
            <button
              key={tab.id}
              style={{
                ...s.tab,
                ...(activeTab === tab.id ? s.tabActive : {}),
              }}
              onClick={() => { setActiveTab(tab.id); setLoginError(''); setRegErrors({}) }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Iniciar Sesión ── */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={s.body}>
            <p style={s.hint}>
              Accede con el email de tu agencia para desbloquear tarifas confidenciales y el panel de gestión.
            </p>

            <div style={s.formGroup}>
              <label style={s.label}>Email de la agencia</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginError('') }}
                style={{ ...s.input, borderColor: loginError ? '#ff4444' : '#ddd' }}
                placeholder="tu@agencia.com"
                autoFocus
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginError('') }}
                  style={{ ...s.input, borderColor: loginError ? '#ff4444' : '#ddd', paddingRight: '44px' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888',
                    fontSize: '0.85rem',
                    padding: 0,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {loginError && <span style={s.error}>{loginError}</span>}
            </div>

            <button type="submit" style={s.primaryBtn} disabled={loginLoading}>
              {loginLoading ? 'Verificando...' : 'Ingresar'}
            </button>

            <p style={s.switchHint}>
              ¿No tienes cuenta?{' '}
              <span style={s.switchLink} onClick={() => setActiveTab('register')}>
                Regístrate aquí
              </span>
            </p>
          </form>
        )}

        {/* ── Registrarse ── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={s.body}>
            <p style={s.hint}>
              Ingresa tus datos para guardar tu cotización y que nuestro equipo pueda contactarte.
            </p>

            <div style={s.formGroup}>
              <label style={s.label}>Nombre completo *</label>
              <input
                type="text"
                value={regName}
                onChange={e => { setRegName(e.target.value); setRegErrors(p => ({ ...p, name: '' })) }}
                style={{ ...s.input, borderColor: regErrors.name ? '#ff4444' : '#ddd' }}
                placeholder="Ej: María García López"
                autoFocus
              />
              {regErrors.name && <span style={s.error}>{regErrors.name}</span>}
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Teléfono / WhatsApp *</label>
              <input
                type="tel"
                value={regPhone}
                onChange={e => { setRegPhone(e.target.value); setRegErrors(p => ({ ...p, phone: '' })) }}
                style={{ ...s.input, borderColor: regErrors.phone ? '#ff4444' : '#ddd' }}
                placeholder="Ej: +57 300 123 4567"
              />
              {regErrors.phone && <span style={s.error}>{regErrors.phone}</span>}
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Email *</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({ ...p, email: '' })) }}
                style={{ ...s.input, borderColor: regErrors.email ? '#ff4444' : '#ddd' }}
                placeholder="Ej: contacto@tuempresa.com"
              />
              {regErrors.email && <span style={s.error}>{regErrors.email}</span>}
            </div>

            <button type="submit" style={s.primaryBtn} disabled={regLoading}>
              {regLoading ? 'Guardando...' : 'Continuar'}
            </button>

            <p style={s.switchHint}>
              ¿Ya tienes cuenta?{' '}
              <span style={s.switchLink} onClick={() => setActiveTab('login')}>
                Iniciar sesión
              </span>
            </p>
          </form>
        )}

      </div>
    </div>
  )
}

// ── Estilos ────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2200,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '14px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #f0f0f0',
    background: 'linear-gradient(135deg, #fff5f0, #ffffff)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logoText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '1.2rem',
    color: '#FF6600',
  },
  logoDot: {
    color: '#ccc',
    fontSize: '1.2rem',
  },
  logoSub: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.8rem',
    color: '#999',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #f0f0f0',
  },
  tab: {
    flex: 1,
    padding: '14px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#aaa',
    transition: 'all 0.2s',
    marginBottom: '-2px',
  },
  tabActive: {
    color: '#FF6600',
    borderBottomColor: '#FF6600',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  hint: {
    margin: '0 0 20px 0',
    fontSize: '0.88rem',
    color: '#777',
    lineHeight: 1.5,
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#555',
    marginBottom: '6px',
    fontFamily: "'Poppins', sans-serif",
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '0.95rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  error: {
    display: 'block',
    color: '#ff4444',
    fontSize: '0.78rem',
    marginTop: '4px',
    fontWeight: 500,
  },
  primaryBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#FF6600',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  switchHint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '16px',
  },
  switchLink: {
    color: '#FF6600',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
