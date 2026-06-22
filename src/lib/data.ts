import { supabase } from './supabase'
import type { Partido, PartidoCompleto, PartidoDetalle, GolConJugador, PartidoJugadorConPerfil, JugadaEpica, GoleadorStat, Profile, EstadisticasJugador, MensajeConAutor } from '../types'

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo(): string {
  return Array.from({ length: 6 }, () =>
    CODIGO_CHARS[Math.floor(Math.random() * CODIGO_CHARS.length)]
  ).join('')
}

// ----------------------------------------------------------------
// GRUPOS
// ----------------------------------------------------------------

export async function crearGrupo(nombre: string, userId: string): Promise<{ id: string; nombre: string; codigo: string }> {
  const id = crypto.randomUUID()
  const codigo = generarCodigo()

  const { error: errGrupo } = await supabase
    .from('grupos')
    .insert({ id, nombre: nombre.trim(), codigo, creado_por: userId })

  if (errGrupo) throw errGrupo

  const { error: errProfile } = await supabase
    .from('profiles')
    .update({ grupo_id: id, es_admin: true })
    .eq('id', userId)

  if (errProfile) throw errProfile

  return { id, nombre: nombre.trim(), codigo }
}

export async function unirseAGrupo(codigoInput: string, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc('buscar_grupo_por_codigo', {
    p_codigo: codigoInput.trim().toUpperCase(),
  })

  if (error || !data || data.length === 0) throw new Error('Código inválido')

  const { error: errProfile } = await supabase
    .from('profiles')
    .update({ grupo_id: data[0].id, es_admin: false })
    .eq('id', userId)

  if (errProfile) throw errProfile
}

// ----------------------------------------------------------------
// PARTIDOS — listado para Home
// ----------------------------------------------------------------

export async function fetchPartidos(): Promise<PartidoCompleto[]> {
  const { data: partidos, error: errPartidos } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha', { ascending: false })

  if (errPartidos) throw errPartidos
  if (!partidos || partidos.length === 0) return []

  const { data: goles, error: errGoles } = await supabase
    .from('goles')
    .select('*, jugador:profiles(*)')

  if (errGoles) throw errGoles

  return (partidos as Partido[]).map((p) => ({
    ...p,
    goles: (goles || []).filter((g) => g.partido_id === p.id) as GolConJugador[],
  }))
}

// ----------------------------------------------------------------
// PARTIDO — detalle completo (lineup + jugadas)
// ----------------------------------------------------------------

