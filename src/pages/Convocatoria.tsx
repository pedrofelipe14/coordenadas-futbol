import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  fetchConvocatoriaActiva,
  crearConvocatoria,
  cerrarConvocatoria,
  votarJuego,
  retirarVoto,
} from '../lib/data'
import type { ConvocatoriaConVotos } from '../types'

export default function Convocatoria() {
  const navigate = useNavigate()
  const { profile, esAdmin } = useAuth()
  const [conv, setConv] = useState<ConvocatoriaConVotos | null | undefined>(undefined)
  const [cargando, setCargando] = useState(true)
  const [accionando, setAccionando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await fetchConvocatoriaActiva()
    setConv(data)
    setCargando(false)
  }

  async function handleAbrir() {
    if (!profile) return
    setAccionando(true)
    try {
      await crearConvocatoria(profile.grupo_id!, profile.id)
      await cargar()
    } finally {
      setAccionando(false)
    }
  }

  async function handleCerrar() {
    if (!conv) return
    setAccionando(true)
    try {
      await cerrarConvocatoria(conv.id)
      await cargar()
    } finally {
      setAccionando(false)
    }
  }

  async function handleVoto() {
    if (!conv || !profile) return
    setAccionando(true)
    try {
      const yaVote = conv.votos.some(v => v.jugador_id === profile.id)
      if (yaVote) {
        await retirarVoto(conv.id, profile.id)
      } else {
        await votarJuego(conv.id, profile.id)
      }
      await cargar()
    } finally {
      setAccionando(false)
    }
  }

  if (cargando) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>Cargando...</div>
  }

  const yaVote = conv ? conv.votos.some(v => v.jugador_id === profile?.id) : false
  const totalVotos = conv?.votos.length ?? 0

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>
      <p className="eyebrow" style={{ marginBottom: '8px' }}>Votación semanal</p>

      {/* Sin convocatoria */}
      {!conv && (
        <div className="panel" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>No hay votación activa</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)', marginBottom: '24px' }}>
            Cuando un admin abra la votación, acá podés decir si querés jugar.
          </p>
          {esAdmin && (
            <button className="btn" onClick={handleAbrir} disabled={accionando}>
              {accionando ? '...' : 'Abrir votación'}
            </button>
          )}
        </div>
      )}

      {/* Convocatoria abierta */}
      {conv?.estado === 'abierta' && (
        <>
          <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>¿Jugás esta semana?</h2>

          <button
            onClick={handleVoto}
            disabled={accionando}
            style={{
              width: '100%',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${yaVote ? 'var(--color-lime)' : 'rgba(242,240,230,0.2)'}`,
              background: yaVote ? 'rgba(139,197,63,0.12)' : 'var(--color-panel)',
              color: yaVote ? 'var(--color-lime)' : 'var(--color-bone)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '24px',
            }}
          >
            {yaVote ? '✓ JUEGO' : '⚽ JUEGO'}
          </button>

          <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <p className="eyebrow" style={{ marginBottom: '14px' }}>
              Anotados ({totalVotos})
            </p>
            {totalVotos === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)' }}>Nadie votó todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conv.votos.map(v => (
                  <div key={v.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: v.jugador.avatar_color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700,
                      color: 'var(--color-carbon-deep)', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {v.jugador.avatar_url
                        ? <img src={v.jugador.avatar_url} alt={v.jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : v.jugador.dorsal
                      }
                    </div>
                    <span style={{ fontSize: '14px', color: v.jugador_id === profile?.id ? 'var(--color-lime)' : undefined }}>
                      {v.jugador.apodo}
                      {v.jugador_id === profile?.id && ' (vos)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {esAdmin && (
            <button
              className="btn-ghost"
              onClick={handleCerrar}
              disabled={accionando}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
            >
              {accionando ? '...' : 'Cerrar votación'}
            </button>
          )}
        </>
      )}

      {/* Convocatoria cerrada */}
      {conv?.estado === 'cerrada' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px' }}>Votación cerrada</h2>
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700,
              letterSpacing: '0.06em', color: 'var(--color-carbon-deep)',
              background: 'var(--color-bone-dim)', padding: '3px 8px', borderRadius: '2px',
            }}>
              CERRADA
            </span>
          </div>

          <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <p className="eyebrow" style={{ marginBottom: '14px' }}>
              Jugadores anotados ({totalVotos})
            </p>
            {totalVotos === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)' }}>Nadie se anotó.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conv.votos.map((v, i) => (
                  <div key={v.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-mono)', minWidth: '20px' }}>
                      {i + 1}
                    </span>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: v.jugador.avatar_color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700,
                      color: 'var(--color-carbon-deep)', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {v.jugador.avatar_url
                        ? <img src={v.jugador.avatar_url} alt={v.jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : v.jugador.dorsal
                      }
                    </div>
                    <span style={{ fontSize: '14px' }}>{v.jugador.apodo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {esAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn"
                onClick={() => navigate(`/partido/nuevo?convocatoria=${conv.id}`)}
                style={{ width: '100%', padding: '14px' }}
              >
                Armar partido con estos jugadores →
              </button>
              <button
                className="btn-ghost"
                onClick={handleAbrir}
                disabled={accionando}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
              >
                {accionando ? '...' : 'Nueva votación'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
