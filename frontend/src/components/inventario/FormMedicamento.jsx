import { useState, useEffect } from "react";
import { medicamentosApi, categoriasApi } from "../../api/inventario";

export default function FormMedicamento({ medicamento, onGuardar, onCerrar }) {
    const esEdicion = !!medicamento;

    const [form, setForm] = useState({
        nombre_comercial:   medicamento?.nombre_comercial   || "",
        nombre_generico:    medicamento?.nombre_generico    || "",
        codigo_ean:         medicamento?.codigo_ean         || "",
        forma_farmaceutica: medicamento?.forma_farmaceutica || "",
        concentracion:      medicamento?.concentracion      || "",
        laboratorio:        medicamento?.laboratorio        || "",
        precio_compra:      medicamento?.precio_compra      || 0,
        precio_venta:       medicamento?.precio_venta       || 0,
        stock_minimo:       medicamento?.stock_minimo       || 0,
        categoria_id:       medicamento?.categoria_id       || "",
    });

    // Campos del primer lote (solo al crear)
    const [lote, setLote] = useState({
        numero_lote:       "",
        fecha_vencimiento: "",
        fecha_ingreso:     new Date().toISOString().split("T")[0],
        cantidad:          0,
        precio_compra:     0,
    });

    const [categorias, setCategorias]           = useState([]);
    const [nuevaCat, setNuevaCat]               = useState("");
    const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false);
    const [error, setError]                     = useState(null);
    const [guardando, setGuardando]             = useState(false);

    useEffect(() => {
        categoriasApi.listar().then(setCategorias).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleLoteChange = (e) => {
        const { name, value } = e.target;
        setLote(l => ({ ...l, [name]: value }));
    };

    const crearCategoria = async () => {
        if (!nuevaCat.trim()) return;
        try {
            const cat = await categoriasApi.crear({ nombre: nuevaCat.trim() });
            setCategorias(prev => [...prev, cat]);
            setForm(f => ({ ...f, categoria_id: cat.id }));
            setNuevaCat("");
            setMostrarNuevaCat(false);
        } catch (e) { setError(e.message); }
    };

    // Calcula días hasta vencimiento para mostrar advertencia
    const diasHastaVencer = lote.fecha_vencimiento
        ? Math.ceil((new Date(lote.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const alertaVencimiento = diasHastaVencer !== null && diasHastaVencer <= 20 && diasHastaVencer > 0;
    const vencido           = diasHastaVencer !== null && diasHastaVencer <= 0;

    const handleSubmit = async () => {
        if (!form.nombre_comercial || !form.codigo_ean) {
            setError("Nombre comercial y código EAN son obligatorios.");
            return;
        }
        if (!esEdicion) {
            if (!lote.numero_lote)       { setError("El número de lote es obligatorio."); return; }
            if (!lote.fecha_vencimiento) { setError("La fecha de vencimiento es obligatoria."); return; }
            if (vencido)                 { setError("La fecha de vencimiento no puede ser una fecha pasada."); return; }
            if (Number(lote.cantidad) <= 0) { setError("La cantidad del lote debe ser mayor a 0."); return; }
        }

        setGuardando(true);
        setError(null);
        try {
            const payload = {
                ...form,
                categoria_id:  form.categoria_id ? Number(form.categoria_id) : null,
                precio_compra: Number(form.precio_compra),
                precio_venta:  Number(form.precio_venta),
                stock_minimo:  Number(form.stock_minimo),
                // Primer lote incluido solo al crear
                ...(!esEdicion && {
                    primer_lote: {
                        numero_lote:        lote.numero_lote,
                        fecha_vencimiento:  lote.fecha_vencimiento,
                        fecha_ingreso:      lote.fecha_ingreso,
                        cantidad_recibida:  Number(lote.cantidad),
                        cantidad_disponible: Number(lote.cantidad),
                        precio_compra:      Number(lote.precio_compra) || Number(form.precio_compra),
                    }
                }),
            };
            if (esEdicion) {
                await medicamentosApi.actualizar(medicamento.id, payload);
            } else {
                await medicamentosApi.crear(payload);
            }
            onGuardar();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    const camposProducto = [
        { label: "Nombre comercial *", name: "nombre_comercial",   type: "text",   col: 2 },
        { label: "Nombre genérico",    name: "nombre_generico",    type: "text",   col: 2 },
        { label: "Código EAN *",       name: "codigo_ean",         type: "text",   col: 1 },
        { label: "Forma farmacéutica", name: "forma_farmaceutica", type: "text",   col: 1 },
        { label: "Concentración",      name: "concentracion",      type: "text",   col: 1 },
        { label: "Laboratorio",        name: "laboratorio",        type: "text",   col: 1 },
        { label: "Precio compra ($)",  name: "precio_compra",      type: "number", col: 1 },
        { label: "Precio venta ($)",   name: "precio_venta",       type: "number", col: 1 },
        { label: "Stock mínimo",       name: "stock_minimo",       type: "number", col: 1 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
             style={{ background: "rgba(21,28,34,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
                 style={{ maxHeight: "95vh" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${esEdicion ? "bg-amber-50" : "bg-sky-50"}`}>
                            <span className={`material-symbols-outlined text-base ${esEdicion ? "text-amber-600" : "text-sky-600"}`}>
                                {esEdicion ? "edit" : "add_circle"}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-800 text-base tracking-tight">
                                {esEdicion ? "Editar medicamento" : "Nuevo medicamento"}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                {esEdicion ? `Modificando: ${medicamento.nombre_comercial}` : "Completa los datos del producto y su primer lote"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCerrar}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-slate-500 text-sm">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(95vh - 140px)" }}>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            {error}
                        </div>
                    )}

                    {/* ── Sección: Datos del producto ── */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sky-600" style={{ fontSize: "13px" }}>medication</span>
                        </div>
                        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Datos del producto</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
                        {camposProducto.map(({ label, name, type, col }) => (
                            <div key={name} className={col === 2 ? "col-span-2" : "col-span-1"}>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                                <input
                                    name={name} type={type} value={form[name]}
                                    onChange={handleChange}
                                    min={type === "number" ? 0 : undefined}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                                               bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00527b]/20
                                               focus:border-[#00527b] transition-all placeholder:text-slate-300"
                                />
                            </div>
                        ))}

                        {/* Categoría */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Categoría</label>
                            <div className="flex gap-2">
                                <select name="categoria_id" value={form.categoria_id} onChange={handleChange}
                                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                                               bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00527b]/20
                                               focus:border-[#00527b] transition-all">
                                    <option value="">— Sin categoría —</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <button onClick={() => setMostrarNuevaCat(v => !v)}
                                    className="px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-600 transition-colors whitespace-nowrap">
                                    + Nueva
                                </button>
                            </div>
                            {mostrarNuevaCat && (
                                <div className="flex gap-2 mt-2">
                                    <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)}
                                        placeholder="Ej: Antibióticos, Analgesia..."
                                        className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50
                                                   focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00527b]/20 focus:border-[#00527b] transition-all"
                                        onKeyDown={e => e.key === "Enter" && crearCategoria()} autoFocus />
                                    <button onClick={crearCategoria}
                                        className="px-4 py-2.5 bg-[#00527b] text-white rounded-xl text-sm font-bold hover:bg-[#00427b] transition-colors">
                                        Crear
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sección: Primer lote (solo al crear) ── */}
                    {!esEdicion && (
                        <>
                            <div className="border-t border-slate-100 pt-5 mb-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "13px" }}>inventory_2</span>
                                    </div>
                                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Primer lote</h3>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                        Obligatorio
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                {/* Número de lote */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Número de lote *</label>
                                    <input name="numero_lote" type="text" value={lote.numero_lote}
                                        onChange={handleLoteChange} placeholder="Ej: LOTE-2024-001"
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                                                   bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                                                   focus:border-emerald-500 transition-all placeholder:text-slate-300" />
                                </div>

                                {/* Cantidad */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Cantidad recibida *</label>
                                    <input name="cantidad" type="number" min="1" value={lote.cantidad}
                                        onChange={handleLoteChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                                                   bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                                                   focus:border-emerald-500 transition-all" />
                                </div>

                                {/* Fecha ingreso */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha de ingreso</label>
                                    <input name="fecha_ingreso" type="date" value={lote.fecha_ingreso}
                                        onChange={handleLoteChange}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                                                   bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                                                   focus:border-emerald-500 transition-all" />
                                </div>

                                {/* Fecha vencimiento */}
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                        Fecha de vencimiento *
                                    </label>
                                    <input name="fecha_vencimiento" type="date" value={lote.fecha_vencimiento}
                                        onChange={handleLoteChange}
                                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-800
                                                   bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all
                                                   ${vencido
                                                     ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                                                     : alertaVencimiento
                                                     ? "border-amber-400 focus:ring-amber-500/20 focus:border-amber-500"
                                                     : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"}`} />
                                    {/* Advertencia de vencimiento próximo */}
                                    {vencido && (
                                        <p className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1.5">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            Fecha inválida — ya venció
                                        </p>
                                    )}
                                    {alertaVencimiento && !vencido && (
                                        <p className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1.5">
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            Vence en {diasHastaVencer} días — se generará alerta
                                        </p>
                                    )}
                                    {diasHastaVencer !== null && diasHastaVencer > 20 && (
                                        <p className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1.5">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Vence en {diasHastaVencer} días
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={onCerrar}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={guardando}
                        className="px-6 py-2.5 bg-[#00527b] text-white rounded-xl text-sm font-bold hover:bg-[#00427b] transition-all disabled:opacity-50 shadow-sm flex items-center gap-2">
                        {guardando ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">
                                    {esEdicion ? "save" : "add_circle"}
                                </span>
                                {esEdicion ? "Guardar cambios" : "Crear medicamento"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
