import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { fetchMensajes, fetchJugadores, enviarMensaje } from '../lib/data'
import { supabase } from '../lib/supabase'
import type { MensajeConAutor, Profile } from '../types'

function formatHora(ts: string): string {
  const d = new Date(ts)
  const hoy = new Date()
  const esHoy = d.toDateString() === hoy.toDateString()
  if (esHoy) {
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  return (
    d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

function Avatar({ autor, size = 28 }: { autor: Profile; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: autor.avatar_color, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: size * 0.36, color: 'var(--color-carbon-deep)',
    }}>
      {autor.avatar_url
        ? <img src={autor.avatar_url} alt={autor.apodo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : autor.dorsal
      }
    </div>
  )
}

export default function Chat() {
  const { profile, grupo } = useAuth()
  const [mensajes, setMensajes] = useState<MensajeConAutor[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const perfilesRef = useRef<Map<string, Profile>>(new Map())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!grupo) return

    async function init() {
      const [msgs, jugadores] = await Promise.all([
        fetchMensajes(grupo!.id),
        fetchJugadores(),
      ])
      const map = new Map<string, Profile>()
      jugadores.forEach((j) => map.set(j.id, j))
      perfilesRef.current = map
      setMensajes(msgs)
      setCargando(false)
    }

    init()

    const channel = supabase
      .channel(`chat-${grupo.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `grupo_id=eq.${grupo.id}` },
        (payload) => {
          const row = payload.new as { id: string; grupo_id: string; autor_id: string; contenido: string; created_at: string }
          const autor = perfilesRef.current.get(row.autor_id) ?? null
          setMensajes((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, { ...row, autor }]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [grupo?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: cargando ? 'instant' : 'smooth' })
  }, [mensajes])

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    const contenido = texto.trim()
    if (!contenido || !profile || !grupo || enviando) return
    setTexto('')
    setEnviando(true)
    try {
      await enviarMensaje(grupo.id, profile.id, contenido)
    } catch { /* realtime won't fire on error */ }
    setEnviando(false)
    inputRef.current?.focus()
  }

  if (cargando) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-bone-dim)' }}>
        Cargando chat...
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* Lista de mensajes */}
      <div className="chat-mensajes">
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {mensajes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-bone-dim)' }}>
              <p style={{ fontSize: '14px' }}>Nadie escribió nada todavía.</p>
              <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>¡Rompé el hielo!</p>
            </div>
          )}

          {mensajes.map((m, i) => {
            const esMio = m.autor_id === profile?.id
            const anterior = mensajes[i - 1]
            const mismoAutor = anterior && anterior.autor_id === m.autor_id
            const msEntre = anterior ? (new Date(m.created_at).getTime() - new Date(anterior.created_at).getTime()) / 1000 / 60 : Infinity
            const mostrarCabecera = !mismoAutor || msEntre > 5

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: esMio ? 'flex-end' : 'flex-start',
                  marginTop: mostrarCabecera && i > 0 ? '6px' : '0',
                }}
              >
                {/* Cabecera: avatar + nombre (solo si cambia de autor o pasaron >5 min) */}
                {!esMio && mostrarCabecera && m.autor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingLeft: '2px' }}>
                    <Avatar autor={m.autor} size={22} />
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: m.autor.es_dev ? 'var(--color-gold)' : m.autor.es_admin ? 'var(--color-lime)' : 'var(--color-bone-dim)',
                    }}>
                      {m.autor.apodo}
                    </span>
                  </div>
                )}

                {/* Burbuja */}
                <div style={{
                  maxWidth: '72%',
                  padding: '8px 13px',
                  borderRadius: '14px',
                  borderBottomRightRadius: esMio ? '3px' : '14px',
                  borderBottomLeftRadius: esMio ? '14px' : '3px',
                  background: esMio ? 'rgba(139, 197, 63, 0.16)' : 'var(--color-panel)',
                  border: esMio
                    ? '1px solid rgba(139, 197, 63, 0.28)'
                    : '1px solid rgba(242,240,230,0.1)',
                }}>
                  <p style={{ fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {m.contenido}
                  </p>
                </div>

                {/* Hora */}
                <span style={{
                  fontSize: '10px', color: 'var(--color-bone-dim)', opacity: 0.45,
                  marginTop: '2px',
                  paddingLeft: esMio ? 0 : '2px',
                  paddingRight: esMio ? '2px' : 0,
                }}>
                  {formatHora(m.created_at)}
                </span>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <form
          onSubmit={handleEnviar}
          style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '10px' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            maxLength={500}
            autoComplete="off"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn"
            disabled={!texto.trim() || enviando}
            style={{ padding: '0 18px', flexShrink: 0, minWidth: '80px' }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
