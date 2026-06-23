import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COLORES_DORSAL = ['#8BC53F', '#D4AF37', '#C0392B', '#2E86C1', '#B968C7', '#E67E22']

export default function Login() {
  const { refreshProfile } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'crear' | 'recuperar'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apodo, setApodo] = useState('')
  const [dorsal, setDorsal] = useState('10')
  const [colorElegido, setColorElegido] = useState(COLORES_DORSAL[0])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cuentaCreada, setCuentaCreada] = useState(false)
  const [linkEnviado, setLinkEnviado] = useState(false)

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Todavía no confirmaste tu mail. Revisá tu bandeja de entrada.')
      } else {
        setError('Mail o contraseña incorrectos. Probá de nuevo.')
      }
    }
    setCargando(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!apodo.trim()) {
      setError('Poné un apodo de jugador.')
      return
    }
    const dorsalNum = parseInt(dorsal, 10)
    if (!dorsalNum || dorsalNum < 1 || dorsalNum > 999) {
      setError('El dorsal tiene que ser un número entre 1 y 999.')
      return
    }

    setCargando(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          apodo: apodo.trim(),
          dorsal: dorsalNum,
          avatar_color: colorElegido,
        },
      },
    })

    if (signUpError) {
      setError(traducirError(signUpError.message))
      setCargando(false)
      return
    }

    setCuentaCreada(true)
    setCargando(false)
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) {
      setError(`No se pudo enviar el mail: ${error.message}`)
      setCargando(false)
      return
    }
    setLinkEnviado(true)
    setCargando(false)
  }

  function traducirError(msg: string): string {
    if (msg.includes('already registered') || msg.includes('User already registered')) return 'Ese mail ya tiene una cuenta. Probá entrar.'
    if (msg.includes('Password should be')) return 'La contraseña tiene que tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate email') || msg.includes('invalid format')) return 'Ese mail no parece válido.'
    if (msg.includes('Signups not allowed') || msg.includes('signup_disabled') || msg.includes('not enabled')) return 'El registro está desactivado en este momento.'
    if (msg.includes('Email rate limit') || msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos y volvé a intentarlo.'
    if (msg.includes('SMTP') || msg.includes('smtp') || msg.includes('email') || msg.includes('send')) return 'Hubo un problema al enviar el mail de confirmación. Revisá la configuración de SMTP en Supabase.'
    return `Error al crear la cuenta: ${msg}`
  }

  if (cuentaCreada) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: colorElegido, margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px',
            color: 'var(--color-carbon-deep)',
          }}>
            {dorsal}
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>¡Cuenta creada!</h2>
          <p style={{ color: 'var(--color-bone-dim)', marginBottom: '6px', fontSize: '15px' }}>
            Bienvenido al plantel, <span style={{ color: 'var(--color-lime)', fontWeight: 600 }}>{apodo}</span>.
          </p>
          <p style={{ color: 'var(--color-bone-dim)', marginBottom: '28px', fontSize: '14px' }}>
            Revisá tu mail en <strong style={{ color: 'var(--color-bone)' }}>{email}</strong> para confirmar tu cuenta antes de entrar.
          </p>
          <button onClick={() => setCuentaCreada(false)} className="btn" style={{ width: '100%' }}>
            Ya confirmé, quiero entrar →
          </button>
        </div>
      </div>
    )
  }

  if (linkEnviado) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Revisá tu mail</h2>
          <p style={{ color: 'var(--color-bone-dim)', marginBottom: '24px', fontSize: '14px' }}>
            Te mandamos un link a <strong style={{ color: 'var(--color-bone)' }}>{email}</strong> para que puedas cambiar tu contraseña.
          </p>
          <button
            onClick={() => { setLinkEnviado(false); setModo('entrar') }}
            className="btn-ghost"
            style={{ padding: '10px 24px' }}
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ marginBottom: '28px' }}>
          <Link
            to="/"
            style={{
              fontSize: '13px',
              color: 'var(--color-bone-dim)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            ← CoordeFutbol
          </Link>
        </div>

        {modo !== 'recuperar' && (
          <div className="panel" style={{ padding: '4px', marginBottom: '20px' }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => { setModo('entrar'); setError(null) }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: modo === 'entrar' ? 'var(--color-panel-raised)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: modo === 'entrar' ? 'var(--color-lime)' : 'var(--color-bone-dim)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '13px',
                }}
              >
                Entrar
              </button>
              <button
                onClick={() => { setModo('crear'); setError(null) }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: modo === 'crear' ? 'var(--color-panel-raised)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: modo === 'crear' ? 'var(--color-lime)' : 'var(--color-bone-dim)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '13px',
                }}
              >
                Crear jugador
              </button>
            </div>
          </div>
        )}

        {modo === 'recuperar' ? (
          <form
            onSubmit={handleRecuperar}
            className="panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Recuperar contraseña</p>
              <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>
                Te mandamos un link para cambiarla.
              </p>
            </div>
            <div>
              <label htmlFor="email-rec">Mail</label>
              <input
                id="email-rec"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@mail.com"
                required
                autoFocus
              />
            </div>
            {error && <p style={{ color: '#E57368', fontSize: '13px' }}>{error}</p>}
            <button type="submit" className="btn" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar link'}
            </button>
            <button
              type="button"
              onClick={() => { setModo('entrar'); setError(null) }}
              className="btn-ghost"
              style={{ fontSize: '13px' }}
            >
              Volver al login
            </button>
          </form>
        ) : (
          <form
            onSubmit={modo === 'entrar' ? handleEntrar : handleCrear}
            className="panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {modo === 'crear' && (
              <>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: colorElegido,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--color-carbon-deep)',
                  }}>
                    {dorsal || '·'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="dorsal">Dorsal</label>
                    <input
                      id="dorsal"
                      type="number"
                      min={1}
                      max={999}
                      value={dorsal}
                      onChange={(e) => setDorsal(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {COLORES_DORSAL.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorElegido(c)}
                      aria-label={`Elegir color ${c}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c,
                        border: colorElegido === c ? '2px solid var(--color-bone)' : '2px solid transparent',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>

                <div>
                  <label htmlFor="apodo">Apodo de jugador</label>
                  <input
                    id="apodo"
                    type="text"
                    value={apodo}
                    onChange={(e) => setApodo(e.target.value)}
                    placeholder="Ej: Pity, El Tanque, Cone"
                    maxLength={24}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email">Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@mail.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p style={{ color: '#E57368', fontSize: '13px' }}>{error}</p>
            )}

            <button type="submit" className="btn" disabled={cargando} style={{ marginTop: '8px' }}>
              {cargando ? 'Un momento...' : modo === 'entrar' ? 'Entrar a la cancha' : 'Crear mi jugador'}
            </button>

            {modo === 'entrar' && (
              <button
                type="button"
                onClick={() => { setModo('recuperar'); setError(null) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-bone-dim)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '0',
                  textAlign: 'center',
                  opacity: 0.7,
                }}
              >
                Olvidé mi contraseña
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
