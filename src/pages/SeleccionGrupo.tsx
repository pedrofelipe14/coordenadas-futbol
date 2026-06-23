import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { crearGrupo, unirseAGrupo } from '../lib/data'
import { useAuth } from '../lib/AuthContext'

export default function SeleccionGrupo() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codigoParam = searchParams.get('codigo') ?? ''
  const [tab, setTab] = useState<'crear' | 'unirse'>(codigoParam ? 'unirse' : 'crear')
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [codigoInput, setCodigoInput] = useState(codigoParam)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [grupoCreado, setGrupoCreado] = useState<{ nombre: string; codigo: string } | null>(null)

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !nombreGrupo.trim()) return
    setCargando(true)
    setError(null)
    try {
      const resultado = await crearGrupo(nombreGrupo, profile.id)
      await refreshProfile()
      setGrupoCreado({ nombre: resultado.nombre, codigo: resultado.codigo })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el equipo. Probá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function handleUnirse(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !codigoInput.trim()) return
    setCargando(true)
    setError(null)
    try {
      await unirseAGrupo(codigoInput, profile.id)
      await refreshProfile()
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido. Revisá que esté bien escrito.')
    } finally {
      setCargando(false)
    }
  }

  const tabBtn = (activo: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px',
    background: activo ? 'var(--color-panel-raised)' : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: activo ? 'var(--color-lime)' : 'var(--color-bone-dim)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '13px',
    cursor: 'pointer',
  })

  if (grupoCreado) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '10px' }}>Equipo creado</p>
          <h2 style={{ fontSize: '26px', marginBottom: '28px' }}>{grupoCreado.nombre}</h2>

          <div className="panel" style={{ padding: '28px', marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Código del equipo
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '36px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: 'var(--color-lime)',
            }}>
              {grupoCreado.codigo}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-bone-dim)', marginTop: '12px' }}>
              Compartí este código con tu grupo para que se puedan unir.
            </p>
          </div>

          <button onClick={() => navigate('/home')} className="btn" style={{ width: '100%' }}>
            Ir al tablero
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p className="eyebrow" style={{ marginBottom: '8px' }}>Bienvenido, {profile?.apodo}</p>
          <h2 style={{ fontSize: '24px', lineHeight: 1.2 }}>
            Creá tu equipo<br />o unite a uno
          </h2>
        </div>

        <button
          onClick={signOut}
          className="btn-ghost"
          style={{ width: '100%', marginBottom: '20px', fontSize: '13px', opacity: 0.6 }}
        >
          Cerrar sesión
        </button>

        <div className="panel" style={{ padding: '4px', marginBottom: '20px' }}>
          <div style={{ display: 'flex' }}>
            <button style={tabBtn(tab === 'crear')} onClick={() => { setTab('crear'); setError(null) }}>
              Crear equipo
            </button>
            <button style={tabBtn(tab === 'unirse')} onClick={() => { setTab('unirse'); setError(null) }}>
              Unirme
            </button>
          </div>
        </div>

        {tab === 'crear' ? (
          <form
            onSubmit={handleCrear}
            className="panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label htmlFor="nombreGrupo">Nombre del equipo</label>
              <input
                id="nombreGrupo"
                type="text"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                placeholder="Ej: Los del Jueves, Cracks FC"
                maxLength={40}
                required
              />
            </div>
            {error && <p style={{ color: '#E57368', fontSize: '13px' }}>{error}</p>}
            <button type="submit" className="btn" disabled={cargando} style={{ marginTop: '4px' }}>
              {cargando ? 'Creando...' : 'Crear equipo'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleUnirse}
            className="panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label htmlFor="codigoInput">Código del equipo</label>
              <input
                id="codigoInput"
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                placeholder="Ej: A3BK7R"
                maxLength={6}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: '18px' }}
                required
              />
            </div>
            {error && <p style={{ color: '#E57368', fontSize: '13px' }}>{error}</p>}
            <button type="submit" className="btn" disabled={cargando} style={{ marginTop: '4px' }}>
              {cargando ? 'Buscando...' : 'Unirme al equipo'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
