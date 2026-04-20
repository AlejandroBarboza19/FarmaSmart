// src/pages/Ventas.jsx  — header removido, lo provee Layout
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { obtenerProductosService, registrarVentaService } from '../services/api'
import Ticket from '../components/Ticket'

export default function Ventas() {
  const [productos,      setProductos]      = useState([])
  const [carrito,        setCarrito]        = useState({})
  const [metodoPago,     setMetodoPago]     = useState('EFECTIVO')
  const [montoRecibido,  setMontoRecibido]  = useState('')
  const [error,          setError]          = useState('')
  const [cargando,       setCargando]       = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [busqueda,       setBusqueda]       = useState('')
  const [ticketFinal,    setTicketFinal]    = useState(null)

  const { usuario } = useAuth()

  useEffect(() => {
    obtenerProductosService()
      .then(res => setProductos(res.data))
      .catch(() => setError('Error al cargar productos'))
  }, [])

  // ── Carrito ────────────────────────────────────────────────
  const agregarProducto = (producto) => {
    const actual = carrito[producto.id]?.cantidad || 0
    if (actual >= producto.stock_actual) return
    setCarrito(prev => ({
      ...prev,
      [producto.id]: { producto, cantidad: actual + 1 }
    }))
  }

  const quitarProducto = (productoId) => {
    const actual = carrito[productoId]?.cantidad || 0
    if (actual <= 1) {
      setCarrito(prev => { const c = { ...prev }; delete c[productoId]; return c })
    } else {
      setCarrito(prev => ({
        ...prev,
        [productoId]: { ...prev[productoId], cantidad: actual - 1 }
      }))
    }
  }

  // ── Cálculos ───────────────────────────────────────────────
  const itemsCarrito = Object.values(carrito)
  const subtotal = itemsCarrito.reduce((acc, i) => acc + parseFloat(i.producto.precio_venta) * i.cantidad, 0)
  const iva      = subtotal * 0.19
  const total    = subtotal + iva
  const cambio   = metodoPago === 'EFECTIVO' && montoRecibido
    ? parseFloat(montoRecibido) - total : null

  const productosFiltrados = productos.filter(p =>
    p.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nombre_generico?.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── Confirmar ──────────────────────────────────────────────
  const handleConfirmar = async () => {
    setError('')
    if (itemsCarrito.length === 0)                                           { setError('Agrega al menos un producto'); return }
    if (metodoPago === 'EFECTIVO' && (!montoRecibido || parseFloat(montoRecibido) < total)) { setError('Monto insuficiente'); return }
    setCargando(true)
    try {
      const res = await registrarVentaService({
        metodo_pago:    metodoPago,
        monto_recibido: metodoPago === 'EFECTIVO' ? parseFloat(montoRecibido) : null,
        detalles: itemsCarrito.map(i => ({ producto_id: i.producto.id, cantidad: i.cantidad }))
      })
      setTicketFinal(res.data)
      setModalConfirmar(false)
      setCarrito({})
      setMontoRecibido('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar la venta')
      setModalConfirmar(false)
    } finally {
      setCargando(false)
    }
  }

  if (ticketFinal) return <Ticket ticket={ticketFinal} onNuevaVenta={() => setTicketFinal(null)} />

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#f6faff] overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="bg-slate-100 w-64 border-r border-slate-200 flex flex-col p-4 shrink-0">
        <div className="mb-8 px-2">
          <h3 className="text-sm font-bold text-[#00527b] uppercase tracking-widest">
            {usuario?.farmacia_nombre || 'FarmaSmart'}
          </h3>
          <p className="text-xs text-slate-500">Punto de Venta</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { icon: 'point_of_sale', label: 'Nueva Venta', active: true  },
            { icon: 'history',       label: 'Historial',   active: false },
            { icon: 'inventory_2',   label: 'Stock',       active: false },
            { icon: 'analytics',     label: 'Análisis',    active: false },
          ].map(item => (
            <button key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${item.active ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-500 hover:translate-x-1 hover:bg-white/50'}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Panel productos ───────────────────────────────────── */}
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Venta Nueva</h1>
            <p className="text-slate-500 font-medium">Selecciona los productos</p>
          </div>
          <div className="flex items-center gap-3 bg-[#dce3eb] px-4 py-2 rounded-xl">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar medicamento..."
              className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {productosFiltrados.map(producto => {
            const cantidad  = carrito[producto.id]?.cantidad || 0
            const sinStock  = producto.stock_actual === 0
            return (
              <div key={producto.id}
                className={`bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden
                  ${sinStock ? 'opacity-50' : ''} ${cantidad > 0 ? 'ring-2 ring-[#00527b]/30' : ''}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl">medication</span>
                </div>
                <div className="relative z-10">
                  <span className="text-xs font-bold text-[#1a6b9a] bg-[#cde5fd] px-2 py-1 rounded-full uppercase tracking-tighter">
                    {producto.forma_farmaceutica || 'Medicamento'}
                  </span>
                  <h4 className="mt-3 text-xl font-bold text-slate-800">{producto.nombre_comercial}</h4>
                  <p className="text-sm text-slate-400 font-medium">
                    {producto.concentracion} — Stock: {producto.stock_actual}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-2xl font-black text-[#00527b]">
                      ${parseFloat(producto.precio_venta).toFixed(2)}
                    </span>
                    <div className="flex items-center bg-[#e2e9f1] rounded-full p-1">
                      <button onClick={() => quitarProducto(producto.id)} disabled={sinStock}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-[#00527b] transition-colors">
                        <span className="material-symbols-outlined text-lg">remove</span>
                      </button>
                      <span className="px-4 font-bold text-slate-800 min-w-[2rem] text-center">{cantidad}</span>
                      <button onClick={() => agregarProducto(producto)}
                        disabled={sinStock || cantidad >= producto.stock_actual}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors
                          ${cantidad > 0 ? 'bg-[#00527b] text-white shadow-sm' : 'hover:bg-white text-[#00527b]'}`}>
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {productosFiltrados.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
              <p className="font-semibold">No se encontraron productos</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Panel resumen ─────────────────────────────────────── */}
      <section className="w-[420px] bg-white border-l border-[#dce3eb] shadow-2xl flex flex-col p-8 shrink-0 overflow-y-auto">
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a6b9a]">shopping_bag</span>
            Resumen de Venta
          </h2>

          <div className="overflow-y-auto space-y-4 min-h-[100px] max-h-[240px]">
            {itemsCarrito.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <span className="material-symbols-outlined text-4xl">shopping_cart</span>
                <p className="text-sm mt-2">Sin productos agregados</p>
              </div>
            ) : itemsCarrito.map(item => (
              <div key={item.producto.id} className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.producto.nombre_comercial}</p>
                  <p className="text-xs text-slate-400">
                    {item.cantidad} × ${parseFloat(item.producto.precio_venta).toFixed(2)}
                  </p>
                </div>
                <span className="font-bold text-slate-800">
                  ${(parseFloat(item.producto.precio_venta) * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {itemsCarrito.length > 0 && (
            <div className="pt-6 border-t border-dashed border-[#c0c7d0] space-y-3 mt-4">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>IVA (19%)</span><span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-slate-800">Total</span>
                <span className="text-3xl font-black text-[#00527b]">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#e2e9f1]">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Método de Pago</label>
              <div className="relative">
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                  className="w-full bg-[#dce3eb] border-none rounded-xl h-12 px-4 appearance-none font-semibold text-slate-800 outline-none">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="OTRO">Otro</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

          {metodoPago === 'EFECTIVO' && (
  <div className="space-y-4" style={{ minHeight: '120px' }}>
    <div>
      <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Monto recibido</label>
      <div className="relative">
        <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
        <input type="number" value={montoRecibido}
          onChange={e => setMontoRecibido(e.target.value)}
          className="w-full bg-white ring-2 ring-[#00527b] border-none rounded-xl h-12 pl-8 pr-4 font-bold text-slate-800 outline-none"
          placeholder="0.00" />
      </div>
    </div>
    {cambio !== null && cambio >= 0 && (
      <div className="bg-[#e8eff7] p-4 rounded-xl flex justify-between items-center">
        <span className="text-sm font-bold text-slate-500 uppercase">Cambio</span>
        <span className="text-xl font-black text-[#00527b]">${cambio.toFixed(2)}</span>
      </div>
    )}
  </div>
)}

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={() => {
                setError('')
                if (itemsCarrito.length === 0) { setError('Agrega al menos un producto'); return }
                if (metodoPago === 'EFECTIVO' && (!montoRecibido || parseFloat(montoRecibido) < total)) {
                  setError('Monto insuficiente'); return
                }
                setModalConfirmar(true)
              }}
              disabled={itemsCarrito.length === 0}
              className="w-full mt-8 bg-gradient-to-br from-[#00527b] to-[#1a6b9a] text-white py-5 rounded-3xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">verified_user</span>
              Confirmar Venta
            </button>
          </div>
        </div>
      </section>

      {/* ── Modal confirmación ────────────────────────────────── */}
      {modalConfirmar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-md" onClick={() => setModalConfirmar(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 pb-0 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#cde5fd] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#00527b] text-3xl">verified_user</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tighter">¿Confirmar Venta?</h2>
            </div>
            <div className="p-8 pt-6">
              <div className="bg-[#f6faff] p-6 rounded-2xl text-center space-y-4">
                <p className="text-slate-500 font-medium leading-relaxed">
                  ¿Confirmar la venta por{' '}
                  <span className="text-[#00527b] font-bold">${total.toFixed(2)}</span>
                  {' '}con pago en{' '}
                  <span className="text-[#00527b] font-bold">{metodoPago}</span>?
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dce3eb] rounded-full text-xs font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                    {itemsCarrito.length} producto(s)
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dce3eb] rounded-full text-xs font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    {metodoPago}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 pb-10 flex flex-col sm:flex-row gap-4">
              <button onClick={() => setModalConfirmar(false)}
                className="flex-1 h-12 rounded-xl text-[#00527b] font-bold border-2 border-[#00527b]/20 hover:bg-[#edf4fc] transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmar} disabled={cargando}
                className="flex-1 h-12 bg-gradient-to-br from-[#00527b] to-[#1a6b9a] rounded-xl text-white font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-[20px]">save</span>
                {cargando ? 'Procesando...' : 'Confirmar y Guardar'}
              </button>
            </div>
            <div className="h-1.5 w-full bg-[#1a6b9a]/20" />
          </div>
        </div>
      )}
    </div>
  )
}