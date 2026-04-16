import React, { useState, useEffect } from 'react'
import '../styles/guiasai-theme.css'

interface NavigationBarProps {
  activeSectionId: string
  userInitials?: string
  userName?: string
  onProfileClick: () => void
  onLogout: () => void
  onLoginClick?: () => void
  onRegisterClick?: () => void
  isAuthenticated?: boolean
  quotationCount?: number
  onQuotationClick?: () => void
  panelLabel?: string // 🆕 Prop para personalizar el texto del botón
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeSectionId,
  onProfileClick,
  onLogout,
  onLoginClick,
  isAuthenticated = false,
  quotationCount = 0,
  onQuotationClick,
  panelLabel = "Mi Panel"
}) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`premium-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="brand-section">
          <a href="#" className="logo-premium" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <div className="logo-icon">
              <img src={`${(import.meta as any).env.BASE_URL}LOGO_GUIASAI.png`} alt="GuiaSAI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            </div>
            <div className="logo-text">
              <span className="logo-title">GuiaSAI</span>
              <span className="logo-subtitle">Business Hub</span>
            </div>
          </a>
        </div>

        <nav className="nav-premium">
          <a
            href="#alojamientos"
            className={`nav-link-premium ${activeSectionId === 'alojamientos' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('alojamientos')
            }}
          >
            <span>Alojamientos</span>
          </a>
          <a
            href="#tours"
            className={`nav-link-premium ${activeSectionId === 'tours' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('tours')
            }}
          >
            <span>Tours</span>
          </a>
          <a
            href="#paquetes"
            className={`nav-link-premium ${activeSectionId === 'paquetes' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('paquetes')
            }}
          >
            <span>Paquetes</span>
          </a>
          <a
            href="#cotizacion"
            className={`nav-link-premium ${activeSectionId === 'cotizacion' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('cotizacion')
            }}
          >
            <span>Cotizacion</span>
          </a>
        </nav>

        <div className="header-actions">
          <div className="quote-indicator" onClick={onQuotationClick} style={{ cursor: 'pointer' }}>
            <span>Mi Cotizacion</span>
            {quotationCount > 0 && (
              <div className="quote-badge">{quotationCount}</div>
            )}
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                className="user-avatar"
                onClick={onProfileClick}
                style={{
                  width: 'auto',
                  padding: '0 1.25rem',
                  borderRadius: '2rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {panelLabel}
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '2rem',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#ef4444'
                  el.style.color = '#ef4444'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#e2e8f0'
                  el.style.color = '#64748b'
                }}
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '2rem',
                border: '2px solid #FF6600',
                backgroundColor: 'transparent',
                color: '#FF6600',
                fontWeight: 'bold',
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.backgroundColor = '#FF6600'
                el.style.color = 'white'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.backgroundColor = 'transparent'
                el.style.color = '#FF6600'
              }}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
