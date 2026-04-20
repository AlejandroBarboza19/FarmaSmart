import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Componente auxiliar para el círculo del Avatar
function Avatar({ nombre, size = 'sm' }) {
  const iniciales = (nombre || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold">{iniciales}</span>
    </div>
  )
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef(null)

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Definición de navegación con control de acceso
  const NAV_LINKS = [
    { to: '/ventas', label: 'Ventas' },
    { to: '/empleados', label: 'Empleados', soloAdmin: true },
    { to: '/reportes', label: 'Reportes', soloAdmin: true },
  ]

  const esAdmin = usuario?.rol === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#f6faff] flex flex-col">

      {/* ── TopBar ────────────────────────────────────────── */}
      <header className="bg-slate-50 shadow-sm w-full h-16 flex items-center justify-between px-8 sticky top-0 z-[60]">

        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <span
            onClick={() => navigate('/ventas')}
            className="text-2xl font-bold tracking-tighter text-sky-900 cursor-pointer select-none"
          >
            FarmaSmart
          </span>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.filter(l => !l.soloAdmin || esAdmin).map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                   ${isActive
                    ? 'text-[#00527b] bg-[#edf4fc] border-b-2 border-[#00527b]'
                    : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-3">

          {/* Notificaciones */}
          <div className="relative">
            <button className="p-2 hover:bg-sky-50 rounded-lg transition-all active:scale-95">
              <span className="material-symbols-outlined text-slate-500">notifications</span>
            </button>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </div>

          {/* Configuración - SOLO ADMIN */}
          {esAdmin && (
            <button 
              onClick={() => navigate('/configuracion')}
              className="p-2 hover:bg-sky-50 rounded-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-slate-500">settings</span>
            </button>
          )}

          {/* Avatar con menú desplegable */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-sky-50 transition-all active:scale-95"
            >
              <Avatar nombre={usuario?.nombre || 'Usuario'} size="lg" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#151c22] leading-tight">{usuario?.nombre || 'Usuario'}</p>
                <p className="text-[10px] text-[#707880] font-medium uppercase tracking-wide">{usuario?.rol}</p>
              </div>
              <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-200
                ${menuAbierto ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Dropdown */}
            {menuAbierto && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl shadow-xl border border-[#e2e9f1] overflow-hidden z-50">

                {/* Info usuario */}
                <div className="px-5 py-4 bg-[#edf4fc] flex items-center gap-3">
                  <Avatar nombre={usuario?.nombre || 'Usuario'} size="lg" />
                  <div>
                    <p className="font-bold text-[#151c22] text-sm">{usuario?.nombre || 'Usuario'}</p>
                    <p className="text-xs text-[#707880]">{usuario?.email || ''}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 inline-block
                      ${esAdmin ? 'bg-[#cde5fd] text-[#1a6b9a]' : 'bg-[#ffddb6] text-[#6d4400]'}`}>
                      {usuario?.rol}
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  {/* Mi Perfil (Para todos) */}
                  <button
                    onClick={() => { setMenuAbierto(false); navigate('/perfil') }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#151c22] hover:bg-[#edf4fc] transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[#00527b]">manage_accounts</span>
                    Mi Perfil
                  </button>

                  {/* Gestión de Empleados - SOLO ADMIN */}
                  {esAdmin && (
                    <button
                      onClick={() => { setMenuAbierto(false); navigate('/empleados') }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#151c22] hover:bg-[#edf4fc] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[#00527b]">group</span>
                      Gestión de Empleados
                    </button>
                  )}

                  {/* Configuración Farmacia - SOLO ADMIN */}
                  {esAdmin && (
                    <button
                      onClick={() => { setMenuAbierto(false); navigate('/configuracion') }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#151c22] hover:bg-[#edf4fc] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[#00527b]">settings</span>
                      Configuración Farmacia
                    </button>
                  )}

                  <div className="border-t border-[#e2e9f1] my-2" />

                  {/* Cerrar sesión */}
                  <button
                    onClick={() => { setMenuAbierto(false); logout() }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Contenido ─────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}