import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { fetchJugadores, arrancarPartido } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import type { Profile } from '../types'

const EQUIPO_A = 'Sin pechera'
const EQUIPO_B = 'Con pechera'

function AvatarJugador({ jugador, size = 32 }: { jugador: Profile; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: jugador.avatar_color,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.38, fontWeight: 700,
      color: 'var(--color-carbon-deep)', flexShrink: 0,
    }}>
      {jugador.avatar_url
        ? <img src={jugador.avatar_url} alt={jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : jugador.dorsal
      }
    </div>
  )
}

export default function NuevoPartido() {
  const navigate = useNavigate()
  const { profile, esAdmin } = useAuth()

  if (!esAdmin) return <Navigate to="/home" replace />

  const [jugadores, setJugadores] = useState<Profile[]>([])
  const [lugar, setLugar] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [hora, setHora] = useState('')
  const [formato, setFormato] = useState<'5' | '7' | '9'>('5')
  const [costo, setCosto] = useState('')
  const [asignaciones, setAsignaciones] = useState<Map<string, 'A' | 'B'>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    fetchJugadores().then(setJugadores).catch(() => setError('No se pudo cargar el plantel.'))
  }, [])

  function toggleAsignacion(jugadorId: string, equipo: 'A' | 'B') {
    setAsignaciones((prev) => {
      const next = new Map(prev)
      if (next.get(jugadorId) === equipo) {
        next.delete(jugadorId)
      } else {
        next.set(jugadorId, equipo)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!profile) return

    if (!fecha) { setError('Poné la fecha del partido.'); return }

    const lineup = Array.from(asignaciones.entries()).map(([jugador_id, equipo]) => ({ jugador_id, equipo }))

    setGuardando(true)
    try {
      const id = await arrancarPartido({
        fecha,
        hora: hora || null,
        lugar: lugar.trim(),
        formato,
        equipo_saque: 'A',
        costo_cancha: costo ? Number(costo) : null,
        creado_por: profile.id,
        grupo_id: profile.grupo_id!,
        lineup,
      })
      navigate(`/partido/${id}`)
    } catch {
      setError('No se pudo arrancar el partido. Probá de nuevo.')
      setGuardando(false)
    }
  }

  const jugadoresA = jugadores.filter((j) => asignaciones.get(j.id) === 'A')
  const jugadoresB = jugadores.filter((j) => asignaciones.get(j.id) === 'B')

  const btnEquipo = (jugadorId: string, equipo: 'A' | 'B'): React.CSSProperties => {
    const sel = asignaciones.get(jugadorId) === equipo
    return {
      padding: '4px 10px',
      border: sel ? '1px solid var(--color-lime)' : '1px solid rgba(242,240,230,0.15)',
      borderRadius: 'var(--radius)',
      background: sel ? 'rgba(139,197,63,0.15)' : 'transparent',
      color: sel ? 'var(--color-lime)' : 'var(--color-bone-dim)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
      cursor: 'pointer',
    }
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>
      <p className="eyebrow" style={{ marginBottom: '8px' }}>Sección 1</p>
      <h2 style={{ fontSize: '24px', marginBottom: '28px' }}>Armar partido</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Info del partido */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>Info del partido</p>

          <div>
            <label htmlFor="lugar">Cancha / lugar</label>
            <input id="lugar" type="text" value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Ej: Complejo La Esquina" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="fecha">Fecha</label>
              <input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="hora">Hora</label>
              <input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="formato">Formato</label>
              <select id="formato" value={formato} onChange={(e) => setFormato(e.target.value as '5' | '7' | '9')}>
                <option value="5">Fútbol 5</option>
                <option value="7">Fútbol 7</option>
                <option value="9">Fútbol 9</option>
              </select>
            </div>
            <div>
              <label htmlFor="costo">Costo cancha</label>
              <input id="costo" type="number" min={0} value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
        </div>

        {/* Saque inicial */}
        <div className="panel" style={{ padding: '18px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '17px', color: 'var(--color-lime)', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Siempre saca Sin pechera
          </p>
        </div>

        {/* Equipos */}
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
            <p className="eyebrow">Equipos</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-bone-dim)' }}>
              <span style={{ color: 'var(--color-lime)' }}>SP</span> = Sin pechera &nbsp;
              <span style={{ color: 'var(--color-gold)' }}>CP</span> = Con pechera
            </div>
          </div>

          {jugadores.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>Cargando jugadores...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jugadores.map((j) => (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AvatarJugador jugador={j} size={30} />
                  <span style={{ flex: 1, fontSize: '14px' }}>{j.apodo}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" style={btnEquipo(j.id, 'A')} onClick={() => toggleAsignacion(j.id, 'A')}>SP</button>
                    <button
                      type="button"
                      style={{
                        ...btnEquipo(j.id, 'B'),
                        border: asignaciones.get(j.id) === 'B' ? '1px solid var(--color-gold)' : '1px solid rgba(242,240,230,0.15)',
                        color: asignaciones.get(j.id) === 'B' ? 'var(--color-gold)' : 'var(--color-bone-dim)',
                        background: asignaciones.get(j.id) === 'B' ? 'rgba(212,175,55,0.15)' : 'transparent',
                      }}
                      onClick={() => toggleAsignacion(j.id, 'B')}
                    >CP</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumen de equipos */}
          {(jugadoresA.length > 0 || jugadoresB.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-lime)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Sin pechera ({jugadoresA.length})
                </p>
                {jugadoresA.map((j) => <p key={j.id} style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>{j.apodo}</p>)}
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Con pechera ({jugadoresB.length})
                </p>
                {jugadoresB.map((j) => <p key={j.id} style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>{j.apodo}</p>)}
              </div>
            </div>
          )}
        </div>

        {error && <p style={{ color: '#E57368', fontSize: '13px' }}>{error}</p>}

        <button type="submit" className="btn" disabled={guardando}>
          {guardando ? 'Arrancando...' : 'Arrancar partido →'}
        </button>
      </form>
    </div>
  )
}
