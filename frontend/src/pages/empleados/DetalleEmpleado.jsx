// src/pages/empleados/DetalleEmpleado.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerEmpleadoService } from '../../services/empleadosService'

const ROL_BADGE = {
  ADMIN:    { label: 'Administrador', bg: 'bg-[#cde5fd] text-[#1a6b9a]', icon: 'admin_panel_settings' },
  EMPLEADO: { label: 'Empleado',      bg: 'bg-[#ffddb6] text-[#6d4400]', icon: 'badge'                },
}

function Avatar({ nombre, size = 'lg' }) {
  const iniciales = nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold">{iniciales}</span>
    </div>
  )
}

export default function DetalleEmpleado() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [emp,      setEmp]      = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    obtenerEmpleadoService(id)
      .then(setEmp)
      .catch(() => setError('No se pudo cargar el empleado'))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] flex items-center justify-center">
      <span className="material-symbols-outlined text-5xl text-[#00527b] animate-spin">progress_activity</span>
    </div>
  )

  if (error || !emp) return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] flex flex-col items-center justify-center gap-4 text-[#707880]">
      <span className="material-symbols-outlined text-5xl">error</span>
      <p className="font-semibold">{error || 'Empleado no encontrado'}</p>
      <button onClick={() => navigate('/empleados')} className="text-[#00527b] font-bold hover:underline">
        Volver a la lista
      </button>
    </div>
  )

  const badge = ROL_BADGE[emp.rol]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#707880]">
          <button onClick={() => navigate('/empleados')} className="hover:text-[#00527b] font-medium transition-colors">
            Empleados
          </button>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="font-semibold text-[#151c22]">{emp.nombre}</span>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar nombre={emp.nombre} size="lg" />
              <div>
                <h1 className="text-3xl font-extrabold text-[#151c22] tracking-tight">{emp.nombre}</h1>
                <p className="text-[#4a6175] font-medium mt-1">{emp.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${badge.bg}`}>
                    <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                    {badge.label}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                    ${emp.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {emp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            {/* Acciones rápidas */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/empleados/${emp.id}/editar`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#00527b] border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Editar
              </button>
              <button
                onClick={() => navigate(`/empleados/${emp.id}/password`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-br from-[#00527b] to-[#1a6b9a] hover:opacity-90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">lock_reset</span>
                Contraseña
              </button>
            </div>
          </div>
        </div>

        {/* Info cards bento */}
        <div className="grid grid-cols-2 gap-6">
          {/* Información personal */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#00527b]">
              <span className="material-symbols-outlined text-sm">person</span>
              <h3 className="font-bold text-sm uppercase tracking-wider">Información Personal</h3>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Nombre completo', value: emp.nombre,   icon: 'badge'  },
                { label: 'Correo',          value: emp.email,    icon: 'mail'   },
                { label: 'Rol',             value: badge.label,  icon: badge.icon },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="bg-[#edf4fc] p-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-[#00527b] text-lg">{icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#707880] tracking-wider">{label}</p>
                    <p className="font-semibold text-[#151c22]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cuenta */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#00527b]">
              <span className="material-symbols-outlined text-sm">manage_accounts</span>
              <h3 className="font-bold text-sm uppercase tracking-wider">Cuenta</h3>
            </div>
            <div className="space-y-5">
              {[
                { label: 'ID de usuario', value: `#${emp.id}`,   icon: 'tag'           },
                { label: 'Estado',        value: emp.activo ? 'Activo' : 'Inactivo', icon: 'toggle_on' },
                { label: 'Miembro desde', value: new Date(emp.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'calendar_today' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="bg-[#edf4fc] p-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-[#00527b] text-lg">{icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#707880] tracking-wider">{label}</p>
                    <p className="font-semibold text-[#151c22]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Volver */}
        <button
          onClick={() => navigate('/empleados')}
          className="flex items-center gap-2 text-[#4a6175] font-semibold hover:text-[#00527b] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver a la lista
        </button>
      </div>
    </div>
  )
}