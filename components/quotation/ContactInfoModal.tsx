import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ContactInfoModalProps {
  onSubmit: (data: { name: string; phone: string; email: string }) => void;
  onClose: () => void;
  submitLabel?: string;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  onSubmit,
  onClose,
  submitLabel = 'Descargar Cotización',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({ name, phone, email });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
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
            <label>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>
          <div style={styles.formGroup}>
            <label>Teléfono</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} />
            {errors.phone && <span style={styles.error}>{errors.phone}</span>}
          </div>
          <div style={styles.formGroup}>
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>
          <button type="submit" style={styles.submitButton}>{submitLabel}</button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: 32,
    minWidth: 320,
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
  submitButton: {
    background: 'var(--guiasai-primary, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 0',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    marginTop: 12,
  },
};
