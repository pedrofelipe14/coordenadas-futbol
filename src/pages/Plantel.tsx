import { useEffect, useState } from 'react'
import { fetchJugadores, fetchDatosPlantel } from '../lib/data'
import type { StatusJugador } from '../lib/data'
import type { Profile } from '../types'
import PlayerCard from '../components/PlayerCard'

const MUNDIAL_RACHA = 7

const emptyStatus = (): StatusJugador => ({
  stats: { goles: 0, partidosJugados: 0, partidosGanados: 0, partidosPerdidos: 0, partidosEmpatados: 0 },
  racha: 0,
  mundiales: 0,
  pechoFrio: false,
  casiAlla: false,
})

function MiniAvatar({ jugador }: { jugador: Profile }) {
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', background: jugador.avatar_color,
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
      color: 'var(--color-carbon-deep)', overflow: 'hidden',
    }}>
      {jugador.avatar_url
        ? <img src={jugador.avatar_url} alt={jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : jugador.dorsal}
    </div>
  )
}

export default function Plantel() {
  const [jugadores, setJugadores] = useState<Profile[]>([])
  const [statusMap, setStatusMap] = useState<Map<string, StatusJugador>>(new Map())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([fetchJugadores(), fetchDatosPlantel()]).then(([j, datos]) => {
      setJugadores(j)
      setStatusMap(datos.statusMap)
      setCargando(false)
    })
  }, [])

  if (cargando) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>Cargando plantel...</div>
  }

  if (jugadores.length === 0) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <p style={{ color: 'var(--color-bone-dim)' }}>Todavía no hay jugadores registrados.</p>
      </div>
    )
  }

  const st = (j: Profile) => statusMap.get(j.id) ?? emptyStatus()

  const mundialActivos   = jugadores.filter(j => st(j).racha >= MUNDIAL_RACHA)
  const hallOfFame       = jugadores.filter(j => st(j).mundiales > 0).sort((a, b) => st(b).mundiales - st(a).mundiales)
  const casiAllaPlayers  = jugadores.filter(j => st(j).casiAlla)
  const pechoFrioPlayers = jugadores.filter(j => st(j).pechoFrio)

  const topGoleadores = [...jugadores].sort((a, b) => st(b).stats.goles - st(a).stats.goles)
  const topVictorias  = [...jugadores]
    .filter(j => st(j).stats.partidosJugados > 0)
    .sort((a, b) => {
      const diff = st(b).stats.partidosGanados - st(a).stats.partidosGanados
      return diff !== 0 ? diff : st(a).stats.partidosJugados - st(b).stats.partidosJugados
    })

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 60px' }}>

      {/* MUNDIAL ACTIVO */}
      {mundialActivos.length > 0 && (
        <div className="panel" style={{ marginBottom: '32px', padding: '24px', borderColor: 'rgba(212,175,55,0.45)', boxShadow: '0 0 40px rgba(212,175,55,0.1)' }}>
          <p className="eyebrow" style={{ color: 'var(--color-gold)', marginBottom: '6px', letterSpacing: '0.14em' }}>
            Mundial del grupo
          </p>
          <h2 style={{ fontSize: '22px', color: 'var(--color-gold)', marginBottom: '4px' }}>
            {mundialActivos.length === 1 ? 'Campeón del mundo' : 'Campeones del mundo'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginBottom: '20px' }}>
            {mundialActivos.length === 1
              ? `Lleva ${st(mundialActivos[0]).racha} partidos seguidos ganando.`
              : 'Llevan varios partidos seguidos ganando.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mundialActivos.map(j => (
              <PlayerCard
                key={j.id}
                jugador={j}
                goles={st(j).stats.goles}
                stats={st(j).stats}
                racha={st(j).racha}
                statValue={st(j).racha}
                statLabel="seguidas"
              />
            ))}
          </div>
        </div>
      )}

      {/* HALL OF FAME */}
      {hallOfFame.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <p className="eyebrow" style={{ color: 'var(--color-gold)', marginBottom: '4px' }}>Hall of Fame</p>
          <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Campeones del mundo</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginBottom: '14px' }}>
            Veces que ganaron el mundial del grupo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hallOfFame.map((j, i) => (
              <PlayerCard
                key={j.id}
                jugador={j}
                goles={st(j).stats.goles}
                posicion={i + 1}
                stats={st(j).stats}
                racha={st(j).racha}
                statValue={st(j).mundiales}
                statLabel={st(j).mundiales === 1 ? 'mundial' : 'mundiales'}
              />
            ))}
          </div>
        </div>
      )}

      {/* CASI ALLÁ */}
      {casiAllaPlayers.length > 0 && (
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {casiAllaPlayers.map(j => (
            <div key={j.id} className="panel" style={{ padding: '14px 16px', borderColor: 'rgba(139,197,63,0.35)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MiniAvatar jugador={j} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-lime)', marginBottom: '2px' }}>
                  {j.apodo}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>
                  Si gana el próximo, sale campeón del mundo.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PECHO FRÍO */}
      {pechoFrioPlayers.length > 0 && (
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pechoFrioPlayers.map(j => (
            <div key={j.id} className="panel" style={{ padding: '14px 16px', borderColor: 'rgba(229,115,104,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MiniAvatar jugador={j} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#E57368', marginBottom: '2px' }}>
                  Pecho frio, {j.apodo}!
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)' }}>
                  Más suerte la próxima.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOP GOLEADORES */}
      <div style={{ marginBottom: '40px' }}>
        <p className="eyebrow" style={{ marginBottom: '12px' }}>Top goleadores</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topGoleadores.map((j, i) => (
            <PlayerCard
              key={j.id}
              jugador={j}
              goles={st(j).stats.goles}
              posicion={i + 1}
              stats={st(j).stats}
              racha={st(j).racha}
            />
          ))}
        </div>
      </div>

      {/* TOP VICTORIAS */}
      {topVictorias.length > 0 && (
        <div>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Top victorias</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topVictorias.map((j, i) => (
              <PlayerCard
                key={j.id}
                jugador={j}
                goles={st(j).stats.goles}
                posicion={i + 1}
                stats={st(j).stats}
                racha={st(j).racha}
                statValue={st(j).stats.partidosGanados}
                statLabel="vic."
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
