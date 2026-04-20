// src/pages/empleados/GestionEmpleados.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEmpleadosService, eliminarEmpleadoService } from '../../services/empleadosService'

const ROL_BADGE = {
  ADMIN:    { label: 'Admin',    bg: 'bg-[#cde5fd] text-[#1a6b9a]' },
  EMPLEADO: { label: 'Empleado', bg: 'bg-[#ffddb6] text-[#6d4400]' },
}

function Avatar({ nombre }) {
  const iniciales = nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] flex items-center justify-center shrink-0">
      <span className="text-white text-sm font-bold">{iniciales}</span>
    </div>
  )
}

export default function GestionEmpleados() {
  const navigate = useNavigate()
  const [empleados,  setEmpleados]  = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroRol,  setFiltroRol]  = useState('TODOS')
  const [confirmar,  setConfirmar]  = useState(null)   // id a eliminar
  const [error,      setError]      = useState('')

  const cargar = async () => {
    setCargando(true)
    try {
      setEmpleados(await listarEmpleadosService())
    } catch { setError('No se pudo cargar la lista de empleados') }
    finally  { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleEliminar = async () => {
    try {
      await eliminarEmpleadoService(confirmar)
      setConfirmar(null)
      cargar()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al eliminar empleado')
      setConfirmar(null)
    }
  }

  const filtrados = empleados.filter(emp => {
    const coincide = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                     emp.email.toLowerCase().includes(busqueda.toLowerCase())
    const rol      = filtroRol === 'TODOS' || emp.rol === filtroRol
    return coincide && rol
  })

  const activos   = empleados.filter(e => e.activo).length
  const admins    = empleados.filter(e => e.rol === 'ADMIN').length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-[#00527b] uppercase tracking-widest">Recursos Humanos</span>
            <h1 className="text-4xl font-extrabold text-[#151c22] tracking-tight mt-1">Gestión de Empleados</h1>
            <p className="text-[#4a6175] font-medium mt-1">Administra el equipo de tu farmacia</p>
          </div>
          <button
            onClick={() => navigate('/empleados/nuevo')}
            className="flex items-center gap-2 bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">person_add</span>
            Agregar Empleado
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Total Empleados', value: empleados.length, icon: 'group',             color: 'text-[#00527b]', bg: 'bg-[#cde5fd]' },
            { label: 'Activos',         value: activos,           icon: 'check_circle',      color: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'Administradores', value: admins,            icon: 'admin_panel_settings', color: 'text-[#6d4400]', bg: 'bg-[#ffddb6]' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-5">
              <div className={`${bg} p-4 rounded-xl`}>
                <span className={`material-symbols-outlined ${color} text-3xl`}>{icon}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#707880] tracking-wider">{label}</p>
                <p className="text-3xl font-black text-[#151c22]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl flex-1 shadow-sm">
            <span className="material-symbols-outlined text-[#707880]">search</span>
            <input
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#707880]"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          {['TODOS', 'ADMIN', 'EMPLEADO'].map(r => (
            <button key={r}
              onClick={() => setFiltroRol(r)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                ${filtroRol === r
                  ? 'bg-[#00527b] text-white shadow-sm'
                  : 'bg-white text-[#4a6175] hover:bg-[#dce3eb]'}`}>
              {r === 'TODOS' ? 'Todos' : r === 'ADMIN' ? 'Admins' : 'Empleados'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-5 py-4 rounded-xl text-red-700">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#707880]">
              <span className="material-symbols-outlined text-5xl mb-3 animate-spin">progress_activity</span>
              <p className="font-semibold">Cargando empleados...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#707880]">
              <span className="material-symbols-outlined text-5xl mb-3">group_off</span>
              <p className="font-semibold">No se encontraron empleados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#edf4fc] border-b border-[#dce3eb]">
                <tr>
                  {['Empleado', 'Correo', 'Rol', 'Estado', 'Desde', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-[#707880] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {filtrados.map(emp => {
                  const badge = ROL_BADGE[emp.rol]
                  return (
                    <tr key={emp.id} className="hover:bg-[#f6faff] transition-colors">
                      {/* Empleado */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={emp.nombre} />
                          <span className="font-semibold text-[#151c22]">{emp.nombre}</span>
                        </div>
                      </td>
                      {/* Correo */}
                      <td className="px-6 py-4 text-sm text-[#4a6175]">{emp.email}</td>
                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold w-fit px-2.5 py-1 rounded-full
                          ${emp.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {emp.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {/* Fecha */}
                      <td className="px-6 py-4 text-sm text-[#707880]">
                        {new Date(emp.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/empleados/${emp.id}`)}
                            title="Ver detalle"
                            className="p-2 hover:bg-[#edf4fc] rounded-lg transition-colors text-[#00527b]"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => navigate(`/empleados/${emp.id}/editar`)}
                            title="Editar"
                            className="p-2 hover:bg-[#edf4fc] rounded-lg transition-colors text-[#4a6175]"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => setConfirmar(emp.id)}
                            title="Eliminar"
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminar */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#151c22]/30 backdrop-blur-sm" onClick={() => setConfirmar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center space-y-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-red-500 text-3xl">person_remove</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#151c22]">¿Eliminar empleado?</h3>
              <p className="text-[#4a6175] text-sm mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(null)}
                className="flex-1 py-3 rounded-xl font-bold text-[#00527b] border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}