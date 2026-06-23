import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function Privacidad() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px', flex: 1 }}>

        <Link to="/" style={{ fontSize: '13px', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, textDecoration: 'none' }}>
          ← CoordeFutbol
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '28px', marginBottom: '8px' }}>
          Política de privacidad
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginBottom: '40px' }}>
          Última actualización: junio de 2025
        </p>

        <Section titulo="1. Qué datos recopilamos">
          Al registrarte y usar CoordeFutbol recopilamos los siguientes datos:
          <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Cuenta:</strong> dirección de mail y contraseña (encriptada).</li>
            <li><strong>Perfil de jugador:</strong> apodo, número de dorsal, color de avatar y foto de perfil (opcional).</li>
            <li><strong>Actividad:</strong> partidos jugados, goles, resultados y pagos de cancha registrados dentro de la app.</li>
          </ul>
        </Section>

        <Section titulo="2. Cómo usamos tus datos">
          Usamos tus datos exclusivamente para brindar el servicio de CoordeFutbol:
          <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Mostrarte y a tu grupo las estadísticas y el historial de partidos.</li>
            <li>Enviarte mails de confirmación de cuenta y recuperación de contraseña.</li>
            <li>Gestionar los pagos de cancha dentro de tu grupo.</li>
          </ul>
          No vendemos ni compartimos tus datos con terceros con fines comerciales.
        </Section>

        <Section titulo="3. Dónde se almacenan tus datos">
          Tus datos se almacenan en <strong>Supabase</strong>, una plataforma de base de datos segura con servidores en la nube. Los datos están protegidos con autenticación y políticas de acceso que garantizan que solo vos y los miembros de tu grupo puedan ver la información que les corresponde.
        </Section>

        <Section titulo="4. Fotos de perfil">
          Las fotos de perfil que subís se almacenan en Supabase Storage. Son visibles para los miembros de tu grupo. Podés eliminar o cambiar tu foto en cualquier momento desde tu perfil.
        </Section>

        <Section titulo="5. Mails transaccionales">
          Usamos <strong>Gmail SMTP</strong> para enviar mails de confirmación de cuenta y recuperación de contraseña. No usamos tu mail para enviar publicidad ni newsletters.
        </Section>

        <Section titulo="6. Tus derechos">
          Tenés derecho a:
          <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Acceder a los datos que tenemos sobre vos.</li>
            <li>Solicitar la corrección de datos incorrectos.</li>
            <li>Solicitar la eliminación de tu cuenta y todos tus datos.</li>
          </ul>
          Para ejercer cualquiera de estos derechos, contactanos a{' '}
          <a href="mailto:marchioripedro1@gmail.com" style={{ color: 'var(--color-lime)', textDecoration: 'none' }}>
            marchioripedro1@gmail.com
          </a>.
        </Section>

        <Section titulo="7. Cookies y almacenamiento local">
          CoordeFutbol no usa cookies de seguimiento ni herramientas de analítica de terceros. No rastreamos tu comportamiento fuera de la aplicación.{'\n\n'}
          Sin embargo, usamos <strong>cookies técnicas de sesión</strong> necesarias para el funcionamiento de la app. Estas cookies son generadas por Supabase (nuestro proveedor de autenticación) y se usan exclusivamente para mantener tu sesión iniciada mientras usás la aplicación. Sin estas cookies, no podría funcionar el sistema de login. No contienen información personal más allá de un identificador de sesión encriptado, y se eliminan automáticamente al cerrar sesión.
        </Section>

        <Section titulo="8. Retención de datos">
          Tus datos se conservan mientras tengas una cuenta activa en CoordeFutbol. Si solicitás la eliminación de tu cuenta, borraremos todos tus datos personales (perfil, foto, estadísticas y actividad) dentro de los 30 días siguientes a tu solicitud. Los datos anonimizados o agregados (como totales de partidos del grupo) pueden conservarse sin que sean identificables con vos.
        </Section>

        <Section titulo="10. Menores de edad">
          CoordeFutbol no está dirigida a menores de 13 años. Si tenés menos de 13 años, no uses la aplicación.
        </Section>

        <Section titulo="11. Cambios a esta política">
          Podemos actualizar esta política en cualquier momento. Si los cambios son significativos, te lo comunicaremos por mail. La fecha de última actualización siempre estará visible al inicio de esta página.
        </Section>

        <Section titulo="12. Contacto">
          Para consultas sobre privacidad o solicitudes de eliminación de datos, escribinos a{' '}
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
      <div style={{ fontSize: '14px', color: 'var(--color-bone-dim)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}
