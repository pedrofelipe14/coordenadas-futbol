export interface Grupo {
  id: string
  nombre: string
  codigo: string
  creado_por: string | null
  created_at: string
}

export interface Profile {
  id: string
  apodo: string
  dorsal: number
  avatar_color: string
  avatar_url: string | null
  grupo_id: string | null
  es_admin: boolean
  es_dev: boolean
  apodo_cambiado_at: string | null
  created_at: string
}

export interface EstadisticasJugador {
  goles: number
  partidosJugados: number
  partidosGanados: number
  partidosPerdidos: number
  partidosEmpatados: number
}

export interface Partido {
  id: string
  fecha: string
  hora: string | null
  lugar: string
  formato: '5' | '7' | '9'
  equipo_a: string
  equipo_b: string
  goles_a: number
  goles_b: number
  costo_cancha: number | null
  creado_por: string | null
  grupo_id: string
  estado: 'en_curso' | 'finalizado'
  equipo_saque: 'A' | 'B' | null
  created_at: string
}

export interface Gol {
  id: string
  partido_id: string
  jugador_id: string
  cantidad: number
  equipo: 'A' | 'B' | null
  minuto: number | null
  created_at: string
}

export interface GolConJugador extends Gol {
  jugador: Profile
}

export interface PartidoCompleto extends Partido {
  goles: GolConJugador[]
}

export interface PartidoJugadorConPerfil {
  id: string
  partido_id: string
  jugador_id: string
  equipo: 'A' | 'B'
  jugador: Profile
}

export interface JugadaEpica {
  id: string
  partido_id: string
  jugador_id: string | null
  jugador?: Profile
  descripcion: string
  minuto: number | null
  url: string | null
  created_at: string
}

export interface Invitado {
  id: string
  partido_id: string
  nombre: string
  equipo: 'A' | 'B'
}

export interface PartidoDetalle extends PartidoCompleto {
  lineup: PartidoJugadorConPerfil[]
  jugadas: JugadaEpica[]
  invitados: Invitado[]
}

export interface GoleadorStat {
  jugador: Profile
  goles: number
  partidosJugados: number
}

export interface Convocatoria {
  id: string
  grupo_id: string
  estado: 'abierta' | 'cerrada'
  creado_por: string | null
  created_at: string
  cerrada_at: string | null
}

export interface ConvocatoriaConVotos extends Convocatoria {
  votos: { jugador_id: string; jugador: Profile }[]
}

export interface Mensaje {
  id: string
  grupo_id: string
  autor_id: string
  contenido: string
  created_at: string
}

export interface MensajeConAutor extends Mensaje {
  autor: Profile | null
}

export interface PagoCancha {
  partido_id: string
  jugador_id: string
  monto: number
  pagado: boolean
  pagado_at: string | null
  jugador: Profile | null
}

export interface PagoPartido {
  partido_id: string
  fecha: string
  costo_cancha: number
  pagos: PagoCancha[]
}

export interface MembresiaGrupo {
  perfil_id: string
  grupo_id: string
  grupo_nombre: string
  grupo_codigo: string
  grupo_creado_por: string | null
  es_admin: boolean
  joined_at: string
}
