import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Footer from '../components/Footer'

const features = [
  {
    titulo: 'Cargá partidos',
    desc: 'Dónde se jugó, el resultado, quién metió y cuántos. En unos segundos.',
  },
  {
    titulo: 'Tabla de goleadores',
    desc: 'Sabé quién está en racha y quién debe una. Se actualiza sola con cada partido.',
  },
  {
    titulo: 'Por temporada',
    desc: 'Filtrá por mes y revisá el historial completo. El grupo tiene memoria.',
  },
]

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-lime)',
  color: 'var(--color-carbon-deep)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '14px',
  padding: '14px 32px',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
}

export default function Landing() {
  const { session, profile, signOut } = useAuth()
  const loggedIn = !!(session && profile)

  return (
    <>
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 96px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <img
          src="/logo.png"
          alt="Coordenadas Fútbol"
          style={{
            height: 120,
            width: 'auto',
            display: 'block',
            margin: '0 auto 28px',
          }}
        />
        <p className="eyebrow" style={{ marginBottom: '14px' }}>Tu grupo. Tus partidos.</p>
        <h1 style={{ fontSize: '52px', lineHeight: 1.05, marginBottom: '20px' }}>
          Coordenadas<br />Fútbol
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--color-bone-dim)',
          maxWidth: '420px',
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}>
          Registrá cada partido, seguí quién está pateando más y mirá cómo va la temporada mes a mes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={loggedIn ? '/home' : '/login'} style={btnStyle}>
            {loggedIn ? 'Ir al tablero' : 'Entrar a mi grupo'}
          </Link>
          {loggedIn && (
            <button
              onClick={signOut}
              className="btn-ghost"
              style={{ padding: '14px 20px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px' }}
            >
              Salir
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        {features.map((f) => (
          <div key={f.titulo} className="panel" style={{ padding: '24px' }}>
            <p className="eyebrow" style={{ marginBottom: '10px' }}>{f.titulo}</p>
            <p style={{ color: 'var(--color-bone-dim)', fontSize: '14px', lineHeight: 1.65 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      {!loggedIn && (
        <p style={{
          textAlign: 'center',
          marginTop: '48px',
          fontSize: '13px',
          color: 'var(--color-bone-dim)',
          opacity: 0.6,
        }}>
          Creá tu jugador gratis — solo necesitás un mail.
        </p>
      )}
    </div>

    <Footer />
    </>
  )
}
