// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [cargando, setCargando]       = useState(false)
  const [verPassword, setVerPassword] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Todos los campos son obligatorios')
      return
    }
    setCargando(true)
    try {
      const usuario = await login(email, password)
      if (usuario.rol === 'ADMIN') {
      navigate('/ventas') // despues cambiar por dashboard
    } else {
      navigate('/ventas')
    }
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-[#f6faff] min-h-screen flex flex-col">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#edf4fc]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00527b] text-3xl">medical_services</span>
          <span className="text-[#00527b] font-extrabold text-xl">FarmaSmart</span>
        </div>
        <button className="flex items-center gap-1 text-slate-500 hover:text-[#00527b] transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="hidden md:inline text-sm font-medium">Ayuda</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-lg">

          {/* Branding */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#edf4fc] rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[#00527b] text-4xl">local_pharmacy</span>
            </div>
            <h1 className="text-3xl font-bold text-[#00527b] tracking-tight mb-2">Iniciar Sesión</h1>
            <p className="text-slate-500 text-sm">Accede a tu panel de gestión</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1" htmlFor="email">
                Correo electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@farmacia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[#f1f5f9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00527b]/20 focus:bg-white transition-all outline-none border-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Contraseña *
                </label>
                <a className="text-xs font-bold text-[#00527b] hover:underline" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400">lock</span>
                </div>
                <input
                  id="password"
                  type={verPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 bg-[#f1f5f9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00527b]/20 focus:bg-white transition-all outline-none border-none"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined">
                    {verPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#00527b] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1a6b9a] transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-slate-100 text-center space-y-4">

            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-slate-400" style={{fontSize: '18px'}}>person_add</span>
              <p className="text-sm text-slate-500">
                ¿No tienes cuenta?{' '}
                <a href="/registro" className="text-[#00527b] font-bold hover:underline">
                  Regístrate aquí
                </a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs text-slate-300">o</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Al ingresar, aceptas nuestros{' '}
              <a className="text-[#00527b] font-bold hover:underline" href="#">Términos de Servicio</a>
              {' '}y{' '}
              <a className="text-[#00527b] font-bold hover:underline" href="#">Política de Privacidad</a>.
            </p>

          </div>
        </div>
      </main>
    </div>
  )
} 