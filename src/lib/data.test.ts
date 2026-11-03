import { describe, expect, it, vi } from 'vitest'
import type { PartidoCompleto, Profile } from '../types'

// Estas funciones son lógica pura: no tocan la base, así que el cliente de Supabase se reemplaza.
vi.mock('./supabase', () => ({ supabase: {} }))

const { calcularGoleadores, agruparPorMes, etiquetaMes } = await import('./data')

function jugador(id: string): Profile {
  return {
    id,
    apodo: id,
    dorsal: 10,
    avatar_color: '#8BC53F',
    avatar_url: null,
    grupo_id: 'g1',
    es_admin: false,
    es_dev: false,
    apodo_cambiado_at: null,
    created_at: '2026-01-01T00:00:00Z',
  }
}

function partido(
  id: string,
  fecha: string,
  goles: { jugador: string; cantidad: number }[],
  estado: PartidoCompleto['estado'] = 'finalizado',
): PartidoCompleto {
  return {
    id,
    fecha,
    hora: null,
    lugar: 'Cancha',
    formato: '5',
    equipo_a: 'A',
    equipo_b: 'B',
    goles_a: 0,
    goles_b: 0,
    costo_cancha: null,
    creado_por: null,
    grupo_id: 'g1',
    estado,
    equipo_saque: null,
    created_at: fecha,
    goles: goles.map((g, i) => ({
      id: `${id}-gol-${i}`,
      partido_id: id,
      jugador_id: g.jugador,
      cantidad: g.cantidad,
      equipo: null,
      minuto: null,
      created_at: fecha,
      jugador: jugador(g.jugador),
    })),
  }
}

describe('calcularGoleadores', () => {
  it('suma los goles de cada jugador entre partidos y ordena de mayor a menor', () => {
    const tabla = calcularGoleadores([
      partido('p1', '2026-03-01', [{ jugador: 'lio', cantidad: 2 }, { jugador: 'fede', cantidad: 1 }]),
      partido('p2', '2026-03-08', [{ jugador: 'fede', cantidad: 3 }]),
    ])

    expect(tabla.map((g) => [g.jugador.id, g.goles])).toEqual([
      ['fede', 4],
      ['lio', 2],
    ])
  })

  it('cuenta un partido jugado por partido, aunque el jugador tenga varias filas de gol', () => {
    const tabla = calcularGoleadores([
      partido('p1', '2026-03-01', [{ jugador: 'lio', cantidad: 1 }, { jugador: 'lio', cantidad: 2 }]),
      partido('p2', '2026-03-08', [{ jugador: 'lio', cantidad: 1 }]),
    ])

    expect(tabla).toHaveLength(1)
    expect(tabla[0].goles).toBe(4)
    expect(tabla[0].partidosJugados).toBe(2)
  })

  it('ignora los partidos que todavía están en curso', () => {
    const tabla = calcularGoleadores([
      partido('p1', '2026-03-01', [{ jugador: 'lio', cantidad: 5 }], 'en_curso'),
      partido('p2', '2026-03-08', [{ jugador: 'fede', cantidad: 1 }]),
    ])

    expect(tabla.map((g) => g.jugador.id)).toEqual(['fede'])
  })

  it('devuelve una tabla vacía si no hay partidos', () => {
    expect(calcularGoleadores([])).toEqual([])
  })
})

describe('agruparPorMes', () => {
  it('agrupa los partidos por año y mes, conservando el orden', () => {
    const grupos = agruparPorMes([
      partido('p1', '2026-03-29', []),
      partido('p2', '2026-03-01', []),
      partido('p3', '2026-04-05', []),
    ])

    expect([...grupos.keys()]).toEqual(['2026-03', '2026-04'])
    expect(grupos.get('2026-03')!.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(grupos.get('2026-04')!.map((p) => p.id)).toEqual(['p3'])
  })
})

describe('etiquetaMes', () => {
  it('convierte una clave año-mes en el nombre del mes', () => {
    expect(etiquetaMes('2026-01')).toBe('Enero 2026')
    expect(etiquetaMes('2025-12')).toBe('Diciembre 2025')
  })
})
