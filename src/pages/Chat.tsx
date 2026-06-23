import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { fetchPagoActivo, marcarPagado } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { PagoPartido } from '../types'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatFechaPago(fecha: string): string {
  const [, mes, dia] = fecha.split('-')
  return `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`
}

export default function Chat() {
  const { profile, grupo } = useAuth()
  const [pagoActivo, setPagoActivo] = useState<PagoPartido | null>(null)
  const [cargando, setCargando] = useState(true)
  const [pagando, setPagando] = useState(false)

  useEffect(() => {
    if (!grupo) return

    fetchPagoActivo()
      .then(setPagoActivo)
      .catch(() => setPagoActivo(null))
      .finally(() => setCargando(false))

    const channel = supabase
      .channel(`pagos-${grupo.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos_cancha' }, async () => {
        const p = await fetchPagoActivo().catch(() => null)
        setPagoActivo(p)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [grupo?.id])

  async function handlePagar() {
    if (!profile || !pagoActivo || pagando) return
    setPagando(true)
    try {
      await marcarPagado(pagoActivo.partido_id, profile.id)
      setPagoActivo((prev) => {
        if (!prev) return null
        const updated = prev.pagos.map((p) =>
          p.jugador_id === profile.id
            ? { ...p, pagado: true, pagado_at: new Date().toISOString() }
            : p
        )
        return updated.every((p) => p.pagado) ? null : { ...prev, pagos: updated }
      })
    } catch { /* ignore */ }
    finally { setPagando(false) }
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-bone-dim)' }}>
        Cargando...
      </div>
    )
  }

  /* ── IDLE: sin cobros pendientes ─────────────────────────── */
  if (!pagoActivo) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px' }}>
        <div className="panel" style={{
          textAlign: 'center',
          padding: '8px 40px 10px',
          maxWidth: '360px',
          width: '100%',
          borderColor: 'rgba(139,197,63,0.14)',
        }}>
          <img
            src="/idle.png"
            alt=""
            style={{ maxWidth: '220px', width: '100%', marginBottom: '0px', filter: 'grayscale(60%) opacity(0.35)' }}
          />
          <h3 style={{ fontSize: '22px', marginTop: '-10px', marginBottom: '10px' }}>Todo al día</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)', lineHeight: 1.65 }}>
            Cuando haya un partido con costo de cancha, acá van a aparecer los pagos pendientes.
          </p>
        </div>
      </div>
    )
  }

  /* ── PAGO ACTIVO ─────────────────────────────────────────── */
  const mePague = pagoActivo.pagos.find((p) => p.jugador_id === profile?.id)?.pagado ?? false
  const totalPagaron = pagoActivo.pagos.filter((p) => p.pagado).length
  const totalJugadores = pagoActivo.pagos.length

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 20px' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Cabecera */}
        <p className="eyebrow" style={{ marginBottom: '6px' }}>Pago de cancha</p>
        <h3 style={{ fontSize: '22px', marginBottom: '6px' }}>
          Partido del {formatFechaPago(pagoActivo.fecha)}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-bone-dim)', marginBottom: '24px' }}>
          Total{' '}
          <span style={{ color: 'var(--color-bone)' }}>${pagoActivo.costo_cancha}</span>
          {' · '}
          <span style={{ color: 'var(--color-lime)', fontWeight: 600 }}>
            ${pagoActivo.pagos[0]?.monto} por persona
          </span>
          {' · '}
          {totalPagaron}/{totalJugadores} pagaron
        </p>

        {/* Lista de jugadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {pagoActivo.pagos.map((p) => (
            <div
              key={p.jugador_id}
              className="panel"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderColor: p.pagado ? 'rgba(139,197,63,0.28)' : undefined,
              }}
            >
              {p.jugador && (
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: p.jugador.avatar_color, overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                  color: 'var(--color-carbon-deep)',
                }}>
                  {p.jugador.avatar_url
                    ? <img src={p.jugador.avatar_url} alt={p.jugador.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : p.jugador.dorsal
                  }
                </div>
              )}
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
                {p.jugador?.apodo ?? '?'}
              </span>
              {p.pagado ? (
                <span style={{
                  fontSize: '12px', color: 'var(--color-lime)',
                  fontFamily: 'var(--font-display)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Pagó ✓
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-bone-dim)', opacity: 0.55 }}>
                  Aún no pagó
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Acción del usuario */}
        {!mePague ? (
          <>
            <button
              onClick={handlePagar}
              disabled={pagando}
              className="btn"
              style={{ width: '100%', padding: '13px' }}
            >
              {pagando ? 'Registrando...' : 'Ya pagué ✓'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--color-bone-dim)' }}>
              Debés <span style={{ color: 'var(--color-bone)', fontWeight: 600 }}>
                ${pagoActivo.pagos.find((p) => p.jugador_id === profile?.id)?.monto ?? pagoActivo.pagos[0]?.monto}
              </span>
            </p>
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '14px',
            borderRadius: 'var(--radius)',
            background: 'rgba(139,197,63,0.07)',
            border: '1px solid rgba(139,197,63,0.18)',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--color-lime)', fontWeight: 600 }}>
              Ya registraste tu pago ✓
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-bone-dim)', marginTop: '3px' }}>
              Esperando que paguen los demás.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
