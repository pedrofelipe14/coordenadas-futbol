import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { fetchProximoPartido } from '../lib/data'
import { supabase } from '../lib/supabase'

const DIAS  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatFechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const d = new Date(anio, mes - 1, dia)
  return `${DIAS[d.getDay()]} ${dia} de ${MESES[mes - 1]}`
}

export default function AlertaBanner() {
  const { grupo, profile } = useAuth()
  const [partido, setPartido] = useState<{ fecha: string; hora: string | null; lugar: string } | null | undefined>(undefined)

  useEffect(() => {
    if (!grupo || !profile) return

    function refetch() {
      fetchProximoPartido(profile!.id).then(setPartido).catch(() => setPartido(null))
    }

    refetch()

    const channel = supabase
      .channel(`alerta-${grupo.id}-${profile.id}`)
      // Nuevo lineup para este usuario → puede haber un partido nuevo que me incluya
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'partido_jugadores', filter: `jugador_id=eq.${profile.id}` },
        () => refetch(),
      )
      // Partido actualizado (ej: se cierra) → puede desaparecer la alerta
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'partidos', filter: `grupo_id=eq.${grupo.id}` },
        () => refetch(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [grupo?.id, profile?.id])

  if (!partido) return null

  const hoy = new Date().toISOString().slice(0, 10)
  const esHoy = partido.fecha === hoy
  const hora = partido.hora ? partido.hora.slice(0, 5) : null
  const lugar = partido.lugar || null

  const detalles = [hora ? `a las ${hora}` : null, lugar ? `en ${lugar}` : null].filter(Boolean).join(' · ')

  return (
    <div style={{
      background: esHoy ? 'rgba(212,175,55,0.1)' : 'rgba(139,197,63,0.07)',
      borderBottom: `1px solid ${esHoy ? 'rgba(212,175,55,0.22)' : 'rgba(139,197,63,0.18)'}`,
      padding: '9px 20px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '13px',
        color: esHoy ? 'var(--color-gold)' : 'var(--color-lime)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {esHoy
          ? `¡Hoy es el día del partido!${detalles ? ` ${detalles} · ` : ' '}¡Preparate!`
          : `Tenés un partido el ${formatFechaLarga(partido.fecha)}${detalles ? ` · ${detalles}` : ''} · ¡Recordalo!`
        }
      </p>
    </div>
  )
}
