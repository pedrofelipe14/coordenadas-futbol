import { useEffect, useState } from 'react'
import { fetchPartidos, fetchJugadores, calcularGoleadores } from '../lib/data'
import type { Profile, GoleadorStat } from '../types'
import PlayerCard from '../components/PlayerCard'

export default function Plantel() {
  const [jugadores, setJugadores] = useState<Profile[]>([])
  const [stats, setStats] = useState<GoleadorStat[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([fetchJugadores(), fetchPartidos()]).then(([j, partidos]) => {
      setJugadores(j)
      setStats(calcularGoleadores(partidos))
      setCargando(false)
    })
  }, [])

  if (cargando) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>Cargando plantel...</div>
  }

  const statsMap = new Map(stats.map((s) => [s.jugador.id, s]))
  const ordenados = [...jugadores].sort((a, b) => {
    const golesA = statsMap.get(a.id)?.goles ?? 0
    const golesB = statsMap.get(b.id)?.goles ?? 0
    return golesB - golesA
  })

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>
      <p className="eyebrow" style={{ marginBottom: '8px' }}>Histórico completo</p>
      <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Plantel</h2>

      {ordenados.length === 0 ? (
        <p style={{ color: 'var(--color-bone-dim)' }}>Todavía no hay jugadores registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ordenados.map((j, i) => (
            <PlayerCard
              key={j.id}
              jugador={j}
              goles={statsMap.get(j.id)?.goles ?? 0}
              posicion={i + 1}
              destacar={i === 0 && (statsMap.get(j.id)?.goles ?? 0) > 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
