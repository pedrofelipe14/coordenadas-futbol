import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Header() {
  const { profile, grupo, signOut } = useAuth()
  const [copiado, setCopiado] = useState(false)

  function copiarCodigo() {
    if (!grupo) return
    navigator.clipboard.writeText(grupo.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

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
        justifyContent: 'space-between',
        height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <img
                src="/logo.png"
                alt="Coordenadas Fútbol"
                style={{ height: 38, width: 'auto', display: 'block' }}
              />
            </Link>
            <div className="header-brand-text">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <h1 style={{ fontSize: '15px', lineHeight: 1, color: 'var(--color-bone)' }}>Coordenadas Fútbol</h1>
              </Link>
              {grupo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-bone-dim)', letterSpacing: '0.04em' }}>
                    {grupo.nombre}
                  </p>
                  <button
                    onClick={copiarCodigo}
                    title="Copiar código del equipo"
                    style={{
                      background: 'var(--color-panel-raised)',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '1px 6px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: copiado ? 'var(--color-lime)' : 'var(--color-bone-dim)',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                  >
                    {copiado ? '¡Copiado!' : grupo.codigo}
                  </button>
                </div>
              )}
            </div>
          </div>
          <nav className="header-nav" style={{ display: 'flex' }}>
            <NavLink to="/home" end style={linkStyle}>Inicio</NavLink>
            <NavLink to="/partido/nuevo" style={linkStyle}>Cargar</NavLink>
            <NavLink to="/jugadores" style={linkStyle}>Plantel</NavLink>
          </nav>
        </div>

        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden',
                background: profile.avatar_color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '12px',
                fontWeight: 700, color: 'var(--color-carbon-deep)', flexShrink: 0,
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
            <button
              onClick={signOut}
              className="btn-ghost header-signout"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