export async function fetchPartido(id: string): Promise<PartidoDetalle | null> {
  const { data: partido, error } = await supabase
    .from('partidos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !partido) return null

  const [golesResult, lineupResult, jugadasResult] = await Promise.all([
    supabase
      .from('goles')
      .select('*, jugador:profiles(*)')
      .eq('partido_id', id)
      .order('minuto', { ascending: true }),
    supabase
      .from('partido_jugadores')
      .select('*, jugador:profiles(*)')
      .eq('partido_id', id),
    supabase
      .from('jugadas_epicas')
      .select('*, jugador:profiles(*)')
      .eq('partido_id', id)
      .order('minuto', { ascending: true }),
  ])

  return {
    ...(partido as Partido),
    goles: (golesResult.data || []) as GolConJugador[],
    lineup: (lineupResult.data || []) as PartidoJugadorConPerfil[],
    jugadas: (jugadasResult.data || []) as JugadaEpica[],
  }
}

// ----------------------------------------------------------------
// ARRANCAR PARTIDO (pre-match)
// ----------------------------------------------------------------

export interface InputArrancarPartido {
  fecha: string
  hora: string | null
  lugar: string
  formato: '5' | '7' | '9'
  equipo_saque: 'A' | 'B' | null
  costo_cancha: number | null
  creado_por: string
  grupo_id: string
  lineup: { jugador_id: string; equipo: 'A' | 'B' }[]
}

export async function arrancarPartido(input: InputArrancarPartido): Promise<string> {
  const { data: partido, error: errPartido } = await supabase
    .from('partidos')
    .insert({
      fecha: input.fecha,
      hora: input.hora,
      lugar: input.lugar,
      formato: input.formato,
      equipo_a: 'Sin pechera',
      equipo_b: 'Con pechera',
      goles_a: 0,
      goles_b: 0,
      equipo_saque: input.equipo_saque,
      costo_cancha: input.costo_cancha,
      estado: 'en_curso',
      creado_por: input.creado_por,
      grupo_id: input.grupo_id,
    })
    .select('id')
    .single()

  if (errPartido) throw errPartido

  if (input.lineup.length > 0) {
    const { error: errLineup } = await supabase
      .from('partido_jugadores')
      .insert(input.lineup.map((l) => ({
        partido_id: partido.id,
        jugador_id: l.jugador_id,
        equipo: l.equipo,
      })))
    if (errLineup) throw errLineup
  }

  return partido.id
}

// ----------------------------------------------------------------
// CERRAR PARTIDO (post-match)
// ----------------------------------------------------------------

export interface InputCerrarPartido {
  id: string
  goles_a: number
  goles_b: number
  goles: { jugador_id: string; equipo: 'A' | 'B' | null; minuto: number | null; cantidad: number }[]
  jugadas: { descripcion: string; jugador_id: string | null; minuto: number | null; url: string | null }[]
}

export async function cerrarPartido(input: InputCerrarPartido): Promise<void> {
  const { error: errPartido } = await supabase
    .from('partidos')
    .update({ estado: 'finalizado', goles_a: input.goles_a, goles_b: input.goles_b })
    .eq('id', input.id)

  if (errPartido) throw errPartido

  // Borramos goles y jugadas previos para que sea seguro reintentar
  await supabase.from('goles').delete().eq('partido_id', input.id)
  await supabase.from('jugadas_epicas').delete().eq('partido_id', input.id)

  if (input.goles.length > 0) {
    const { error: errGoles } = await supabase.from('goles').insert(
      input.goles.map((g) => ({
        partido_id: input.id,
        jugador_id: g.jugador_id,
        cantidad: g.cantidad,
        equipo: g.equipo,
        minuto: g.minuto,
      }))
    )
    if (errGoles) throw errGoles
  }

  if (input.jugadas.length > 0) {
    const { error: errJugadas } = await supabase.from('jugadas_epicas').insert(
      input.jugadas.map((j) => ({
        partido_id: input.id,
        jugador_id: j.jugador_id || null,
        descripcion: j.descripcion,
        minuto: j.minuto,
        url: j.url || null,
      }))
    )
    if (errJugadas) throw errJugadas
  }
}

// ----------------------------------------------------------------
// JUGADAS ÉPICAS — editar URL
// ----------------------------------------------------------------

export async function updateJugadaUrl(jugadaId: string, url: string | null): Promise<void> {
  const { error } = await supabase
    .from('jugadas_epicas')
    .update({ url })
    .eq('id', jugadaId)
  if (error) throw error
}

// ----------------------------------------------------------------
// BORRAR PARTIDO
// ----------------------------------------------------------------

export async function borrarPartido(id: string): Promise<void> {
  const { error } = await supabase.from('partidos').delete().eq('id', id)
  if (error) throw error
}

// ----------------------------------------------------------------
// JUGADORES DEL GRUPO
// ----------------------------------------------------------------

export async function fetchJugadores(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('apodo')
  if (error) throw error
  return data as Profile[]
}

// ----------------------------------------------------------------
// PERFIL — stats personales + foto
// ----------------------------------------------------------------

export async function fetchEstadisticasJugador(jugadorId: string): Promise<EstadisticasJugador> {
  const [lineupRes, golesRes] = await Promise.all([
    supabase
      .from('partido_jugadores')
      .select('equipo, partido:partidos(goles_a, goles_b, estado)')
      .eq('jugador_id', jugadorId),
    supabase
      .from('goles')
      .select('cantidad')
      .eq('jugador_id', jugadorId),
  ])

  const totalGoles = (golesRes.data || []).reduce((acc: number, g: { cantidad: number }) => acc + g.cantidad, 0)

  let jugados = 0, ganados = 0, perdidos = 0, empatados = 0

  ;(lineupRes.data || []).forEach((l) => {
    const p = Array.isArray(l.partido) ? l.partido[0] : l.partido
    if (!p || p.estado !== 'finalizado') return
    jugados++
    if (p.goles_a === p.goles_b) { empatados++; return }
    const gane = (l.equipo === 'A' && p.goles_a > p.goles_b) || (l.equipo === 'B' && p.goles_b > p.goles_a)
    if (gane) ganados++
    else perdidos++
  })

  return { goles: totalGoles, partidosJugados: jugados, partidosGanados: ganados, partidosPerdidos: perdidos, partidosEmpatados: empatados }
}

export async function salirDeGrupo(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ grupo_id: null, es_admin: false })
    .eq('id', userId)
  if (error) throw error
}

