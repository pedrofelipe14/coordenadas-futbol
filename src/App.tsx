import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SeleccionGrupo from './pages/SeleccionGrupo'
import Home from './pages/Home'
import NuevoPartido from './pages/NuevoPartido'
import DetallePartido from './pages/DetallePartido'
import Plantel from './pages/Plantel'
import Perfil from './pages/Perfil'
import Chat from './pages/Chat'
import ResetPassword from './pages/ResetPassword'
import Legal from './pages/Legal'
import Privacidad from './pages/Privacidad'
import AlertaBanner from './components/AlertaBanner'

const Cargando = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bone-dim)' }}>
    Cargando...
  </div>
)

// Requiere auth. Si no hay sesión, manda a /login.
function AuthLayout() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Cargando />
  if (!session || !profile) return <Navigate to="/login" replace />
  return <Outlet />
}

// Requiere auth + grupo. Si no tiene grupo, manda a /grupo.
function GrupoLayout() {
  const { profile } = useAuth()
  if (!profile?.grupo_id) return <Navigate to="/grupo" replace />
  return (
    <>
      <Header />
      <AlertaBanner />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </>
  )
}

// /login: si ya tiene sesión y grupo, manda a /home; si tiene sesión pero no grupo, a /grupo.
function LoginRoute() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Cargando />
  if (session && profile) {
    return <Navigate to={profile.grupo_id ? '/home' : '/grupo'} replace />
  }
  return <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacidad" element={<Privacidad />} />

          <Route element={<AuthLayout />}>
            <Route path="/grupo" element={<SeleccionGrupo />} />

            <Route element={<GrupoLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/partido/nuevo" element={<NuevoPartido />} />
              <Route path="/partido/:id" element={<DetallePartido />} />
              <Route path="/jugadores" element={<Plantel />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
