import { useState, useEffect } from 'react'
import { obtenerFarmaciaService, actualizarFarmaciaService } from '../services/api'

export default function Configuracion() {
  const [nombre,    setNombre]    = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [iva,       setIva]       = useState(19)
  const [cargando,  setCargando]  = useState(false)
  const [mensaje,   setMensaje]   = useState(null)

  useEffect(() => {
    obtenerFarmaciaService().then(res => {
      setNombre(res.data.nombre)
      setDireccion(res.data.direccion || '')
      setTelefono(res.data.telefono  || '')
      setIva(Math.round(res.data.iva * 100))
    }).catch(() => {})
  }, [])

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  const guardar = async () => {
    setCargando(true)
    try {
      await actualizarFarmaciaService({ nombre, direccion, telefono, iva: iva / 100 })
      mostrarMensaje('ok', 'Configuración guardada')
    } catch (e) {
      mostrarMensaje('error', e.response?.data?.detail || 'Error al guardar')
    } finally { setCargando(false) }
  }

  const campos = [
    { label: 'Nombre de la farmacia', val: nombre,    set: setNombre,    type: 'text',  icon: 'local_pharmacy' },
    { label: 'Dirección',             val: direccion, set: setDireccion, type: 'text',  icon: 'location_on'    },
    { label: 'Teléfono',              val: telefono,  set: setTelefono,  type: 'tel',   icon: 'call'           },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Configuración</h1>
      <p className="text-slate-500 mb-8">Ajustes generales de la farmacia</p>

      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold
          ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <span className="material-symbols-outlined">
            {mensaje.tipo === 'ok' ? 'check_circle' : 'error'}
          </span>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm p-8 space-y-8">

        {/* Datos de la farmacia */}
        <div>
          <h2 className="text-sm font-bold text-[#00527b] uppercase tracking-widest mb-6">Datos de la farmacia</h2>
          <div className="space-y-5">
            {campos.map(c => (
              <div key={c.label}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{c.label}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400 text-lg">{c.icon}</span>
                  <input type={c.type} value={c.val} onChange={e => c.set(e.target.value)}
                    className="w-full bg-[#f6faff] border border-[#dce3eb] rounded-xl h-12 pl-11 pr-4 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#00527b]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IVA */}
        <div className="border-t border-[#e2e9f1] pt-8">
          <h2 className="text-sm font-bold text-[#00527b] uppercase tracking-widest mb-6">Impuestos</h2>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              IVA — {iva}%
            </label>
            <input type="range" min={0} max={30} value={iva} onChange={e => setIva(Number(e.target.value))}
              className="w-full accent-[#00527b]" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span><span>15%</span><span>30%</span>
            </div>
          </div>
        </div>

        <button onClick={guardar} disabled={cargando}
          className="w-full bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white py-3 rounded-2xl font-bold shadow-md hover:brightness-110 transition-all disabled:opacity-50">
          {cargando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  )
}