import { useEffect, useMemo, useState } from 'react'
import type { Grupo } from '../types'
import { useNavigate } from 'react-router-dom'
import { fetchPartidos, calcularGoleadores, agruparPorMes, etiquetaMes } from '../lib/data'
import type { PartidoCompleto } from '../types'
import Scoreboard from '../components/Scoreboard'
import PlayerCard from '../components/PlayerCard'
import { useAuth } from '../lib/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { grupo } = useAuth()
  const [partidos, setPartidos] = useState<PartidoCompleto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesActivo, setMesActivo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  function copiarCodigo() {
    if (!grupo) return
    navigator.clipboard.writeText(grupo.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await fetchPartidos()
      setPartidos(data)
      const meses = Array.from(agruparPorMes(data).keys()).sort().reverse()
      if (meses.length > 0) setMesActivo(meses[0])
    } catch {
      setError('No se pudieron cargar los partidos. Revisá la conexión con Supabase.')
    } finally {
      setCargando(false)
    }
  }

  const porMes = useMemo(() => agruparPorMes(partidos), [partidos])
  const mesesOrdenados = useMemo(() => Array.from(porMes.keys()).sort().reverse(), [porMes])
  const partidosDelMes = mesActivo ? (porMes.get(mesActivo) || []) : partidos
  const goleadores = useMemo(() => calcularGoleadores(partidosDelMes), [partidosDelMes])
  const totalGoles = partidosDelMes.reduce(
    (acc, p) => acc + p.goles.reduce((a, g) => a + g.cantidad, 0), 0
  )

  if (cargando) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>
        Cargando temporada...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: '#E57368', marginBottom: '12px' }}>{error}</p>
        <button onClick={cargar} className="btn-ghost" style={{ padding: '10px 16px', borderRadius: 'var(--radius)' }}>
          Reintentar
        </button>
      </div>
    )
  }

  if (partidos.length === 0) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <GrupoHeader grupo={grupo} copiado={copiado} onCopiar={copiarCodigo} />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p className="eyebrow" style={{ marginBottom: '8px' }}>Temporada vacía</p>
          <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>Todavía no cargaron partidos</h2>
          <p style={{ color: 'var(--color-bone-dim)', marginBottom: '24px' }}>
            Arranquen anotando el primer partido del grupo.
          </p>
          <button onClick={() => navigate('/partido/nuevo')} className="btn">
            Cargar primer partido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px 60px' }}>

      <GrupoHeader grupo={grupo} copiado={copiado} onCopiar={copiarCodigo} />

      {mesesOrdenados.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '28px', paddingBottom: '4px' }}>
          {mesesOrdenados.map((mk) => {
            const activo = mk === mesActivo
            return (
              <button
                key={mk}
                onClick={() => setMesActivo(mk)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  border: activo ? '1px solid var(--color-lime)' : '1px solid rgba(242, 240, 230, 0.12)',
                  background: activo ? 'rgba(139, 197, 63, 0.1)' : 'transparent',
                  color: activo ? 'var(--color-lime)' : 'var(--color-bone-dim)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {etiquetaMes(mk)}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Partidos jugados
          </p>
          <p className="stat-mono" style={{ fontSize: '28px' }}>{partidosDelMes.length}</p>
        </div>
        <div className="panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Goles totales
          </p>
          <p className="stat-mono" style={{ fontSize: '28px', color: 'var(--color-lime)' }}>{totalGoles}</p>
        </div>
      </div>

      {goleadores.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Tabla de goleadores</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {goleadores.slice(0, 8).map((g, i) => (
              <PlayerCard
                key={g.jugador.id}
                jugador={g.jugador}
                goles={g.goles}
                posicion={i + 1}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="eyebrow" style={{ marginBottom: '12px' }}>Partidos</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {partidosDelMes.map((p) => (
            <Scoreboard key={p.id} partido={p} onClick={() => navigate(`/partido/${p.id}`)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function GrupoHeader({ grupo, copiado, onCopiar }: { grupo: Grupo | null; copiado: boolean; onCopiar: () => void }) {
  if (!grupo) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-bone)' }}>{grupo.nombre}</p>
      <button
        onClick={onCopiar}
        title="Copiar código del grupo"
        style={{
          background: 'var(--color-panel-raised)',
          border: '1px solid rgba(242,240,230,0.12)',
          borderRadius: '4px',
          padding: '2px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: copiado ? 'var(--color-lime)' : 'var(--color-bone-dim)',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
      >
        {copiado ? '¡Copiado!' : grupo.codigo}
      </button>
    </div>
  )
}
