import type { PartidoCompleto } from '../types'

interface Props {
  partido: PartidoCompleto
  onClick?: () => void
}

const NOMBRES_MES_CORTO = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
]

function formatearFecha(fecha: string): { dia: string; mes: string } {
  const [, mesNum, dia] = fecha.split('-')
  return { dia, mes: NOMBRES_MES_CORTO[parseInt(mesNum, 10) - 1] }
}

export default function Scoreboard({ partido, onClick }: Props) {
  const { dia, mes } = formatearFecha(partido.fecha)
  const totalGoles = partido.goles.reduce((acc, g) => acc + g.cantidad, 0)

  return (
    <button
      onClick={onClick}
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(242, 240, 230, 0.08)',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          background: 'var(--color-panel-raised)',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '56px',
          borderRight: '1px solid rgba(242, 240, 230, 0.08)',
        }}
      >
        <span className="stat-mono" style={{ fontSize: '20px', lineHeight: 1 }}>{dia}</span>
        <span style={{ fontSize: '11px', color: 'var(--color-lime)', letterSpacing: '0.05em', marginTop: '2px' }}>{mes}</span>
      </div>

      <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partido.lugar || 'Cancha sin nombre'}
            {partido.hora ? ` · ${partido.hora.slice(0, 5)}` : ''}
          </p>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-carbon-deep)',
            background: 'var(--color-lime)',
            padding: '2px 8px',
            borderRadius: '2px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            F{partido.formato}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ flex: 1, fontWeight: 500, fontSize: '14px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partido.equipo_a}
          </span>
          {partido.estado === 'en_curso' ? (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-carbon-deep)', background: 'var(--color-lime)', padding: '3px 8px', borderRadius: '2px', flexShrink: 0 }}>
              EN CURSO
            </span>
          ) : (
            <span className="stat-mono" style={{ fontSize: '20px', flexShrink: 0 }}>
              {partido.goles_a} - {partido.goles_b}
            </span>
          )}
          <span style={{ flex: 1, fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partido.equipo_b}
          </span>
        </div>

        {totalGoles > 0 && (
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginTop: '8px' }}>
            {totalGoles} {totalGoles === 1 ? 'gol cargado' : 'goles cargados'}
          </p>
        )}
      </div>
    </button>
  )
}
