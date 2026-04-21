// src/components/inventario/ModalStockCritico.jsx
export default function ModalStockCritico({ items, onCerrar }) {
  const sinStock       = items.filter(m => m._razon === "sin_stock");
  const stockBajo      = items.filter(m => m._razon === "stock_bajo");
  const proximosVencer = items.filter(m => m._razon === "proximo_vencer");

  const secciones = [
    {
      key: "sin_stock",
      titulo: "Sin Stock",
      icono: "inventory_2",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      items: sinStock,
      renderSub: (m) => (
        <span className="text-xs text-red-500 font-semibold">0 unidades disponibles</span>
      ),
    },
    {
      key: "stock_bajo",
      titulo: "Stock Bajo",
      icono: "warning",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      dot: "bg-amber-500",
      items: stockBajo,
      renderSub: (m) => (
        <span className="text-xs text-amber-600 font-semibold">
          {m.stock_actual} uds — mínimo {m.stock_minimo}
        </span>
      ),
    },
    {
      key: "proximo_vencer",
      titulo: "Próximos a Vencer",
      icono: "schedule",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-orange-400",
      items: proximosVencer,
      renderSub: (m) => (
        <span className="text-xs text-orange-600 font-semibold">
          Lote {m._lote?.numero_lote} · vence{" "}
          {m._lote?.fecha_vencimiento
            ? new Date(m._lote.fecha_vencimiento + "T00:00:00").toLocaleDateString("es-CO", {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">emergency</span>
            <h2 className="text-base font-extrabold text-slate-800">Stock Crítico</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length} producto{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
              <p className="mt-2 text-sm font-semibold">Todo el inventario está en buen estado</p>
            </div>
          ) : (
            secciones.map(({ key, titulo, icono, color, bg, border, dot, items: grupo, renderSub }) =>
              grupo.length > 0 && (
                <div key={key}>
                  {/* Encabezado sección */}
                  <div className={`flex items-center gap-2 ${bg} ${border} border rounded-lg px-3 py-2 mb-2`}>
                    <span className={`material-symbols-outlined text-sm ${color}`}>{icono}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{titulo}</span>
                    <span className={`ml-auto text-xs font-black ${color}`}>{grupo.length}</span>
                  </div>

                  {/* Lista de medicamentos */}
                  <ul className="space-y-1.5">
                    {grupo.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {m.nombre_comercial}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{m.nombre_generico}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {renderSub(m)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onCerrar}
            className="bg-[#00527b] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#00427b] transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}