export default function TablaInventario({ medicamentos, cargando, busqueda, onEditar, onEliminar, onVerLotes }) {
  if (cargando) return (
    <div className="text-center py-16 text-on-surface-variant">Cargando...</div>
  );

  if (medicamentos.length === 0) return (
    <div className="bg-surface-container-lowest rounded-2xl p-16 text-center text-on-surface-variant shadow-sm">
      <span className="material-symbols-outlined text-5xl mb-4 block text-outline">inventory_2</span>
      {busqueda ? `Sin resultados para "${busqueda}"` : "No hay medicamentos registrados."}
      <p className="text-sm mt-2">Haz clic en "Registrar Producto" para agregar uno.</p>
    </div>
  );

  const getEstado = (med) => {
    if (med.stock_actual === 0)                          return { label: "Sin Stock",  icon: "error",        cls: "bg-red-100 text-error",           row: "bg-[#FFEBEE] hover:bg-[#FFCDD2]", val: "text-error" };
    if (med.stock_actual <= med.stock_minimo)            return { label: "Stock Bajo", icon: "warning",      cls: "bg-amber-100 text-amber-700",     row: "bg-[#FFF8E1] hover:bg-[#FFF3CD]", val: "text-amber-700" };
    return                                                      { label: "Stock OK",   icon: "check_circle", cls: "bg-emerald-50 text-emerald-700",  row: "hover:bg-surface-container-low/30", val: "text-on-surface" };
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low/50 text-on-surface-variant border-b border-surface-variant">
            {["Código", "Nombre", "Categoría", "Laboratorio", "Stock Actual", "Mínimo", "Estado", "Lotes", "Acciones"].map(h => (
              <th key={h} className={`px-6 py-5 text-[11px] font-bold uppercase tracking-wider${h === "Acciones" ? " text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant/30">
          {medicamentos.map((med) => {
            const estado = getEstado(med);
            return (
              <tr key={med.id} className={`${estado.row} transition-colors group`}>
                <td className="px-6 py-4 text-sm font-mono text-outline">#{String(med.id).padStart(5, "0")}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-on-surface">{med.nombre_comercial}</div>
                  {med.nombre_generico && <div className="text-[10px] text-on-surface-variant">{med.nombre_generico}</div>}
                </td>
                <td className="px-6 py-4 text-sm">{med.categoria?.nombre || "—"}</td>
                <td className="px-6 py-4 text-sm">{med.laboratorio || "—"}</td>
                <td className={`px-6 py-4 text-sm font-extrabold ${estado.val}`}>{med.stock_actual}</td>
                <td className="px-6 py-4 text-sm text-outline">{med.stock_minimo}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${estado.cls}`}>
                    <span className="material-symbols-outlined text-sm">{estado.icon}</span>
                    {estado.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-xs font-medium text-outline">
                    <span className="material-symbols-outlined text-sm">layers</span>
                    {med.lotes?.length || 0} Lote{med.lotes?.length !== 1 ? "s" : ""}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onVerLotes(med)} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Ver Lotes">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button onClick={() => onEditar(med)} className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors" title="Editar">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => onEliminar(med.id)} className="p-2 hover:bg-red-100 rounded-lg text-error transition-colors" title="Eliminar">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="px-6 py-4 bg-surface-container-low/30 flex justify-between items-center border-t border-surface-variant">
        <p className="text-xs text-on-surface-variant">Mostrando {medicamentos.length} producto{medicamentos.length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}