export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(242, 240, 230, 0.08)',
      padding: '24px 20px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
        © {new Date().getFullYear()} Coordenadas Fútbol · Todos los derechos reservados
      </p>
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
