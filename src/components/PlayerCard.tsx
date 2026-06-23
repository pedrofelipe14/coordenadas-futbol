import type { Profile, EstadisticasJugador } from '../types'
import DevBadge from './DevBadge'

interface Props {
  jugador: Profile
  goles: number
  posicion?: number
  stats?: EstadisticasJugador
  racha?: number
  statValue?: number
  statLabel?: string
}

const PODIO: Record<number, { color: string; glow: string; borde: string }> = {
  1: { color: '#F5C842', glow: 'rgba(245, 200, 66, 0.20)', borde: 'rgba(245, 200, 66, 0.40)' },
  2: { color: '#A8B3BF', glow: 'rgba(168, 179, 191, 0.16)', borde: 'rgba(168, 179, 191, 0.35)' },
  3: { color: '#C4793A', glow: 'rgba(196, 121, 58, 0.16)', borde: 'rgba(196, 121, 58, 0.35)' },
}

export default function PlayerCard({ jugador, goles, posicion, stats, racha, statValue, statLabel }: Props) {
  const medalla = posicion !== undefined && posicion <= 3 ? PODIO[posicion] : null
  const displayValue = statValue !== undefined ? statValue : goles
  const displayLabel = statLabel !== undefined ? statLabel : (goles === 1 ? 'gol' : 'goles')

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 16px',
        borderColor: medalla ? medalla.borde : undefined,
        boxShadow: medalla ? `0 0 18px ${medalla.glow}` : undefined,
      }}
    >
      {posicion !== undefined && (
        <span
          className="stat-mono"
          style={{
            width: '20px',
            fontSize: '13px',
            color: medalla ? medalla.color : 'var(--color-bone-dim)',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {posicion}
        </span>
      )}

      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: jugador.avatar_color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '15px',
          color: 'var(--color-carbon-deep)',
        }}
      >
        {jugador.avatar_url ? (
          <img src={jugador.avatar_url} alt={jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          jugador.dorsal
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <p style={{
            fontWeight: 500,
            fontSize: '15px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: jugador.es_dev ? 'var(--color-gold)' : jugador.es_admin ? 'var(--color-lime)' : undefined,
          }}>
            {jugador.apodo}
          </p>
          {jugador.es_dev && <DevBadge />}
        </div>

        {stats && stats.partidosJugados > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-mono)' }}>
              {stats.partidosJugados} PJ
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-bone-dim)', opacity: 0.3 }}>·</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
              <span style={{ color: 'var(--color-lime)' }}>{stats.partidosGanados}G</span>
              {' '}
              <span style={{ color: 'var(--color-bone-dim)' }}>{stats.partidosEmpatados}E</span>
              {' '}
              <span style={{ color: '#E57368' }}>{stats.partidosPerdidos}P</span>
            </span>
            {racha !== undefined && racha >= 2 && (
              <>
                <span style={{ fontSize: '10px', color: 'var(--color-bone-dim)', opacity: 0.3 }}>·</span>
                <span style={{ fontSize: '11px', color: 'var(--color-lime)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {racha} seguidas
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
        <span className="stat-mono" style={{ fontSize: '18px', color: medalla ? medalla.color : 'var(--color-lime)' }}>
          {displayValue}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-bone-dim)', textTransform: 'uppercase' }}>
          {displayLabel}
        </span>
      </div>
    </div>
  )
}
