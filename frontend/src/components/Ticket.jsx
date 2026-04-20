// src/components/Ticket.jsx

export default function Ticket({ ticket, onNuevaVenta }) {
  const fecha = new Date(ticket.fecha_venta)
  const fechaFormateada = fecha.toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const horaFormateada = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    // Ticket.jsx — contenedor principal
    <div className="bg-[#f6faff] flex items-center justify-center p-8 pt-16">

      {/* Botones fuera del ticket — no se imprimen */}
      
    <div className="no-print fixed top-20 right-8 flex gap-3 z-40">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#00527b] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1a6b9a] transition-all shadow-lg"
        >
          <span className="material-symbols-outlined">print</span>
          Imprimir
        </button>
        <button
          onClick={onNuevaVenta}
          className="flex items-center gap-2 border-2 border-[#00527b] text-[#00527b] font-bold px-6 py-3 rounded-xl hover:bg-[#edf4fc] transition-all"
        >
          <span className="material-symbols-outlined">add_shopping_cart</span>
          Nueva Venta
        </button>
      </div>

      {/* Ticket imprimible */}
      <div className="ticket-print bg-white w-full max-w-sm mx-auto p-8 shadow-lg rounded-2xl">

        {/* Encabezado */}
        <div className="text-center border-b-2 border-dashed border-slate-200 pb-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#00527b] text-2xl">local_pharmacy</span>
            <h1 className="text-2xl font-extrabold text-[#00527b]">FarmaSmart</h1>
          </div>
          <p className="text-xs text-slate-400">Sistema de Gestión Farmacéutica</p>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-slate-500">Fecha: <span className="font-semibold text-slate-700">{fechaFormateada}</span></p>
            <p className="text-xs text-slate-500">Hora: <span className="font-semibold text-slate-700">{horaFormateada}</span></p>
            <p className="text-xs text-slate-500">Ticket: <span className="font-bold text-[#00527b]">#{String(ticket.numero_ticket).padStart(6, '0')}</span></p>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detalle de Productos</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-bold text-slate-400 pb-2">Producto</th>
                <th className="text-center text-xs font-bold text-slate-400 pb-2">Cant.</th>
                <th className="text-right text-xs font-bold text-slate-400 pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ticket.detalles.map((d, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <p className="font-semibold text-slate-800 text-xs">{d.nombre_comercial}</p>
                    <p className="text-[10px] text-slate-400">${parseFloat(d.precio_unitario).toFixed(2)} c/u</p>
                  </td>
                  <td className="py-2 text-center font-bold text-slate-600 text-xs">{d.cantidad}</td>
                  <td className="py-2 text-right font-bold text-slate-800 text-xs">
                    ${parseFloat(d.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="border-t-2 border-dashed border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>${parseFloat(ticket.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>IVA (19%)</span>
            <span>${parseFloat(ticket.iva).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="font-extrabold text-slate-800">TOTAL</span>
            <span className="text-2xl font-black text-[#00527b]">
              ${parseFloat(ticket.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div className="mt-4 bg-[#edf4fc] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Método de pago</span>
            <span className="font-bold text-slate-800">{ticket.metodo_pago}</span>
          </div>
          {ticket.monto_recibido && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Monto recibido</span>
              <span className="font-bold text-slate-800">
                ${parseFloat(ticket.monto_recibido).toFixed(2)}
              </span>
            </div>
          )}
          {ticket.cambio && parseFloat(ticket.cambio) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Cambio</span>
              <span className="font-bold text-[#00527b]">
                ${parseFloat(ticket.cambio).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200 text-center space-y-1">
          <p className="text-xs font-bold text-slate-400">¡Gracias por su compra!</p>
          <p className="text-[10px] text-slate-300">Este documento es su comprobante de pago</p>
          <p className="text-[10px] text-slate-300">FarmaSmart © {new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  )
}