import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function Legal() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px', flex: 1 }}>

        <Link to="/" style={{ fontSize: '13px', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, textDecoration: 'none' }}>
          ← CoordeFutbol
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '28px', marginBottom: '8px' }}>
          Términos y condiciones
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginBottom: '40px' }}>
          Última actualización: junio de 2025
        </p>

        <Section titulo="1. Aceptación de los términos">
          Al crear una cuenta y usar CoordeFutbol, aceptás estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, no uses la aplicación.
        </Section>

        <Section titulo="2. Descripción del servicio">
          CoordeFutbol es una aplicación para coordinar partidos de fútbol entre grupos de amigos. Permite registrar partidos, llevar estadísticas, gestionar equipos y coordinar pagos de cancha.
        </Section>

        <Section titulo="3. Registro y cuenta">
          Para usar CoordeFutbol necesitás crear una cuenta con un mail válido y una contraseña. Sos responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Si detectás uso no autorizado, contactanos a marchioripedro1@gmail.com.
        </Section>

        <Section titulo="4. Uso aceptable">
          Te comprometés a usar CoordeFutbol de manera responsable. No podés usar la aplicación para actividades ilegales, para acosar a otros usuarios ni para cargar contenido inapropiado. Nos reservamos el derecho de suspender cuentas que violen estas condiciones.
        </Section>

        <Section titulo="5. Contenido del usuario">
          Sos responsable del contenido que cargás (nombre, foto de perfil, datos de partidos, etc.). Al subir contenido, nos otorgás una licencia para almacenarlo y mostrarlo dentro de la aplicación con el único fin de brindarte el servicio.
        </Section>

        <Section titulo="6. Disponibilidad del servicio">
          CoordeFutbol se brinda "tal cual está". No garantizamos disponibilidad ininterrumpida ni libre de errores. Podemos modificar o discontinuar funcionalidades en cualquier momento sin previo aviso.
        </Section>

        <Section titulo="7. Limitación de responsabilidad">
          CoordeFutbol no se hace responsable por pérdida de datos, daños indirectos ni perjuicios derivados del uso o la imposibilidad de uso de la aplicación.
        </Section>

        <Section titulo="8. Cambios a los términos">
          Podemos actualizar estos términos en cualquier momento. Si los cambios son significativos, te lo comunicaremos por mail. El uso continuado de la aplicación implica la aceptación de los nuevos términos.
        </Section>

        <Section titulo="9. Contacto">
          Para cualquier consulta sobre estos términos, escribinos a{' '}
          <a href="mailto:marchioripedro1@gmail.com" style={{ color: 'var(--color-lime)', textDecoration: 'none' }}>
            marchioripedro1@gmail.com
          </a>.
        </Section>

      </div>
      <Footer />
    </div>
  )
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-bone)', marginBottom: '8px' }}>
        {titulo}
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)', lineHeight: 1.7 }}>
        {children}
      </p>
    </div>
  )
}
