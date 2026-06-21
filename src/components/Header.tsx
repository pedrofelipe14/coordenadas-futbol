import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Header() {
  const { profile } = useAuth()

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 14px',
    fontFamily: 'var(--font-display)',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: isActive ? 'var(--color-lime)' : 'var(--color-bone-dim)',
    borderBottom: isActive ? '2px solid var(--color-lime)' : '2px solid transparent',
  })

  return (
    <header style={{
      borderBottom: '1px solid rgba(242, 240, 230, 0.08)',
      background: 'var(--color-carbon)',
    }}>
      <div className="header-inner" style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: '56px',
        gap: '20px',
      }}>
        {/* Logo + nombre app */}
        <Link to="/" className="header-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img src="/logo.png" alt="Coordenadas Fútbol" style={{ height: 34, width: 'auto', display: 'block' }} />
          <span className="header-app-name" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-bone)',
          }}>
            Coordenadas Fútbol
          </span>
        </Link>

        {/* Nav */}
        <nav className="header-nav" style={{ display: 'flex', flex: 1 }}>
          <NavLink to="/home" end style={linkStyle}>Inicio</NavLink>
          <NavLink to="/partido/nuevo" style={linkStyle}>Cargar</NavLink>
          <NavLink to="/jugadores" style={linkStyle}>Plantel</NavLink>
        </nav>

        {/* Perfil */}
        {profile && (
          <Link to="/perfil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden',
              background: profile.avatar_color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '12px',
              fontWeight: 700, color: 'var(--color-carbon-deep)',
              border: '2px solid rgba(242,240,230,0.15)', flexShrink: 0,
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.dorsal
              }
            </div>
            <span className="header-user-name" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-bone)' }}>
              {profile.apodo}
            </span>
          </Link>
        )}
      </div>
    </header>
  )
}
