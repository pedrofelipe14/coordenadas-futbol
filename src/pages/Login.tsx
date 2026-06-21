import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COLORES_DORSAL = ['#8BC53F', '#D4AF37', '#C0392B', '#2E86C1', '#B968C7', '#E67E22']

export default function Login() {
  const { refreshProfile } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apodo, setApodo] = useState('')
  const [dorsal, setDorsal] = useState('10')
  const [colorElegido, setColorElegido] = useState(COLORES_DORSAL[0])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Mail o contraseña incorrectos. Probá de nuevo.')
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
    if (!dorsalNum || dorsalNum < 1 || dorsalNum > 99) {
      setError('El dorsal tiene que ser un número entre 1 y 99.')
      return
    }

    setCargando(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(traducirError(signUpError.message))
      setCargando(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setError('No se pudo crear la cuenta. Probá de nuevo.')
      setCargando(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      apodo: apodo.trim(),
      dorsal: dorsalNum,
      avatar_color: colorElegido,
    })

    if (profileError) {
      if (profileError.message.includes('duplicate') || profileError.code === '23505') {
        setError('Ese apodo ya lo usa otro jugador del plantel. Elegí otro.')
      } else {
        setError('No se pudo crear el perfil de jugador. Probá de nuevo.')
      }
      setCargando(false)
      return
    }

    await refreshProfile()
    setCargando(false)
  }

  function traducirError(msg: string): string {
    if (msg.includes('already registered')) return 'Ese mail ya tiene una cuenta. Probá entrar.'
    if (msg.includes('Password should be')) return 'La contraseña tiene que tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate email')) return 'Ese mail no parece válido.'
    return 'Algo falló al crear la cuenta. Probá de nuevo.'
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
            ← Coordenadas Fútbol
          </Link>
        </div>

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
                    max={99}
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
        </form>
      </div>
    </div>
  )
}
