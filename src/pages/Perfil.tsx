import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  fetchEstadisticasJugador, fetchJugadores,
  subirAvatar, actualizarColor, cambiarApodo,
  promoverAdmin, quitarAdmin,
  salirDeGrupo, eliminarGrupo,
  cambiarGrupoActivo, unirseAGrupo,
} from '../lib/data'
import type { EstadisticasJugador, Profile } from '../types'
import DevBadge from '../components/DevBadge'
import { useNavigate } from 'react-router-dom'

const COLORES = ['#8BC53F', '#D4AF37', '#C0392B', '#2E86C1', '#B968C7', '#E67E22']

export default function Perfil() {
  const { profile, grupo, misGrupos, esAdmin, session, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<EstadisticasJugador | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [cambiandoColor, setCambiandoColor] = useState(false)
  const [miembros, setMiembros] = useState<Profile[]>([])
  const [gestionando, setGestionando] = useState<string | null>(null)
  const [editandoApodo, setEditandoApodo] = useState(false)
  const [nuevoApodo, setNuevoApodo] = useState('')
  const [cambiandoApodo, setCambiandoApodo] = useState(false)
  const [errorApodo, setErrorApodo] = useState<string | null>(null)
  const [mostrarUnirse, setMostrarUnirse] = useState(false)
  const [codigoUnirse, setCodigoUnirse] = useState('')
  const [errorUnirse, setErrorUnirse] = useState<string | null>(null)
  const [uniendose, setUniendose] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  async function handleCompartir(codigo: string, nombre: string) {
    const url = `${window.location.origin}/grupo?codigo=${codigo}`
    const texto = `Te invito a unirte a mi grupo "${nombre}" en CoordeFutbol, la app para coordinar los partidos del grupo. Entrá con este link y registrate: ${url}`
    await navigator.clipboard.writeText(texto)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  useEffect(() => {
    if (!profile) return
    fetchEstadisticasJugador(profile.id).then(setStats).catch(() => {})
    if (esAdmin) {
      fetchJugadores().then(setMiembros).catch(() => {})
    }
  }, [profile?.id, esAdmin])

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session?.user.id) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorFoto('La foto no puede superar 5 MB.')
      return
    }
    setSubiendo(true)
    setErrorFoto(null)
    try {
      await subirAvatar(session.user.id, file)
      await refreshProfile()
    } catch {
      setErrorFoto('No se pudo subir la foto. Probá de nuevo.')
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  async function handleCambiarApodo(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoApodo.trim() || nuevoApodo.trim() === profile?.apodo) return
    setCambiandoApodo(true)
    setErrorApodo(null)
    try {
      await cambiarApodo(nuevoApodo.trim())
      await refreshProfile()
      setEditandoApodo(false)
      setNuevoApodo('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('COOLDOWN:')) {
        const fecha = new Date(msg.split('COOLDOWN:')[1].trim())
        setErrorApodo(`Podés volver a cambiar el apodo el ${fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.`)
      } else if (msg.includes('APODO_OCUPADO')) {
        setErrorApodo('Ese apodo ya está en uso. Elegí otro.')
      } else if (msg.includes('APODO_CORTO')) {
        setErrorApodo('El apodo tiene que tener al menos 2 caracteres.')
      } else {
        setErrorApodo('No se pudo cambiar el apodo. Intentá de nuevo.')
      }
    } finally {
      setCambiandoApodo(false)
    }
  }

  async function handleCambiarGrupo(grupoId: string) {
    if (!session?.user.id) return
    try {
      await cambiarGrupoActivo(session.user.id, grupoId)
      await refreshProfile()
    } catch {
      alert('No se pudo cambiar de grupo.')
    }
  }

  async function handleSalirDeGrupo(grupoId: string, grupoNombre: string) {
    if (!confirm(`¿Salir del grupo "${grupoNombre}"? Podés volver a unirte con el código.`)) return
    if (!session?.user.id) return
    try {
      await salirDeGrupo(session.user.id, grupoId)
      await refreshProfile()
    } catch {
      alert('No se pudo salir del grupo.')
    }
  }

  async function handleEliminarGrupo(grupoId: string, grupoNombre: string) {
    if (!confirm(`¿Eliminar el grupo "${grupoNombre}"? Se borrarán todos los partidos, mensajes y datos. Esta acción no se puede deshacer.`)) return
    if (!session?.user.id) return
    try {
      if (profile?.grupo_id !== grupoId) {
        await cambiarGrupoActivo(session.user.id, grupoId)
      }
      await eliminarGrupo()
      await refreshProfile()
    } catch {
      alert('No se pudo eliminar el grupo.')
    }
  }

  async function handleUnirseOtro(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !codigoUnirse.trim()) return
    setUniendose(true)
    setErrorUnirse(null)
    try {
      await unirseAGrupo(codigoUnirse, profile.id)
      await refreshProfile()
      setMostrarUnirse(false)
      setCodigoUnirse('')
    } catch (err) {
      setErrorUnirse(err instanceof Error ? err.message : 'Código inválido. Revisá que esté bien escrito.')
    } finally {
      setUniendose(false)
    }
  }

  if (!profile) return null

  const winRate = stats && stats.partidosJugados > 0
    ? Math.round((stats.partidosGanados / stats.partidosJugados) * 100)
    : null

  const btnGroupStyle: React.CSSProperties = {
    padding: '5px 12px',
    fontSize: '12px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px 60px' }}>

      {/* Avatar + foto */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <div
            onClick={() => !subiendo && fileInputRef.current?.click()}
            title="Cambiar foto"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: profile.avatar_color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: subiendo ? 'default' : 'pointer',
              flexShrink: 0,
              border: '3px solid rgba(242, 240, 230, 0.12)',
              transition: 'border-color 0.15s',
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.apodo}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '32px',
                color: 'var(--color-carbon-deep)',
              }}>
                {profile.dorsal}
              </span>
            )}
          </div>

          <button
            onClick={() => !subiendo && fileInputRef.current?.click()}
            disabled={subiendo}
            title="Cambiar foto"
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-panel-raised)',
              border: '2px solid var(--color-carbon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: subiendo ? 'default' : 'pointer',
              fontSize: '13px',
            }}
          >
            {subiendo ? '⏳' : '📷'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleArchivo}
        />

        {editandoApodo ? (
          <form onSubmit={handleCambiarApodo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '4px', width: '100%', maxWidth: '260px' }}>
            <input
              autoFocus
              type="text"
              value={nuevoApodo}
              onChange={(e) => setNuevoApodo(e.target.value)}
              placeholder={profile.apodo}
              maxLength={24}
              style={{ textAlign: 'center', fontSize: '16px' }}
            />
            {errorApodo && <p style={{ fontSize: '12px', color: '#E57368', textAlign: 'center' }}>{errorApodo}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn" disabled={cambiandoApodo} style={{ padding: '6px 16px', fontSize: '13px' }}>
                {cambiandoApodo ? '...' : 'Guardar'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setEditandoApodo(false); setErrorApodo(null); setNuevoApodo('') }} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: profile.es_dev ? 'var(--color-gold)' : undefined }}>{profile.apodo}</h2>
            {profile.es_dev && <DevBadge />}
            <button
              onClick={() => { setEditandoApodo(true); setNuevoApodo(profile.apodo) }}
              title="Cambiar apodo"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.5, padding: '2px 4px' }}
            >✏️</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: profile.avatar_color,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>
            Dorsal #{profile.dorsal}
          </span>
        </div>

        {errorFoto && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#E57368', textAlign: 'center' }}>
            {errorFoto}
          </p>
        )}
        {!profile.avatar_url && !subiendo && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost"
            style={{ marginTop: '12px', padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}
          >
            Agregar foto
          </button>
        )}

        {/* Selector de color */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              disabled={cambiandoColor}
              onClick={async () => {
                if (c === profile.avatar_color || !session?.user.id) return
                setCambiandoColor(true)
                try {
                  await actualizarColor(session.user.id, c)
                  await refreshProfile()
                } finally {
                  setCambiandoColor(false)
                }
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: c,
                border: profile.avatar_color === c ? '3px solid var(--color-bone)' : '3px solid transparent',
                padding: 0,
                cursor: cambiandoColor ? 'default' : 'pointer',
                opacity: cambiandoColor && profile.avatar_color !== c ? 0.5 : 1,
                transition: 'border-color 0.15s, opacity 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Estadísticas</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <StatPanel label="Goles totales" valor={stats.goles} color="var(--color-lime)" grande />
            <StatPanel label="Partidos jugados" valor={stats.partidosJugados} grande />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <StatPanel label="Ganados" valor={stats.partidosGanados} color="#F5C842" />
            <StatPanel label="Perdidos" valor={stats.partidosPerdidos} color="#E57368" />
          </div>
          {stats.partidosEmpatados > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <StatPanel label="Empates" valor={stats.partidosEmpatados} />
              {winRate !== null && (
                <StatPanel label="% victorias" valor={`${winRate}%`} color="#A8B3BF" />
              )}
            </div>
          )}
          {winRate !== null && stats.partidosEmpatados === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <StatPanel label="% victorias" valor={`${winRate}%`} color="#A8B3BF" />
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--color-bone-dim)', padding: '20px' }}>
          Cargando estadísticas...
        </div>
      )}

      {/* Mis grupos */}
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
        <p className="eyebrow" style={{ marginBottom: '4px' }}>Mis grupos</p>
        <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '14px' }}>
          Podés estar en hasta 2 grupos a la vez.
        </p>

        {misGrupos.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>No pertenecés a ningún grupo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {misGrupos.map((g) => {
              const esActivo = g.grupo_id === profile.grupo_id
              const esCreadorDeEste = g.grupo_creado_por === profile.id
              return (
                <div
                  key={g.grupo_id}
                  className="panel"
                  style={{ padding: '14px 16px', borderColor: esActivo ? 'rgba(139,197,63,0.3)' : undefined }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.grupo_nombre}
                      </p>
                      {esActivo ? (
                        <p style={{ fontSize: '11px', color: 'var(--color-lime)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Activo
                        </p>
                      ) : g.es_admin ? (
                        <p style={{ fontSize: '11px', color: 'var(--color-bone-dim)' }}>Admin</p>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleCompartir(g.grupo_codigo, g.grupo_nombre)}
                        className="btn-ghost"
                        style={{ ...btnGroupStyle, color: copiado === g.grupo_codigo ? 'var(--color-lime)' : undefined }}
                      >
                        {copiado === g.grupo_codigo ? 'Copiado ✓' : 'Compartir'}
                      </button>
                      {!esActivo && (
                        <button
                          onClick={() => handleCambiarGrupo(g.grupo_id)}
                          className="btn-ghost"
                          style={btnGroupStyle}
                        >
                          Cambiar
                        </button>
                      )}
                      {esCreadorDeEste ? (
                        <button
                          onClick={() => handleEliminarGrupo(g.grupo_id, g.grupo_nombre)}
                          className="btn-ghost"
                          style={{ ...btnGroupStyle, color: '#E57368', borderColor: 'rgba(229,115,104,0.3)' }}
                        >
                          Eliminar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSalirDeGrupo(g.grupo_id, g.grupo_nombre)}
                          className="btn-ghost"
                          style={{ ...btnGroupStyle, color: '#E57368', borderColor: 'rgba(229,115,104,0.3)' }}
                        >
                          Salir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Unirse a otro grupo */}
        {misGrupos.length < 2 && (
          <div style={{ marginTop: '12px' }}>
            {!mostrarUnirse ? (
              <button
                onClick={() => setMostrarUnirse(true)}
                className="btn-ghost"
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
              >
                + Unirme a otro equipo
              </button>
            ) : (
              <form
                onSubmit={handleUnirseOtro}
                className="panel"
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}
              >
                <div>
                  <label htmlFor="codigoUnirse">Código del equipo</label>
                  <input
                    id="codigoUnirse"
                    type="text"
                    value={codigoUnirse}
                    onChange={(e) => setCodigoUnirse(e.target.value.toUpperCase())}
                    placeholder="Ej: A3BK7R"
                    maxLength={6}
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: '18px' }}
                    required
                  />
                </div>
                {errorUnirse && <p style={{ color: '#E57368', fontSize: '13px' }}>{errorUnirse}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn" disabled={uniendose} style={{ flex: 1 }}>
                    {uniendose ? 'Uniéndome...' : 'Unirme'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMostrarUnirse(false); setCodigoUnirse(''); setErrorUnirse(null) }}
                    className="btn-ghost"
                    style={{ padding: '10px 16px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Panel de admin */}
      {esAdmin && miembros.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>Administración del grupo</p>
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '16px' }}>
            podes asignar a los admins que quieras, pero ojo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {miembros.map((m) => {
              const esSelf = m.id === profile.id
              const esCreador = m.id === grupo?.creado_por
              const soyCreador = profile.id === grupo?.creado_por
              const puedePromover = soyCreador && !m.es_admin
              const puedeDemote = soyCreador && m.es_admin && !esSelf && !esCreador

              return (
                <div key={m.id} className="panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: m.avatar_color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                    color: 'var(--color-carbon-deep)', overflow: 'hidden',
                  }}>
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : m.dorsal
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: esSelf ? 600 : 400, color: m.es_dev ? 'var(--color-gold)' : undefined }}>
                        {m.apodo}{esSelf ? ' (vos)' : ''}
                      </p>
                      {m.es_dev && <DevBadge />}
                    </div>
                    {m.es_admin && (
                      <p style={{ fontSize: '11px', color: m.es_dev ? 'var(--color-gold)' : 'var(--color-lime)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {m.es_dev ? 'Dev' : esCreador ? 'Admin · Creador' : 'Admin'}
                      </p>
                    )}
                  </div>

                  {puedePromover && (
                    <button
                      disabled={gestionando === m.id}
                      onClick={async () => {
                        setGestionando(m.id)
                        try {
                          await promoverAdmin(m.id)
                          setMiembros((prev) => prev.map((x) => x.id === m.id ? { ...x, es_admin: true } : x))
                        } catch { /* ignore */ }
                        finally { setGestionando(null) }
                      }}
                      className="btn-ghost"
                      style={{ padding: '5px 12px', fontSize: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    >
                      {gestionando === m.id ? '...' : 'Hacer admin'}
                    </button>
                  )}

                  {puedeDemote && (
                    <button
                      disabled={gestionando === m.id}
                      onClick={async () => {
                        setGestionando(m.id)
                        try {
                          await quitarAdmin(m.id)
                          setMiembros((prev) => prev.map((x) => x.id === m.id ? { ...x, es_admin: false } : x))
                        } catch { /* ignore */ }
                        finally { setGestionando(null) }
                      }}
                      className="btn-ghost"
                      style={{ padding: '5px 12px', fontSize: '12px', borderRadius: 'var(--radius)', color: '#E57368', borderColor: 'rgba(229,115,104,0.3)' }}
                    >
                      {gestionando === m.id ? '...' : 'Quitar admin'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cerrar sesión */}
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
        <button
          onClick={async () => { await signOut(); navigate('/') }}
          className="btn-ghost"
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px', opacity: 0.6 }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function StatPanel({ label, valor, color, grande }: { label: string; valor: number | string; color?: string; grande?: boolean }) {
  return (
    <div className="panel" style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        {label}
      </p>
      <p className="stat-mono" style={{ fontSize: grande ? '32px' : '26px', color: color || 'var(--color-bone)' }}>
        {valor}
      </p>
    </div>
  )
}
