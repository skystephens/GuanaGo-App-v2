import React, { useState, CSSProperties } from 'react'
import { Menu, User, LogOut } from 'lucide-react'
import '../styles/guiasai-theme.css'

interface NavigationBarProps {
  activeTab: 'accommodations' | 'tours' | 'transports'
  onTabChange: (tab: 'accommodations' | 'tours' | 'transports') => void
  userInitials?: string
  userName?: string
  onProfileClick: () => void
  onLogout: () => void
  onLoginClick?: () => void
  isAuthenticated?: boolean
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'AG',
  userName = 'Mi Agencia',
  onProfileClick,
  onLogout,
  onLoginClick,
  isAuthenticated = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>
          <img src="https://guiasanandresislas.com/wp-content/uploads/2025/02/Logo-GuiaSAI-avisoa.png" alt="GuiaSAI" style={styles.logoImg} />
        </div>

        {/* Desktop Menu */}
        <div style={styles.menuDesktop}>
          <button
            onClick={() => onTabChange('accommodations')}
            style={{
              ...styles.navLink,
              ...(activeTab === 'accommodations' ? styles.navLinkActive : {}),
            } as CSSProperties}
          >
            🏨 Alojamientos
          </button>
          <button
            onClick={() => onTabChange('tours')}
            style={{
              ...styles.navLink,
              ...(activeTab === 'tours' ? styles.navLinkActive : {}),
            } as CSSProperties}
          >
            🎫 Tours
          </button>
          <button
            onClick={() => onTabChange('transports')}
            style={{
              ...styles.navLink,
              ...(activeTab === 'transports' ? styles.navLinkActive : {}),
            } as CSSProperties}
          >
            🚕 Traslados
          </button>
        </div>

        {/* User Profile */}
        <div style={styles.userSection}>
          {isAuthenticated ? (
            <>
              <button style={styles.profileButton} onClick={onProfileClick}>
                <div style={styles.profileAvatar}>{userInitials}</div>
                <div style={styles.profileInfo}>
                  <small style={styles.profileLabel}>Bienvenido</small>
                  <span style={styles.profileName}>{userName}</span>
                </div>
                <User size={18} />
              </button>

              <button
                style={styles.logoutButton}
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              style={styles.loginButton}
              onClick={onLoginClick}
            >
              Iniciar Sesión
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          style={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <button
            onClick={() => {
              onTabChange('accommodations')
              setMobileMenuOpen(false)
            }}
            style={styles.mobileMenuItem}
          >
            🏨 Alojamientos
          </button>
          <button
            onClick={() => {
              onTabChange('tours')
              setMobileMenuOpen(false)
            }}
            style={styles.mobileMenuItem}
          >
            🎫 Tours
          </button>
          <button
            onClick={() => {
              onTabChange('transports')
              setMobileMenuOpen(false)
            }}
            style={styles.mobileMenuItem}
          >
            🚕 Traslados
          </button>
        </div>
      )}
    </nav>
  )
}

const styles: { [key: string]: CSSProperties } = {
  navbar: {
    backgroundColor: 'var(--guiasai-bg-white)',
    boxShadow: 'var(--shadow-md)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'var(--spacing-md)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    cursor: 'pointer',
  },
  logoImg: {
    height: '40px',
    width: 'auto',
  },
  menuDesktop: {
    display: 'flex',
    gap: 'var(--spacing-lg)',
    alignItems: 'center',
  },
  navLink: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    color: 'var(--guiasai-primary)',
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    borderBottom: '3px solid var(--guiasai-primary)',
  },
  userSection: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    cursor: 'pointer',
    padding: 'var(--spacing-sm)',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--guiasai-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  profileInfo: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
  },
  profileLabel: {
    color: 'var(--guiasai-text-light)',
    fontSize: '0.75rem',
  },
  profileName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: 'var(--guiasai-text-dark)',
    fontSize: '0.9rem',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--guiasai-text-dark)',
    padding: 'var(--spacing-sm)',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  mobileMenuToggle: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--guiasai-primary)',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    backgroundColor: 'var(--guiasai-bg-light)',
    padding: 'var(--spacing-md)',
    borderTop: '1px solid var(--guiasai-border)',
  },
  mobileMenuItem: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--guiasai-border)',
    cursor: 'pointer',
    padding: 'var(--spacing-md)',
    textAlign: 'left',
    color: 'var(--guiasai-text-dark)',
    fontWeight: 600,
  },
  loginButton: {
    backgroundColor: 'var(--guiasai-primary)',
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  },
}

