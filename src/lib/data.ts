import { supabase } from './supabase'
import type { Partido, PartidoCompleto, PartidoDetalle, GolConJugador, PartidoJugadorConPerfil, JugadaEpica, GoleadorStat, Profile, EstadisticasJugador, MensajeConAutor, MembresiaGrupo, PagoPartido, Invitado } from '../types'

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
  const { count } = await supabase
    .from('grupo_miembros')
    .select('*', { count: 'exact', head: true })
    .eq('perfil_id', userId)

  if ((count ?? 0) >= 2) throw new Error('Ya estás en el máximo de grupos permitidos (2)')

  const id = crypto.randomUUID()
  const codigo = generarCodigo()

  const { error: errGrupo } = await supabase
    .from('grupos')
    .insert({ id, nombre: nombre.trim(), codigo, creado_por: userId })
  if (errGrupo) throw errGrupo

  const { error: errMem } = await supabase
    .from('grupo_miembros')
    .insert({ perfil_id: userId, grupo_id: id, es_admin: true })
  if (errMem) throw errMem

  const { error: errProfile } = await supabase
    .from('profiles')
    .update({ grupo_id: id, es_admin: true })
    .eq('id', userId)
  if (errProfile) throw errProfile

  return { id, nombre: nombre.trim(), codigo }
}

export async function unirseAGrupo(codigoInput: string, userId: string): Promise<void> {
  const { count: cantGrupos } = await supabase
    .from('grupo_miembros')
    .select('*', { count: 'exact', head: true })
    .eq('perfil_id', userId)

  if ((cantGrupos ?? 0) >= 2) throw new Error('Ya estás en el máximo de grupos permitidos (2)')

  const { data, error } = await supabase.rpc('buscar_grupo_por_codigo', {
    p_codigo: codigoInput.trim().toUpperCase(),
  })

  if (error || !data || data.length === 0) throw new Error('Código inválido')

  const grupoId: string = data[0].id

  const { count: yaEsMiembro } = await supabase
    .from('grupo_miembros')
    .select('*', { count: 'exact', head: true })
    .eq('perfil_id', userId)
    .eq('grupo_id', grupoId)

  if ((yaEsMiembro ?? 0) > 0) throw new Error('Ya sos miembro de ese grupo')

  const { error: errMem } = await supabase
    .from('grupo_miembros')
    .insert({ perfil_id: userId, grupo_id: grupoId, es_admin: false })
  if (errMem) throw errMem

  const { error: errProfile } = await supabase
    .from('profiles')
    .update({ grupo_id: grupoId, es_admin: false })
    .eq('id', userId)
  if (errProfile) throw errProfile
}

export async function fetchMisGrupos(userId: string): Promise<MembresiaGrupo[]> {
  const { data, error } = await supabase
    .from('grupo_miembros')
    .select('perfil_id, grupo_id, es_admin, joined_at, grupo:grupos(nombre, codigo, creado_por)')
    .eq('perfil_id', userId)

  if (error) throw error

  return (data || []).map((m) => {
    const g = Array.isArray(m.grupo) ? m.grupo[0] : m.grupo as { nombre: string; codigo: string; creado_por: string | null } | null
    return {
      perfil_id: m.perfil_id as string,
      grupo_id: m.grupo_id as string,
      grupo_nombre: g?.nombre ?? '',
      grupo_codigo: g?.codigo ?? '',
      grupo_creado_por: g?.creado_por ?? null,
      es_admin: m.es_admin as boolean,
      joined_at: m.joined_at as string,
    }
  })
}