export async function eliminarGrupo(): Promise<void> {
  const { error } = await supabase.rpc('eliminar_grupo')
  if (error) throw error
}

export async function promoverAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc('promover_admin', { p_user_id: userId })
  if (error) throw error
}

export async function quitarAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc('quitar_admin', { p_user_id: userId })
  if (error) throw error
}

export async function actualizarColor(userId: string, color: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_color: color })
    .eq('id', userId)
  if (error) throw error
}

export async function subirAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) throw updateError

  return publicUrl
}

// ----------------------------------------------------------------
// ESTADÍSTICAS
// ----------------------------------------------------------------

export function calcularGoleadores(partidos: PartidoCompleto[]): GoleadorStat[] {
  const mapa = new Map<string, GoleadorStat>()

  partidos.forEach((p) => {
    if (p.estado !== 'finalizado') return
    const jugadoresDelPartido = new Set<string>()
    p.goles.forEach((g) => {
      if (!g.jugador) return
      jugadoresDelPartido.add(g.jugador.id)
      const actual = mapa.get(g.jugador.id)
      if (actual) {
        actual.goles += g.cantidad
      } else {
        mapa.set(g.jugador.id, { jugador: g.jugador, goles: g.cantidad, partidosJugados: 0 })
      }
    })
    jugadoresDelPartido.forEach((jid) => {
      const actual = mapa.get(jid)
      if (actual) actual.partidosJugados += 1
    })
  })

  return Array.from(mapa.values()).sort((a, b) => b.goles - a.goles)
}

export function agruparPorMes(partidos: PartidoCompleto[]): Map<string, PartidoCompleto[]> {
  const grupos = new Map<string, PartidoCompleto[]>()
  partidos.forEach((p) => {
    const key = p.fecha.slice(0, 7)
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(p)
  })
  return grupos
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ----------------------------------------------------------------
// CHAT
// ----------------------------------------------------------------

export async function fetchMensajes(grupoId: string): Promise<MensajeConAutor[]> {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*, autor:profiles(*)')
    .eq('grupo_id', grupoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  return ((data || []).reverse()).map((m) => ({
    ...m,
    autor: Array.isArray(m.autor) ? (m.autor[0] ?? null) : m.autor,
  })) as MensajeConAutor[]
}

export async function enviarMensaje(grupoId: string, autorId: string, contenido: string): Promise<void> {
  const { error } = await supabase
    .from('mensajes')
    .insert({ grupo_id: grupoId, autor_id: autorId, contenido: contenido.trim() })
  if (error) throw error
}

export function etiquetaMes(key: string): string {
  const [anio, mes] = key.split('-')
  return `${NOMBRES_MES[parseInt(mes, 10) - 1]} ${anio}`
}
