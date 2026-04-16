import React, { useState } from 'react'
import { X } from 'lucide-react'
import '../styles/guiasai-theme.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginAgency: (email: string, password: string) => void
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginAgency,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onLoginAgency(email, password)
    } catch (err) {
      setError('Error al iniciar sesión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Iniciar Sesión</h2>
          <button style={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          <p style={styles.subtitle}>Ingresa tus credenciales de agencia</p>
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="tu@agencia.com"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button
                type="button"
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ ...styles.button, ...styles.primaryButton }}
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '500px',
    width: '90%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--guiasai-text-dark)',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--guiasai-text-light)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: '24px',
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: 'var(--guiasai-text-dark)',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 102, 0, 0.05)',
      borderColor: 'var(--guiasai-primary)',
    },
  },
  optionIcon: {
    fontSize: '2.5rem',
  },
  optionText: {
    flex: 1,
    textAlign: 'left' as const,
  },
  optionTitle: {
    margin: '0 0 4px 0',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
  },
  optionDescription: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'var(--guiasai-text-light)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
    fontSize: '0.95rem',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: 'var(--guiasai-primary)',
    },
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '0.9rem',
    border: '1px solid #fcc',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e0e0e0',
  },
  backButton: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
    transition: 'background-color 0.2s ease',
  },
  submitButton: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: 'var(--guiasai-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: 'white',
    transition: 'background-color 0.2s ease',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '0.9rem',
    border: '1px solid #fcc',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  button: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    transition: 'background-color 0.2s ease',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    color: 'var(--guiasai-text-dark)',
  },
  primaryButton: {
    backgroundColor: 'var(--guiasai-primary)',
    color: 'white',
  },
}