export async function cambiarGrupoActivo(userId: string, grupoId: string): Promise<void> {
  const { data: mem } = await supabase
    .from('grupo_miembros')
    .select('es_admin')
    .eq('perfil_id', userId)
    .eq('grupo_id', grupoId)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({ grupo_id: grupoId, es_admin: (mem as { es_admin: boolean } | null)?.es_admin ?? false })
    .eq('id', userId)
  if (error) throw error
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

  const [golesResult, lineupResult, jugadasResult, invitadosResult] = await Promise.all([
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
    supabase
      .from('partido_invitados')
      .select('*')
      .eq('partido_id', id),
  ])

  return {
    ...(partido as Partido),
    goles: (golesResult.data || []) as GolConJugador[],
    lineup: (lineupResult.data || []) as PartidoJugadorConPerfil[],
    jugadas: (jugadasResult.data || []) as JugadaEpica[],
    invitados: (invitadosResult.data || []) as Invitado[],
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
  invitados?: { nombre: string; equipo: 'A' | 'B' }[]
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

  if (input.invitados && input.invitados.length > 0) {
    await supabase.from('partido_invitados').insert(
      input.invitados.map((inv) => ({
        partido_id: partido.id,
        nombre: inv.nombre,
        equipo: inv.equipo,
      }))
    )
  }

  if (input.lineup.length > 0) {
    const { error: errLineup } = await supabase
      .from('partido_jugadores')
      .insert(input.lineup.map((l) => ({
        partido_id: partido.id,
        jugador_id: l.jugador_id,
        equipo: l.equipo,
      })))
    if (errLineup) throw errLineup

    if (input.costo_cancha && input.costo_cancha > 0) {
      await supabase.rpc('crear_pagos_partido', {
        p_partido_id: partido.id,
        p_costo: input.costo_cancha,
      })
    }
  }

  return partido.id
}

// ----------------------------------------------------------------
// PAGOS DE CANCHA
// ----------------------------------------------------------------

export async function fetchPagoActivo(): Promise<PagoPartido | null> {
  const [pagosRes, perfilesRes] = await Promise.all([
    supabase.from('pagos_cancha').select('partido_id, jugador_id, monto, pagado, pagado_at'),
    supabase.from('profiles').select('*'),
  ])

  type PagoRow = { partido_id: string; jugador_id: string; monto: number; pagado: boolean; pagado_at: string | null }
  const pagos = (pagosRes.data ?? []) as PagoRow[]
  const perfiles = new Map<string, Profile>(((perfilesRes.data ?? []) as Profile[]).map((p) => [p.id, p]))

  if (pagos.length === 0) return null

  // Agrupar por partido
  const byPartido = new Map<string, PagoRow[]>()
  for (const p of pagos) {
    if (!byPartido.has(p.partido_id)) byPartido.set(p.partido_id, [])
    byPartido.get(p.partido_id)!.push(p)
  }

  // Solo partidos con al menos un pago pendiente
  const conPendientes = [...byPartido.keys()].filter((pid) =>
    byPartido.get(pid)!.some((p) => !p.pagado)
  )
  if (conPendientes.length === 0) return null

  // Partido más reciente con pendientes
  const { data: partidos } = await supabase
    .from('partidos')
    .select('id, fecha, costo_cancha')
    .in('id', conPendientes)
    .order('fecha', { ascending: false })
    .limit(1)

  if (!partidos || partidos.length === 0) return null

  const p = partidos[0] as { id: string; fecha: string; costo_cancha: number }

  return {
    partido_id: p.id,
    fecha: p.fecha,
    costo_cancha: p.costo_cancha,
    pagos: (byPartido.get(p.id) ?? []).map((row) => ({
      partido_id: row.partido_id,
      jugador_id: row.jugador_id,
      monto: row.monto,
      pagado: row.pagado,
      pagado_at: row.pagado_at,
      jugador: perfiles.get(row.jugador_id) ?? null,
    })),
  }
}

export async function marcarPagado(partidoId: string, jugadorId: string): Promise<void> {
  const { error } = await supabase
    .from('pagos_cancha')
    .update({ pagado: true, pagado_at: new Date().toISOString() })
    .eq('partido_id', partidoId)
    .eq('jugador_id', jugadorId)
  if (error) throw error
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

export async function salirDeGrupo(userId: string, grupoId: string): Promise<void> {
  const { error: errMem } = await supabase
    .from('grupo_miembros')
    .delete()
    .eq('perfil_id', userId)
    .eq('grupo_id', grupoId)
  if (errMem) throw errMem

  // Si era el grupo activo, cambiar al otro (o null)
  const { data: prof } = await supabase
    .from('profiles')
    .select('grupo_id')
    .eq('id', userId)
    .maybeSingle()

  if ((prof as { grupo_id: string | null } | null)?.grupo_id === grupoId) {
    const { data: otras } = await supabase
      .from('grupo_miembros')
      .select('grupo_id, es_admin')
      .eq('perfil_id', userId)
      .limit(1)

    const otra = otras?.[0] as { grupo_id: string; es_admin: boolean } | undefined
    const { error } = await supabase
      .from('profiles')
      .update({ grupo_id: otra?.grupo_id ?? null, es_admin: otra?.es_admin ?? false })
      .eq('id', userId)
    if (error) throw error
  }
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

export async function cambiarApodo(nuevoApodo: string): Promise<void> {
  const { error } = await supabase.rpc('cambiar_apodo', { p_nuevo_apodo: nuevoApodo })
  if (error) throw new Error(error.message)
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

export interface StatusJugador {
  stats: EstadisticasJugador
  racha: number         // victorias consecutivas actuales
  rachaPerdidas: number // derrotas consecutivas actuales
  mundiales: number     // mundiales ganados históricamente
  pechoFrio: boolean    // perdió cuando estaba a 1 del siguiente mundial
  casiAlla: boolean     // racha % 7 === 6 → a 1 victoria del próximo mundial
}

export interface DatosPlantel {
  statusMap: Map<string, StatusJugador>
}

const MUNDIAL_CICLO = 7

export async function fetchDatosPlantel(): Promise<DatosPlantel> {
  type LineupRow = { jugador_id: string; equipo: string; partido: unknown }
  type PartidoRow = { goles_a: number; goles_b: number; estado: string; fecha: string; created_at: string }
  type GameEntry = { resultado: 'ganado' | 'perdido' | 'empate'; fecha: string; created_at: string }

  const [lineupRes, golesRes] = await Promise.all([
    supabase
      .from('partido_jugadores')
      .select('jugador_id, equipo, partido:partidos(goles_a, goles_b, estado, fecha, created_at)'),
    supabase
      .from('goles')
      .select('jugador_id, cantidad'),
  ])

  const _stats = new Map<string, EstadisticasJugador>()
  const _games = new Map<string, GameEntry[]>()

  function getOrCreate(id: string): EstadisticasJugador {
    if (!_stats.has(id)) {
      _stats.set(id, { goles: 0, partidosJugados: 0, partidosGanados: 0, partidosPerdidos: 0, partidosEmpatados: 0 })
    }
    return _stats.get(id)!
  }

  ;(golesRes.data || []).forEach((g: { jugador_id: string; cantidad: number }) => {
    getOrCreate(g.jugador_id).goles += g.cantidad
  })

  ;(lineupRes.data || []).forEach((l: LineupRow) => {
    const p = (Array.isArray(l.partido) ? l.partido[0] : l.partido) as PartidoRow | null
    if (!p || p.estado !== 'finalizado') return

    const s = getOrCreate(l.jugador_id)
    s.partidosJugados++

    let resultado: GameEntry['resultado']
    if (p.goles_a === p.goles_b) {
      resultado = 'empate'
      s.partidosEmpatados++
    } else {
      const gane = (l.equipo === 'A' && p.goles_a > p.goles_b) || (l.equipo === 'B' && p.goles_b > p.goles_a)
      resultado = gane ? 'ganado' : 'perdido'
      if (gane) s.partidosGanados++
      else s.partidosPerdidos++
    }

    const arr = _games.get(l.jugador_id) ?? []
    arr.push({ resultado, fecha: p.fecha, created_at: p.created_at })
    _games.set(l.jugador_id, arr)
  })

  const statusMap = new Map<string, StatusJugador>()
  const emptyStats = (): EstadisticasJugador => ({ goles: 0, partidosJugados: 0, partidosGanados: 0, partidosPerdidos: 0, partidosEmpatados: 0 })

  _games.forEach((games, id) => {
    // Cronológico ascendente para computar racha y mundiales correctamente
    const asc = [...games].sort((a, b) =>
      a.fecha !== b.fecha ? a.fecha.localeCompare(b.fecha) : a.created_at.localeCompare(b.created_at)
    )

    let racha = 0
    let rachaPerdidas = 0
    let mundiales = 0
    let rachaAntesDeUltimaRuptura = 0 // para detectar pecho frío

    for (const g of asc) {
      if (g.resultado === 'ganado') {
        racha++
        rachaPerdidas = 0
        if (racha % MUNDIAL_CICLO === 0) mundiales++
      } else if (g.resultado === 'perdido') {
        if (racha > 0) rachaAntesDeUltimaRuptura = racha
        racha = 0
        rachaPerdidas++
      } else {
        // empate: no corta racha de victorias ni de derrotas
      }
    }

    const ultimoPartido = asc[asc.length - 1]
    const pechoFrio =
      racha === 0 &&
      !!ultimoPartido &&
      ultimoPartido.resultado !== 'ganado' &&
      rachaAntesDeUltimaRuptura > 0 &&
      rachaAntesDeUltimaRuptura % MUNDIAL_CICLO === MUNDIAL_CICLO - 1

    const casiAlla = racha > 0 && racha % MUNDIAL_CICLO === MUNDIAL_CICLO - 1

    statusMap.set(id, {
      stats: _stats.get(id) ?? emptyStats(),
      racha,
      rachaPerdidas,
      mundiales,
      pechoFrio,
      casiAlla,
    })
  })

  // Jugadores que solo tienen goles (sin apariciones en lineup)
  _stats.forEach((stats, id) => {
    if (!statusMap.has(id)) {
      statusMap.set(id, { stats, racha: 0, rachaPerdidas: 0, mundiales: 0, pechoFrio: false, casiAlla: false })
    }
  })

  return { statusMap }
}

export async function fetchProximoPartido(userId: string): Promise<{ fecha: string; hora: string | null; lugar: string } | null> {
  const hoy = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('partidos')
    .select('id, fecha, hora, lugar')
    .eq('estado', 'en_curso')
    .gte('fecha', hoy)
    .order('fecha', { ascending: true })
    .limit(10)

  if (error || !data || data.length === 0) return null

  for (const p of data as { id: string; fecha: string; hora: string | null; lugar: string }[]) {
    const { count } = await supabase
      .from('partido_jugadores')
      .select('*', { count: 'exact', head: true })
      .eq('partido_id', p.id)
      .eq('jugador_id', userId)

    if ((count ?? 0) > 0) return { fecha: p.fecha, hora: p.hora, lugar: p.lugar }
  }

  return null
}

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
