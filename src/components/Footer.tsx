import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(242, 240, 230, 0.08)',
      padding: '24px 20px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginBottom: '8px' }}>
        © {new Date().getFullYear()} CoordeFutbol · Todos los derechos reservados
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '8px' }}>
        <Link to="/legal" style={{ fontSize: '12px', color: 'var(--color-bone-dim)', opacity: 0.7, textDecoration: 'none' }}>
          Términos y condiciones
        </Link>
        <Link to="/privacidad" style={{ fontSize: '12px', color: 'var(--color-bone-dim)', opacity: 0.7, textDecoration: 'none' }}>
          Política de privacidad
        </Link>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', opacity: 0.55 }}>
        Desarrollado por{' '}
        <a
          href="mailto:marchioripedro1@gmail.com"
          style={{ color: 'var(--color-lime)', textDecoration: 'none' }}
        >
          Pedro Marchiori
        </a>
      </p>
    </footer>
  )
}
