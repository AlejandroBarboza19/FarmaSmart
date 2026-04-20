import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  obtenerPerfilService, actualizarPerfilService,
  cambiarPasswordService, subirFotoService
} from '../services/api'

export default function Perfil() {
  const { usuario, setUsuario } = useAuth()
  const [tab,         setTab]         = useState('datos')
  const [nombre,      setNombre]      = useState('')
  const [email,       setEmail]       = useState('')
  const [pwActual,    setPwActual]    = useState('')
  const [pwNueva,     setPwNueva]     = useState('')
  const [pwConfirm,   setPwConfirm]   = useState('')
  const [fotoPreview, setFotoPreview] = useState(null)
  const [cargando,    setCargando]    = useState(false)
  const [mensaje,     setMensaje]     = useState(null) // { tipo: 'ok'|'error', texto }
  const fileRef = useRef()

  useEffect(() => {
    obtenerPerfilService().then(res => {
      setNombre(res.data.nombre)
      setEmail(res.data.email)
      setFotoPreview(res.data.foto_url)
    })
  }, [])

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  const guardarDatos = async () => {
    setCargando(true)
    try {
      const res = await actualizarPerfilService({ nombre, email })
      setUsuario(prev => ({ ...prev, nombre: res.data.nombre, email: res.data.email }))
      mostrarMensaje('ok', 'Datos actualizados correctamente')
    } catch (e) {
      mostrarMensaje('error', e.response?.data?.detail || 'Error al actualizar')
    } finally { setCargando(false) }
  }

  const cambiarPassword = async () => {
    if (pwNueva !== pwConfirm) { mostrarMensaje('error', 'Las contraseñas no coinciden'); return }
    setCargando(true)
    try {
      await cambiarPasswordService({ password_actual: pwActual, password_nueva: pwNueva })
      mostrarMensaje('ok', 'Contraseña cambiada correctamente')
      setPwActual(''); setPwNueva(''); setPwConfirm('')
    } catch (e) {
      mostrarMensaje('error', e.response?.data?.detail || 'Error al cambiar contraseña')
    } finally { setCargando(false) }
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoPreview(URL.createObjectURL(file))
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await subirFotoService(form)
      setUsuario(prev => ({ ...prev, foto_url: res.data.foto_url }))
      mostrarMensaje('ok', 'Foto actualizada')
    } catch {
      mostrarMensaje('error', 'Error al subir foto')
    }
  }

  const iniciales = (nombre || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const tabs = [
    { id: 'datos',    label: 'Datos personales', icon: 'manage_accounts' },
    { id: 'password', label: 'Contraseña',        icon: 'lock'            },
    { id: 'foto',     label: 'Foto de perfil',    icon: 'face'            },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Mi Perfil</h1>
      <p className="text-slate-500 mb-8">Gestiona tu información personal</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
              ${tab === t.id ? 'bg-white text-[#00527b] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold
          ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <span className="material-symbols-outlined">
            {mensaje.tipo === 'ok' ? 'check_circle' : 'error'}
          </span>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm p-8">

        {/* ── Datos personales ── */}
        {tab === 'datos' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre completo</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full bg-[#f6faff] border border-[#dce3eb] rounded-xl h-12 px-4 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#00527b]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#f6faff] border border-[#dce3eb] rounded-xl h-12 px-4 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#00527b]" />
            </div>
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full
                  ${usuario?.rol === 'ADMIN' ? 'bg-[#cde5fd] text-[#1a6b9a]' : 'bg-[#ffddb6] text-[#6d4400]'}`}>
                  {usuario?.rol}
                </span>
                <span className="text-xs text-slate-400">No editable</span>
              </div>
            </div>
            <button onClick={guardarDatos} disabled={cargando}
              className="w-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white py-3 rounded-2xl font-bold shadow-md hover:brightness-110 transition-all disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}

        {/* ── Contraseña ── */}
        {tab === 'password' && (
          <div className="space-y-6">
            {[
              { label: 'Contraseña actual',       val: pwActual,  set: setPwActual  },
              { label: 'Nueva contraseña',         val: pwNueva,   set: setPwNueva   },
              { label: 'Confirmar nueva contraseña', val: pwConfirm, set: setPwConfirm },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full bg-[#f6faff] border border-[#dce3eb] rounded-xl h-12 px-4 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#00527b]" />
              </div>
            ))}
            <button onClick={cambiarPassword} disabled={cargando}
              className="w-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white py-3 rounded-2xl font-bold shadow-md hover:brightness-110 transition-all disabled:opacity-50">
              {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        )}

        {/* ── Foto ── */}
        {tab === 'foto' && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {fotoPreview
                ? <img src={fotoPreview} alt="Foto" className="w-32 h-32 rounded-full object-cover ring-4 ring-[#00527b]/20" />
                : <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{iniciales}</span>
                  </div>
              }
              <button onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 w-9 h-9 bg-[#00527b] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1a6b9a] transition-colors">
                <span className="material-symbols-outlined text-white text-base">photo_camera</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />
            <p className="text-sm text-slate-400 text-center">Haz clic en la cámara para cambiar tu foto.<br/>Formatos: JPG, PNG. Máx 2MB.</p>
            <button onClick={() => fileRef.current.click()}
              className="bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:brightness-110 transition-all">
              Subir nueva foto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}