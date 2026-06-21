import type { Profile } from '../types'

interface Props {
  jugador: Profile
  goles: number
  posicion?: number
}

const PODIO: Record<number, { color: string; glow: string; borde: string }> = {
  1: { color: '#F5C842', glow: 'rgba(245, 200, 66, 0.20)', borde: 'rgba(245, 200, 66, 0.40)' },
  2: { color: '#A8B3BF', glow: 'rgba(168, 179, 191, 0.16)', borde: 'rgba(168, 179, 191, 0.35)' },
  3: { color: '#C4793A', glow: 'rgba(196, 121, 58, 0.16)', borde: 'rgba(196, 121, 58, 0.35)' },
}

export default function PlayerCard({ jugador, goles, posicion }: Props) {
  const medalla = posicion !== undefined && posicion <= 3 ? PODIO[posicion] : null

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
        <p style={{ fontWeight: 500, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {jugador.apodo}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span className="stat-mono" style={{ fontSize: '18px', color: medalla ? medalla.color : 'var(--color-lime)' }}>
          {goles}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-bone-dim)', textTransform: 'uppercase' }}>
          {goles === 1 ? 'gol' : 'goles'}
        </span>
      </div>
    </div>
  )
}
