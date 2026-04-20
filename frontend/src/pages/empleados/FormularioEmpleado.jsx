// src/pages/empleados/FormularioEmpleado.jsx
// Sirve tanto para CREAR (/empleados/nuevo) como EDITAR (/empleados/:id/editar)
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  obtenerEmpleadoService,
  crearEmpleadoService,
  actualizarEmpleadoService,
} from '../../services/empleadosService'

const CAMPO = 'w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-[#151c22] placeholder:text-[#707880] font-medium'

function InputIcon({ icon, children }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707880]">{icon}</span>
      {children}
    </div>
  )
}

export default function FormularioEmpleado() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState({
    nombre:   '',
    email:    '',
    password: '',
    rol:      'EMPLEADO',
    activo:   true,
  })
  const [verPass,   setVerPass]   = useState(false)
  const [cargando,  setCargando]  = useState(false)
  const [cargandoD, setCargandoD] = useState(esEdicion)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState(false)

  // Cargar datos al editar
  useEffect(() => {
    if (!esEdicion) return
    obtenerEmpleadoService(id)
      .then(emp => setForm({ nombre: emp.nombre, email: emp.email, password: '', rol: emp.rol, activo: emp.activo }))
      .catch(() => setError('No se pudo cargar el empleado'))
      .finally(() => setCargandoD(false))
  }, [id, esEdicion])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const validar = () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return false }
    if (!form.email.trim())  { setError('El correo es obligatorio'); return false }
    if (!esEdicion && form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validar()) return
    setCargando(true)
    try {
      const payload = esEdicion
        ? { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo }
        : { nombre: form.nombre, email: form.email, password: form.password, rol: form.rol }

      esEdicion
        ? await actualizarEmpleadoService(id, payload)
        : await crearEmpleadoService(payload)

      setExito(true)
      setTimeout(() => navigate('/empleados'), 1500)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar el empleado')
    } finally {
      setCargando(false)
    }
  }

  if (cargandoD) return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] flex items-center justify-center">
      <span className="material-symbols-outlined text-5xl text-[#00527b] animate-spin">progress_activity</span>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] flex items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#707880]">
          <button onClick={() => navigate('/empleados')} className="hover:text-[#00527b] font-medium transition-colors">
            Empleados
          </button>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="font-semibold text-[#151c22]">{esEdicion ? 'Editar Empleado' : 'Nuevo Empleado'}</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold text-[#00527b] tracking-tight">
            {esEdicion ? 'Editar Empleado' : 'Agregar Empleado'}
          </h1>
          <p className="text-[#4a6175] font-medium mt-1">
            {esEdicion ? 'Modifica los datos del empleado' : 'Completa los datos para registrar un nuevo miembro del equipo'}
          </p>
        </div>

        {/* Card formulario */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm space-y-6">

          {/* Nombre */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#40484f]">Nombre Completo *</label>
            <InputIcon icon="person">
              <input name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Ej. Dr. Juan García" className={CAMPO} />
            </InputIcon>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#40484f]">Correo Electrónico *</label>
            <InputIcon icon="mail">
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="empleado@farmacia.com" className={CAMPO} />
            </InputIcon>
          </div>

          {/* Password (solo al crear) */}
          {!esEdicion && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#40484f]">Contraseña *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707880]">lock</span>
                <input name="password" type={verPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`${CAMPO} pr-12`} />
                <button type="button" onClick={() => setVerPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#707880] hover:text-[#40484f]">
                  <span className="material-symbols-outlined">{verPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="text-xs text-[#707880] px-1">La contraseña podrá cambiarse después desde el perfil.</p>
            </div>
          )}

          {/* Rol */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#40484f]">Rol</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'EMPLEADO', label: 'Empleado',      icon: 'badge',                desc: 'Puede registrar ventas'       },
                { value: 'ADMIN',    label: 'Administrador', icon: 'admin_panel_settings',  desc: 'Acceso total al sistema'      },
              ].map(op => (
                <button key={op.value} type="button"
                  onClick={() => setForm(f => ({ ...f, rol: op.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                    ${form.rol === op.value
                      ? 'border-[#00527b] bg-[#edf4fc]'
                      : 'border-[#dce3eb] hover:border-[#00527b]/30'}`}>
                  <span className={`material-symbols-outlined text-xl ${form.rol === op.value ? 'text-[#00527b]' : 'text-[#707880]'}`}>
                    {op.icon}
                  </span>
                  <p className={`font-bold text-sm mt-1 ${form.rol === op.value ? 'text-[#00527b]' : 'text-[#151c22]'}`}>
                    {op.label}
                  </p>
                  <p className="text-xs text-[#707880] mt-0.5">{op.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Activo (solo edición) */}
          {esEdicion && (
            <div className="flex items-center justify-between p-4 bg-[#edf4fc] rounded-xl">
              <div>
                <p className="font-semibold text-[#151c22] text-sm">Estado de la cuenta</p>
                <p className="text-xs text-[#707880]">Los empleados inactivos no pueden iniciar sesión</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-[#dce3eb] peer-focus:ring-2 peer-focus:ring-[#00527b]/20 rounded-full peer peer-checked:bg-[#00527b] transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 px-4 py-3 rounded-xl text-red-700">
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-xl text-emerald-700">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <p className="text-sm font-bold">
                Empleado {esEdicion ? 'actualizado' : 'creado'} correctamente. Redirigiendo...
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-2">
            <button onClick={() => navigate('/empleados')}
              className="flex-1 py-4 rounded-2xl font-bold text-[#00527b] border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all active:scale-95">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={cargando}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-[#00527b] to-[#1a6b9a] shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {cargando ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Guardando...</>
              ) : (
                <><span className="material-symbols-outlined">save</span> {esEdicion ? 'Guardar Cambios' : 'Crear Empleado'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}