import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ContactInfoModalProps {
  onSubmit: (data: { name: string; phone: string; email: string }) => void
  onClose: () => void
  submitLabel?: string
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  onSubmit,
  onClose,
  submitLabel = 'Descargar Cotización',
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: { [key: string]: string } = {}
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    if (!email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un email válido'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onSubmit({ name, phone, email })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Información de Contacto</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.description}>
            Por favor, ingresa tu información de contacto para descargar la cotización.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre Completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: '' })
              }}
              style={{ ...styles.input, borderColor: errors.name ? '#ff4444' : '#ddd' }}
              placeholder="Ej: María García López"
            />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Teléfono de Contacto *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (errors.phone) setErrors({ ...errors, phone: '' })
              }}
              style={{ ...styles.input, borderColor: errors.phone ? '#ff4444' : '#ddd' }}
              placeholder="Ej: +57 3001234567"
            />
            {errors.phone && <span style={styles.error}>{errors.phone}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: '' })
              }}
              style={{ ...styles.input, borderColor: errors.email ? '#ff4444' : '#ddd' }}
              placeholder="Ej: contacto@agencia.com"
            />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" style={styles.submitButton}>
              {submitLabel}
            </button>
          </div>
        </form>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2100,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '2px solid #f0f0f0',
    backgroundColor: 'var(--guiasai-bg-light)',
  },
  title: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--guiasai-primary)',
    fontFamily: "'Poppins', sans-serif",
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  form: {
    padding: '24px',
  },
  description: {
    margin: '0 0 20px 0',
    fontSize: '0.95rem',
    color: '#666',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#555',
    marginBottom: '8px',
    fontFamily: "'Poppins', sans-serif",
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  error: {
    display: 'block',
    color: '#ff4444',
    fontSize: '0.8rem',
    marginTop: '4px',
    fontWeight: 500,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    border: '2px solid #ddd',
    backgroundColor: 'white',
    color: '#666',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
  submitButton: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    backgroundColor: 'var(--guiasai-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
}
