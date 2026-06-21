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
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo.png" alt="Coordenadas Fútbol" style={{ height: 34, width: 'auto', display: 'block' }} />
        </Link>

        <nav className="header-nav" style={{ display: 'flex', flex: 1 }}>
          <NavLink to="/home" end style={linkStyle}>Inicio</NavLink>
          <NavLink to="/partido/nuevo" style={linkStyle}>Cargar</NavLink>
          <NavLink to="/jugadores" style={linkStyle}>Plantel</NavLink>
        </nav>

        {profile && (
          <Link to="/perfil" title={profile.apodo} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden',
              background: profile.avatar_color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '13px',
              fontWeight: 700, color: 'var(--color-carbon-deep)',
              border: '2px solid rgba(242,240,230,0.15)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.dorsal
              }
            </div>
          </Link>
        )}
      </div>
    </header>
  )
}
