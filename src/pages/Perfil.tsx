import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { fetchEstadisticasJugador, fetchJugadores, subirAvatar, actualizarColor, promoverAdmin, quitarAdmin } from '../lib/data'
import type { EstadisticasJugador, Profile } from '../types'
import { useNavigate } from 'react-router-dom'

const COLORES = ['#8BC53F', '#D4AF37', '#C0392B', '#2E86C1', '#B968C7', '#E67E22']

export default function Perfil() {
  const { profile, grupo, esAdmin, session, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<EstadisticasJugador | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [cambiandoColor, setCambiandoColor] = useState(false)
  const [miembros, setMiembros] = useState<Profile[]>([])
  const [gestionando, setGestionando] = useState<string | null>(null)

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

  if (!profile) return null

  const winRate = stats && stats.partidosJugados > 0
    ? Math.round((stats.partidosGanados / stats.partidosJugados) * 100)
    : null

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

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{profile.apodo}</h2>
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

      {/* Panel de admin */}
      {esAdmin && miembros.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>Administración del grupo</p>
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '16px' }}>
            Podés tener hasta 2 admins en el grupo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {miembros.map((m) => {
              const esSelf = m.id === profile.id
              const esCreador = m.id === grupo?.creado_por
              const puedePromover = !m.es_admin
              const puedeDemote = m.es_admin && !esSelf && !esCreador

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
                    <p style={{ fontSize: '14px', fontWeight: esSelf ? 600 : 400 }}>
                      {m.apodo}{esSelf ? ' (vos)' : ''}
                    </p>
                    {m.es_admin && (
                      <p style={{ fontSize: '11px', color: 'var(--color-lime)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {esCreador ? 'Admin · Creador' : 'Admin'}
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

      {/* Salir */}
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(242,240,230,0.08)' }}>
        <button
          onClick={async () => { await signOut(); navigate('/') }}
          className="btn-ghost"
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
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
