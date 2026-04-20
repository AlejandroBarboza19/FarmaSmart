// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import Login              from './pages/Login'
import Registro           from './pages/Registro'
import Ventas             from './pages/Ventas'
import GestionEmpleados   from './pages/empleados/GestionEmpleados'
import FormularioEmpleado from './pages/empleados/FormularioEmpleado'
import DetalleEmpleado    from './pages/empleados/DetalleEmpleado'
import CambiarPassword    from './pages/empleados/CambiarPassword'
import Perfil        from './pages/Perfil'
import Configuracion from './pages/Configuracion'

// ── Ruta protegida con Layout ──────────────────────────────────
function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (soloAdmin && usuario.rol !== 'ADMIN') return <Navigate to="/ventas" replace />
  return <Layout>{children}</Layout>
}

// ── App ────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Protegidas — cualquier rol */}
          <Route path="/ventas" element={
            <RutaProtegida><Ventas /></RutaProtegida>
          } />
          <Route path="/perfil"        element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />

          {/* Protegidas — solo ADMIN */}
          <Route path="/empleados" element={
            <RutaProtegida soloAdmin><GestionEmpleados /></RutaProtegida>
          } />
          <Route path="/empleados/nuevo" element={
            <RutaProtegida soloAdmin><FormularioEmpleado /></RutaProtegida>
          } />
          <Route path="/empleados/:id" element={
            <RutaProtegida soloAdmin><DetalleEmpleado /></RutaProtegida>
          } />
          <Route path="/empleados/:id/editar" element={
            <RutaProtegida soloAdmin><FormularioEmpleado /></RutaProtegida>
          } />
          <Route path="/empleados/:id/password" element={
            <RutaProtegida soloAdmin><CambiarPassword /></RutaProtegida>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}