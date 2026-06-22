import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPartido, fetchJugadores, cerrarPartido, borrarPartido, updateJugadaUrl } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import type { PartidoDetalle, PartidoJugadorConPerfil, Profile } from '../types'
import DevBadge from '../components/DevBadge'

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function formatearFechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  return `${parseInt(dia, 10)} de ${NOMBRES_MES[parseInt(mes, 10) - 1]} de ${anio}`
}

function AvatarJugador({ jugador, size = 30 }: { jugador: Profile; size?: number }) {
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

function LineupColumna({ titulo, color, jugadores }: { titulo: string; color: string; jugadores: PartidoJugadorConPerfil[] }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {titulo} ({jugadores.length})
      </p>
      {jugadores.length === 0
        ? <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>—</p>
        : jugadores.map((pj) => (
          <div key={pj.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <AvatarJugador jugador={pj.jugador} size={26} />
            <span style={{ fontSize: '13px', color: pj.jugador.es_dev ? 'var(--color-gold)' : pj.jugador.es_admin ? 'var(--color-lime)' : undefined }}>{pj.jugador.apodo}</span>
            {pj.jugador.es_dev && <DevBadge />}
          </div>
        ))
      }
    </div>
  )
}

interface FilaGol { jugador_id: string; equipo: 'A' | 'B' | ''; cantidad: string }
interface FilaJugada { descripcion: string; jugador_id: string; minuto: string; url: string }

export default function DetallePartido() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { esAdmin } = useAuth()
  const [partido, setPartido] = useState<PartidoDetalle | null>(null)
  const [jugadores, setJugadores] = useState<Profile[]>([])
  const [cargando, setCargando] = useState(true)
  const [cerrando, setCerrando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [guardandoCierre, setGuardandoCierre] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)

  // Edición inline de URL en jugadas épicas
  const [jugadaEditando, setJugadaEditando] = useState<string | null>(null)
  const [urlEditando, setUrlEditando] = useState('')
  const [guardandoUrl, setGuardandoUrl] = useState(false)

  // Form de cierre
  const [filasGol, setFilasGol] = useState<FilaGol[]>([])
  const [filasJugada, setFilasJugada] = useState<FilaJugada[]>([])

  const golesA = filasGol.filter((f) => f.equipo === 'A').reduce((acc, f) => acc + (parseInt(f.cantidad) || 1), 0)
  const golesB = filasGol.filter((f) => f.equipo === 'B').reduce((acc, f) => acc + (parseInt(f.cantidad) || 1), 0)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchPartido(id), fetchJugadores()]).then(([p, j]) => {
      setPartido(p)
      setJugadores(j)
      setCargando(false)
    })
  }, [id])

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault()
    if (!partido) return
    setErrorCierre(null)

    // Filtramos filas inválidas en vez de bloquear
    const golesValidos = filasGol.filter((f) => f.jugador_id)
    const jugadasValidas = filasJugada.filter((f) => f.descripcion.trim())

    setGuardandoCierre(true)
    try {
      await cerrarPartido({
        id: partido.id,
        goles_a: golesA,
        goles_b: golesB,
        goles: golesValidos.map((f) => ({
          jugador_id: f.jugador_id,
          equipo: (f.equipo || null) as 'A' | 'B' | null,
          minuto: null,
          cantidad: parseInt(f.cantidad) || 1,
        })),
        jugadas: jugadasValidas.map((f) => ({
          descripcion: f.descripcion.trim(),
          jugador_id: f.jugador_id || null,
          minuto: f.minuto ? parseInt(f.minuto, 10) : null,
          url: f.url.trim() || null,
        })),
      })
      const actualizado = await fetchPartido(partido.id)
      setPartido(actualizado)
      setCerrando(false)
    } catch (e) {
      const detalle = e instanceof Error ? e.message : JSON.stringify(e)
      setErrorCierre(`No se pudo cerrar el partido: ${detalle}`)
    } finally {
      setGuardandoCierre(false)
    }
  }

  function abrirEdicionJugada(jugadaId: string, urlActual: string | null) {
    setJugadaEditando(jugadaId)
    setUrlEditando(urlActual || '')
  }

  async function handleGuardarUrl(jugadaId: string) {
    setGuardandoUrl(true)
    try {
      await updateJugadaUrl(jugadaId, urlEditando.trim() || null)
      const actualizado = await fetchPartido(partido!.id)
      setPartido(actualizado)
      setJugadaEditando(null)
    } catch {
      // mantiene el panel abierto si falla
    } finally {
      setGuardandoUrl(false)
    }
  }

  async function handleBorrar() {
    if (!partido) return
    if (!confirm('¿Eliminar este partido? No se puede deshacer.')) return
    setBorrando(true)
    try {
      await borrarPartido(partido.id)
      navigate('/home')
    } catch {
      alert('No se pudo eliminar el partido.')
      setBorrando(false)
    }
  }

  if (cargando) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>Cargando...</div>
  }

  if (!partido) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-bone-dim)', marginBottom: '16px' }}>No encontramos ese partido.</p>
        <button onClick={() => navigate('/home')} className="btn-ghost" style={{ padding: '10px 16px', borderRadius: 'var(--radius)' }}>
          Volver al inicio
        </button>
      </div>
    )
  }

  const lineupA = partido.lineup.filter((pj) => pj.equipo === 'A')
  const lineupB = partido.lineup.filter((pj) => pj.equipo === 'B')
  const saqueNombre = partido.equipo_saque === 'A' ? partido.equipo_a : partido.equipo_saque === 'B' ? partido.equipo_b : null

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>
      <button onClick={() => navigate('/home')} className="btn-ghost" style={{ padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '20px' }}>
        ← Volver
      </button>

      {/* Cabecera del partido */}
      <div className="panel" style={{ padding: '24px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>
            {formatearFechaLarga(partido.fecha)}{partido.hora ? ` · ${partido.hora.slice(0, 5)}` : ''}
          </p>
          {partido.estado === 'en_curso' && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-carbon-deep)', background: 'var(--color-lime)', padding: '3px 8px', borderRadius: '2px' }}>
              EN CURSO
            </span>
          )}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-lime)', marginBottom: partido.estado === 'finalizado' ? '20px' : '8px' }}>
          {partido.lugar || 'Cancha sin nombre'} · Fútbol {partido.formato}
        </p>

        {saqueNombre && partido.estado === 'en_curso' && (
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '16px' }}>
            Saque inicial: <span style={{ color: 'var(--color-bone)' }}>{saqueNombre}</span>
          </p>
        )}

        {partido.estado === 'finalizado' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
              <span style={{ fontSize: '15px', fontWeight: 500, flex: 1, textAlign: 'right' }}>{partido.equipo_a}</span>
              <span className="stat-mono" style={{ fontSize: '36px' }}>{partido.goles_a} - {partido.goles_b}</span>
              <span style={{ fontSize: '15px', fontWeight: 500, flex: 1, textAlign: 'left' }}>{partido.equipo_b}</span>
            </div>
            {partido.costo_cancha != null && (
              <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginTop: '12px' }}>
                Costo de cancha: ${partido.costo_cancha.toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lineup */}
      {partido.lineup.length > 0 && (
        <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <p className="eyebrow" style={{ marginBottom: '16px' }}>Equipos</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <LineupColumna titulo={partido.equipo_a} color="var(--color-lime)" jugadores={lineupA} />
            <LineupColumna titulo={partido.equipo_b} color="var(--color-gold)" jugadores={lineupB} />
          </div>
        </div>
      )}

      {/* --------- PARTIDO EN CURSO --------- */}
      {partido.estado === 'en_curso' && !cerrando && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)', marginBottom: '16px' }}>
            Cerrá el partido cuando termine para cargar el resultado y los goles.
          </p>
          {esAdmin ? (
            <button onClick={() => setCerrando(true)} className="btn" style={{ width: '100%' }}>
              Cerrar partido →
            </button>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
              Solo un admin puede cerrar el partido.
            </p>
          )}
        </div>
      )}

      {/* --------- FORMULARIO DE CIERRE --------- */}
      {partido.estado === 'en_curso' && cerrando && esAdmin && (
        <form onSubmit={handleCerrar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="eyebrow">Sección 2 · Cerrar partido</p>
            <button type="button" onClick={() => setCerrando(false)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius)' }}>
              Cancelar
            </button>
          </div>

          {/* Resultado — se calcula solo desde los goles */}
          <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Resultado</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-lime)', marginBottom: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{partido.equipo_a}</p>
                <p className="stat-mono" style={{ fontSize: '40px', lineHeight: 1 }}>{golesA}</p>
              </div>
              <span className="stat-mono" style={{ fontSize: '28px', color: 'var(--color-bone-dim)', marginTop: '18px' }}>-</span>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-gold)', marginBottom: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{partido.equipo_b}</p>
                <p className="stat-mono" style={{ fontSize: '40px', lineHeight: 1 }}>{golesB}</p>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginTop: '10px', opacity: 0.6 }}>
              Se actualiza solo con los goles que cargues abajo
            </p>
          </div>

          {/* Goles */}
          <div className="panel" style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Goles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {filasGol.map((fila, idx) => (
                <div key={idx} className="fila-gol" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="fila-gol-jugador"
                    value={fila.jugador_id}
                    onChange={(e) => {
                      const jugadorId = e.target.value
                      const equipoAuto = partido.lineup.find((pj) => pj.jugador_id === jugadorId)?.equipo ?? ''
                      setFilasGol((prev) => prev.map((f, i) => i === idx ? { ...f, jugador_id: jugadorId, equipo: equipoAuto as 'A' | 'B' | '' } : f))
                    }}
                    style={{ flex: 2 }}
                  >
                    <option value="">Jugador</option>
                    {jugadores.map((j) => <option key={j.id} value={j.id}>{j.apodo}</option>)}
                  </select>
                  <select value={fila.equipo} onChange={(e) => setFilasGol((prev) => prev.map((f, i) => i === idx ? { ...f, equipo: e.target.value as 'A' | 'B' | '' } : f))} style={{ flex: 1 }}>
                    <option value="">Equipo</option>
                    <option value="A">{partido.equipo_a}</option>
                    <option value="B">{partido.equipo_b}</option>
                  </select>
                  <input type="number" min={1} placeholder="Goles" value={fila.cantidad}
                    onChange={(e) => setFilasGol((prev) => prev.map((f, i) => i === idx ? { ...f, cantidad: e.target.value } : f))}
                    style={{ width: '64px' }} />
                  <button type="button" onClick={() => setFilasGol((prev) => prev.filter((_, i) => i !== idx))}
                    className="btn-ghost" style={{ padding: '8px 10px', borderRadius: 'var(--radius)' }}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost"
              onClick={() => setFilasGol((prev) => [...prev, { jugador_id: '', equipo: '', cantidad: '1' }])}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: '13px' }}>
              + Agregar gol
            </button>
          </div>

          {/* Jugadas épicas / Momentos inolvidables */}
          <div className="panel" style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jugadas épicas</p>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '14px', opacity: 0.6 }}>o momentos inolvidables</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' }}>
              {filasJugada.map((fila, idx) => (
                <div key={idx} className="panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-panel-raised)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" placeholder="Descripción de la jugada" value={fila.descripcion}
                      onChange={(e) => setFilasJugada((prev) => prev.map((f, i) => i === idx ? { ...f, descripcion: e.target.value } : f))}
                      style={{ flex: 1 }} />
                    <button type="button" onClick={() => setFilasJugada((prev) => prev.filter((_, i) => i !== idx))}
                      className="btn-ghost" style={{ padding: '8px 10px', borderRadius: 'var(--radius)', flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={fila.jugador_id}
                      onChange={(e) => setFilasJugada((prev) => prev.map((f, i) => i === idx ? { ...f, jugador_id: e.target.value } : f))}
                      style={{ flex: 2 }}>
                      <option value="">Jugador (opcional)</option>
                      {jugadores.map((j) => <option key={j.id} value={j.id}>{j.apodo}</option>)}
                    </select>
                    <input type="number" min={0} max={120} placeholder="Min" value={fila.minuto}
                      onChange={(e) => setFilasJugada((prev) => prev.map((f, i) => i === idx ? { ...f, minuto: e.target.value } : f))}
                      style={{ width: '64px' }} />
                  </div>
                  <input type="url" placeholder="Link del video (opcional)" value={fila.url}
                    onChange={(e) => setFilasJugada((prev) => prev.map((f, i) => i === idx ? { ...f, url: e.target.value } : f))} />
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost"
              onClick={() => setFilasJugada((prev) => [...prev, { descripcion: '', jugador_id: '', minuto: '', url: '' }])}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: '13px' }}>
              + Agregar jugada épica
            </button>
          </div>

          {errorCierre && <p style={{ color: '#E57368', fontSize: '13px' }}>{errorCierre}</p>}

          <button type="submit" className="btn" disabled={guardandoCierre}>
            {guardandoCierre ? 'Guardando...' : 'Guardar y cerrar partido'}
          </button>
        </form>
      )}

      {/* --------- PARTIDO FINALIZADO --------- */}
      {partido.estado === 'finalizado' && (
        <>
          {/* Goles */}
          <div style={{ marginBottom: '20px' }}>
            <p className="eyebrow" style={{ marginBottom: '12px' }}>
              Goles ({partido.goles.reduce((a, g) => a + g.cantidad, 0)})
            </p>
            {partido.goles.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)' }}>No se cargaron goles.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partido.goles.map((g) => (
                  <div key={g.id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
                    {g.minuto != null && (
                      <span className="stat-mono" style={{ fontSize: '12px', color: 'var(--color-bone-dim)', minWidth: '36px' }}>
                        {g.minuto}'
                      </span>
                    )}
                    <AvatarJugador jugador={g.jugador} size={28} />
                    <span style={{ flex: 1, fontSize: '14px' }}>{g.jugador?.apodo ?? 'Jugador'}</span>
                    {g.equipo && (
                      <span style={{ fontSize: '11px', color: g.equipo === 'A' ? 'var(--color-lime)' : 'var(--color-gold)' }}>
                        {g.equipo === 'A' ? partido.equipo_a : partido.equipo_b}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jugadas épicas / Momentos inolvidables */}
          {partido.jugadas.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p className="eyebrow" style={{ marginBottom: '2px' }}>Jugadas épicas</p>
              <p style={{ fontSize: '11px', color: 'var(--color-bone-dim)', marginBottom: '12px', opacity: 0.6 }}>
                {esAdmin ? 'Momentos inolvidables · hacé click para editar el link' : 'Momentos inolvidables'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partido.jugadas.map((j) => {
                  const editando = jugadaEditando === j.id
                  return (
                    <div
                      key={j.id}
                      className="panel"
                      style={{
                        padding: '14px 16px',
                        cursor: editando ? 'default' : esAdmin ? 'pointer' : 'default',
                        borderColor: editando ? 'rgba(139,197,63,0.35)' : undefined,
                        transition: 'border-color 0.15s',
                      }}
                      onClick={!editando && esAdmin ? () => abrirEdicionJugada(j.id, j.url) : undefined}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {j.minuto != null && (
                          <span className="stat-mono" style={{ fontSize: '12px', color: 'var(--color-bone-dim)', minWidth: '36px', paddingTop: '2px' }}>
                            {j.minuto}'
                          </span>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', marginBottom: j.jugador ? '2px' : '0' }}>{j.descripcion}</p>
                          {j.jugador && (
                            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)' }}>{j.jugador.apodo}</p>
                          )}
                        </div>
                        {!editando && j.url && (
                          <a
                            href={j.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: 'var(--radius)',
                              background: 'rgba(139,197,63,0.12)', border: '1px solid rgba(139,197,63,0.3)',
                              color: 'var(--color-lime)', fontFamily: 'var(--font-display)',
                              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                              letterSpacing: '0.04em', textDecoration: 'none', flexShrink: 0,
                            }}
                          >
                            ▶ Ver
                          </a>
                        )}
                        {!editando && !j.url && (
                          <span style={{
                            fontSize: '11px', color: 'rgba(242,240,230,0.3)',
                            fontFamily: 'var(--font-display)', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                          }}>
                            + link
                          </span>
                        )}
                      </div>

                      {editando && (
                        <div
                          style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Link del video (opcional)"
                            value={urlEditando}
                            autoFocus
                            onChange={(e) => setUrlEditando(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {urlEditando.trim() && (
                              <a
                                href={urlEditando.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '8px 12px', borderRadius: 'var(--radius)',
                                  background: 'rgba(139,197,63,0.12)', border: '1px solid rgba(139,197,63,0.3)',
                                  color: 'var(--color-lime)', fontFamily: 'var(--font-display)',
                                  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                                  letterSpacing: '0.04em', textDecoration: 'none', flexShrink: 0,
                                }}
                              >
                                ▶ Probar
                              </a>
                            )}
                            <button
                              onClick={() => handleGuardarUrl(j.id)}
                              disabled={guardandoUrl}
                              className="btn"
                              style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                            >
                              {guardandoUrl ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => setJugadaEditando(null)}
                              className="btn-ghost"
                              style={{ padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: '13px' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {esAdmin && (
            <button onClick={handleBorrar} disabled={borrando} className="btn-danger"
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}>
              {borrando ? 'Eliminando...' : 'Eliminar partido'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
