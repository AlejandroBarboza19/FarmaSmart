// src/pages/empleados/CambiarPassword.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerEmpleadoService, cambiarPasswordService } from '../../services/empleadosService'

const CAMPO = 'w-full pl-12 pr-12 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-[#151c22] placeholder:text-[#707880] font-medium'

export default function CambiarPassword() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [empleado,  setEmpleado]  = useState(null)
  const [pass1,     setPass1]     = useState('')
  const [pass2,     setPass2]     = useState('')
  const [ver1,      setVer1]      = useState(false)
  const [ver2,      setVer2]      = useState(false)
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState(false)

  useEffect(() => {
    obtenerEmpleadoService(id).then(setEmpleado).catch(() => setError('No se pudo cargar el empleado'))
  }, [id])

  const fuerza = (p) => {
    if (p.length === 0) return null
    if (p.length < 6)   return { nivel: 1, label: 'Muy débil',  color: 'bg-red-400'    }
    if (p.length < 8)   return { nivel: 2, label: 'Débil',      color: 'bg-orange-400' }
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { nivel: 3, label: 'Media', color: 'bg-yellow-400' }
    return { nivel: 4, label: 'Fuerte', color: 'bg-emerald-500' }
  }

  const info = fuerza(pass1)

  const handleSubmit = async () => {
    if (pass1.length < 6)   { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (pass1 !== pass2)     { setError('Las contraseñas no coinciden'); return }
    setCargando(true)
    setError('')
    try {
      await cambiarPasswordService(id, pass1)
      setExito(true)
      setTimeout(() => navigate(`/empleados/${id}`), 1800)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cambiar la contraseña')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#edf4fc] flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#707880]">
          <button onClick={() => navigate('/empleados')} className="hover:text-[#00527b] font-medium transition-colors">
            Empleados
          </button>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          {empleado && (
            <>
              <button onClick={() => navigate(`/empleados/${id}`)} className="hover:text-[#00527b] font-medium transition-colors">
                {empleado.nombre}
              </button>
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </>
          )}
          <span className="font-semibold text-[#151c22]">Cambiar Contraseña</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold text-[#00527b] tracking-tight">Cambiar Contraseña</h1>
          {empleado && (
            <p className="text-[#4a6175] font-medium mt-1">
              Estableciendo nueva contraseña para <span className="font-bold text-[#151c22]">{empleado.nombre}</span>
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm space-y-6">

          {/* Alerta de seguridad */}
          <div className="flex items-start gap-3 bg-[#ffddb6]/40 border border-[#ffddb6] px-4 py-4 rounded-xl">
            <span className="material-symbols-outlined text-[#6d4400] mt-0.5">warning</span>
            <p className="text-sm text-[#6d4400] font-medium">
              El empleado deberá usar esta nueva contraseña en su próximo inicio de sesión.
            </p>
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#40484f]">Nueva Contraseña *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707880]">lock</span>
              <input type={ver1 ? 'text' : 'password'} value={pass1}
                onChange={e => { setPass1(e.target.value); setError('') }}
                placeholder="Mínimo 6 caracteres"
                className={CAMPO} />
              <button type="button" onClick={() => setVer1(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#707880] hover:text-[#40484f]">
                <span className="material-symbols-outlined">{ver1 ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {/* Indicador de fuerza */}
            {info && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`h-1.5 flex-1 rounded-full transition-all
                      ${n <= info.nivel ? info.color : 'bg-[#dce3eb]'}`} />
                  ))}
                </div>
                <p className="text-xs text-[#707880] font-medium px-0.5">{info.label}</p>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#40484f]">Confirmar Contraseña *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707880]">lock_reset</span>
              <input type={ver2 ? 'text' : 'password'} value={pass2}
                onChange={e => { setPass2(e.target.value); setError('') }}
                placeholder="Repite la contraseña"
                className={`${CAMPO} ${pass2 && pass1 !== pass2 ? 'ring-2 ring-red-400' : ''}`} />
              <button type="button" onClick={() => setVer2(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#707880] hover:text-[#40484f]">
                <span className="material-symbols-outlined">{ver2 ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {pass2 && pass1 !== pass2 && (
              <p className="text-xs text-red-500 font-medium px-1">Las contraseñas no coinciden</p>
            )}
          </div>

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
              <p className="text-sm font-bold">Contraseña actualizada correctamente. Redirigiendo...</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-2">
            <button onClick={() => navigate(`/empleados/${id}`)}
              className="flex-1 py-4 rounded-2xl font-bold text-[#00527b] border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all active:scale-95">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={cargando || exito}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-[#00527b] to-[#1a6b9a] shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {cargando ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Guardando...</>
              ) : (
                <><span className="material-symbols-outlined">lock_reset</span> Cambiar Contraseña</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}