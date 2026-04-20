// src/pages/Registro.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrarFarmaciaService } from '../services/api'

export default function Registro() {
  const [paso, setPaso] = useState(1)
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    farmacia_nombre:        '',
    farmacia_identificador: '',
    direccion:              '',
    telefono:               '',
    ciudad:                 '',
    nombre:                 '',
    email:                  '',
    password:               '',
    confirmar_password:     ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const validarPaso1 = () => {
    if (!form.farmacia_nombre || !form.farmacia_identificador || !form.direccion || !form.telefono || !form.ciudad) {
      setError('Todos los campos son obligatorios')
      return false
    }
    return true
  }

  const validarPaso2 = () => {
    if (!form.nombre || !form.email || !form.password || !form.confirmar_password) {
      setError('Todos los campos son obligatorios')
      return false
    }
    if (form.password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden')
      return false
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    return true
  }

  const handleSiguiente = () => {
    setError('')
    if (paso === 1 && validarPaso1()) setPaso(2)
    if (paso === 2 && validarPaso2()) setPaso(3)
  }

  const handleSubmit = async () => {
    setCargando(true)
    try {
      await registrarFarmaciaService({
        farmacia_nombre:        form.farmacia_nombre,
        farmacia_identificador: form.farmacia_identificador,
        nombre:                 form.nombre,
        email:                  form.email,
        password:               form.password
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar la farmacia')
      setPaso(1)
    } finally {
      setCargando(false)
    }
  }

  const progreso = paso === 1 ? 'w-1/3' : paso === 2 ? 'w-2/3' : 'w-full'

  return (
    <div className="bg-[#edf4fc] min-h-screen flex flex-col">

      {/* Header */}
      <header className="w-full top-0 sticky bg-slate-50 z-50">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00527b] text-3xl">local_pharmacy</span>
            <span className="font-extrabold tracking-tight text-xl text-sky-900">FarmaSmart</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <span className={`font-medium px-3 py-2 rounded-lg text-sm ${paso === 1 ? 'text-[#00527b] font-bold' : 'text-slate-400'}`}>
              Datos de la Farmacia
            </span>
            <span className={`font-medium px-3 py-2 rounded-lg text-sm ${paso === 2 ? 'text-[#00527b] font-bold' : 'text-slate-400'}`}>
              Configuración del Administrador
            </span>
            <span className={`font-medium px-3 py-2 rounded-lg text-sm ${paso === 3 ? 'text-[#00527b] font-bold' : 'text-slate-400'}`}>
              Verificación
            </span>
          </nav>
          <button className="p-2 text-slate-500 hover:bg-sky-50 rounded-full">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl">

          {/* Progress Header */}
          <div className="mb-10 space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#8ecdff] text-[#001e30] text-xs font-bold tracking-wider uppercase">
                Paso {paso} de 3
              </span>
              <span className="text-slate-500 text-sm font-medium">
                {paso === 1 ? 'Datos de la Farmacia' : paso === 2 ? 'Datos del Administrador' : 'Confirmación'}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-[#00527b] tracking-tight">
              {paso === 1 ? 'Datos de la Farmacia' : paso === 2 ? 'Datos del Administrador' : 'Confirmación'}
            </h1>
            <div className="pt-4">
              <div className="h-1.5 w-full bg-[#e2e9f1] rounded-full overflow-hidden">
                <div className={`h-full ${progreso} bg-gradient-to-r from-[#00527b] to-[#1a6b9a] rounded-full transition-all duration-500`}></div>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">

            {/* PASO 1 */}
            {paso === 1 && (
              <div className="p-10 md:p-14 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Nombre de la Farmacia <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">local_pharmacy</span>
                      <input
                        name="farmacia_nombre"
                        value={form.farmacia_nombre}
                        onChange={handleChange}
                        placeholder="Ej. Farmacia San Juan"
                        className="w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-400 px-1">Ingrese el nombre legal o comercial registrado.</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Identificador único <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                      <input
                        name="farmacia_identificador"
                        value={form.farmacia_identificador}
                        onChange={handleChange}
                        placeholder="Ej. farmacia-san-juan"
                        className="w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-400 px-1">Slug único sin espacios, solo letras minúsculas y guiones.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
                      <input
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="+57 300 000 0000"
                        className="w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">apartment</span>
                      <input
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChange}
                        placeholder="Ciudad de residencia"
                        className="w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                      <input
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                        placeholder="Calle, Número, Edificio"
                        className="w-full pl-12 pr-4 py-3 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                  </div>
                )}

                <div className="pt-6 flex items-center justify-between gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 text-[#00527b] font-bold hover:bg-[#edf4fc] rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSiguiente}
                    className="bg-gradient-to-r from-[#00527b] to-[#1a6b9a] px-12 py-4 rounded-2xl text-white font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                  >
                    Siguiente
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <div className="p-10 md:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  <div className="col-span-full space-y-2">
                    <label className="block text-sm font-semibold text-slate-500">Nombre Completo *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                      <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Ej. Dr. Alejandro Méndez"
                        className="w-full pl-12 pr-4 py-4 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="col-span-full space-y-2">
                    <label className="block text-sm font-semibold text-slate-500">Correo electrónico *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="admin@farmacia.com"
                        className="w-full pl-12 pr-4 py-4 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-500">Contraseña *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                      <input
                        name="password"
                        type={verPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <span className="material-symbols-outlined">
                          {verPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-500">Confirmar Contraseña *</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
                      <input
                        name="confirmar_password"
                        type="password"
                        value={form.confirmar_password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-[#dce3eb] rounded-xl outline-none focus:ring-2 focus:ring-[#00527b]/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 pt-6">
                  <button
                    onClick={() => setPaso(1)}
                    className="w-full md:w-auto px-8 py-4 border-2 border-[#00527b] text-[#00527b] font-bold rounded-2xl hover:bg-[#edf4fc] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Atrás
                  </button>
                  <button
                    onClick={handleSiguiente}
                    className="w-full md:w-auto bg-gradient-to-r from-[#00527b] to-[#1a6b9a] px-12 py-4 rounded-2xl text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Siguiente
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                <div className="bg-[#e8eff7] px-6 py-4 rounded-xl flex items-center justify-center gap-3 mt-4">
                  <span className="material-symbols-outlined text-slate-400">security</span>
                  <p className="text-slate-500 text-xs text-center">
                    Tus datos están protegidos con cifrado de grado clínico.
                  </p>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <div className="p-8 md:p-12">

                <div className="flex items-start gap-6 mb-10 p-6 bg-[#f6faff] rounded-xl border border-[#00527b]/10">
                  <div className="bg-[#00527b]/10 p-4 rounded-full">
                    <span className="material-symbols-outlined text-[#00527b] text-4xl">verified</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">¡Todo está listo!</h2>
                    <p className="text-slate-500 mt-1 leading-relaxed text-sm">
                      Revisa la información antes de finalizar el registro.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="bg-[#e8eff7] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-[#00527b]">
                      <span className="material-symbols-outlined text-sm">medical_services</span>
                      <h3 className="font-bold text-sm uppercase tracking-wider">Datos de la Farmacia</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre</p>
                        <p className="font-semibold text-slate-800">{form.farmacia_nombre}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identificador</p>
                        <p className="font-semibold text-slate-800">{form.farmacia_identificador}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección</p>
                        <p className="font-semibold text-slate-800">{form.direccion}, {form.ciudad}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teléfono</p>
                        <p className="font-semibold text-slate-800">{form.telefono}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#e8eff7] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-[#00527b]">
                      <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                      <h3 className="font-bold text-sm uppercase tracking-wider">Administrador</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre</p>
                        <p className="font-semibold text-slate-800">{form.nombre}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Correo</p>
                        <p className="font-semibold text-slate-800">{form.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nivel de acceso</p>
                        <p className="font-semibold text-slate-800">Administrador</p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl mt-6">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                  </div>
                )}

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <button
                    onClick={() => setPaso(2)}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-[#00527b] border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all active:scale-95"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={cargando}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-[#00527b] to-[#1a6b9a] hover:opacity-90 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {cargando ? 'Registrando...' : 'Registrar Farmacia'}
                    {!cargando && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-8 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">security</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Encriptación SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">gpp_good</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Datos Protegidos</span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Helper footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Necesitas ayuda?{' '}
              <a className="text-[#00527b] font-bold hover:underline" href="#">
                Contactar Soporte Técnico
              </a>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}