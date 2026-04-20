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
    const [categorias, setCategorias]   = useState([]);
    const [nuevaCat, setNuevaCat]       = useState("");
    const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false);
    const [error, setError]             = useState(null);
    const [guardando, setGuardando]     = useState(false);

    useEffect(() => {
    categoriasApi.listar().then(setCategorias).catch(() => {});
    }, []);

    const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    };

    const crearCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try {
        const cat = await categoriasApi.crear({ nombre: nuevaCat.trim() });
        setCategorias(prev => [...prev, cat]);
        setForm(f => ({ ...f, categoria_id: cat.id }));
        setNuevaCat("");
        setMostrarNuevaCat(false);
    } catch (e) {
        setError(e.message);
    }
    };

    const handleSubmit = async () => {
    if (!form.nombre_comercial || !form.codigo_ean) {
        setError("Nombre comercial y código EAN son obligatorios.");
        return;
    }
    setGuardando(true);
    setError(null);
    try {
        const payload = {
        ...form,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        precio_compra: Number(form.precio_compra),
        precio_venta:  Number(form.precio_venta),
        stock_minimo:  Number(form.stock_minimo),
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

    return (
    <div style={overlay} data-modal="">
        <div style={modal}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-on-surface">
            {esEdicion ? "✏️ Editar medicamento" : "➕ Nuevo medicamento"}
            </h2>
            <button onClick={onCerrar} className="text-outline hover:text-on-surface transition-colors text-xl">✕</button>
        </div>

        {/* Error */}
        {error && (
            <div className="bg-red-50 text-error px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
            </div>
        )}

        {/* Campos */}
        <div className="grid grid-cols-2 gap-4">
            {[
            { label: "Nombre comercial *", name: "nombre_comercial",   type: "text" },
            { label: "Nombre genérico",    name: "nombre_generico",    type: "text" },
            { label: "Código EAN *",       name: "codigo_ean",         type: "text" },
            { label: "Forma farmacéutica", name: "forma_farmaceutica", type: "text" },
            { label: "Concentración",      name: "concentracion",      type: "text" },
            { label: "Laboratorio",        name: "laboratorio",        type: "text" },
            { label: "Precio compra",      name: "precio_compra",      type: "number" },
            { label: "Precio venta",       name: "precio_venta",       type: "number" },
            { label: "Stock mínimo",       name: "stock_minimo",       type: "number" },
            ].map(({ label, name, type }) => (
            <div key={name}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">{label}</label>
                <input
                name={name} type={type} value={form[name]}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            ))}

          {/* Categoría */}
            <div className="col-span-2">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Categoría</label>
            <div className="flex gap-2">
                <select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                <option value="">— Sin categoría —</option>
                {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
                </select>
                <button
                onClick={() => setMostrarNuevaCat(v => !v)}
                className="px-3 py-2 bg-surface-container rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                + Nueva
                </button>
            </div>

            {/* Crear nueva categoría inline */}
            {mostrarNuevaCat && (
                <div className="flex gap-2 mt-2">
                <input
                    value={nuevaCat}
                    onChange={e => setNuevaCat(e.target.value)}
                    placeholder="Ej: Antibióticos, Analgesia..."
                    className="flex-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => e.key === "Enter" && crearCategoria()}
                />
                <button
                    onClick={crearCategoria}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors"
                >
                    Crear
                </button>
                </div>
            )}
            </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
            <button
            onClick={onCerrar}
            className="px-5 py-2.5 bg-surface-container text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors"
            >
            Cancelar
            </button>
            <button
            onClick={handleSubmit}
            disabled={guardando}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
            >
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear medicamento"}
            </button>
        </div>
        </div>
    </div>
    );
}

const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 50, padding: "0",
};
const modal = {
    background: "#fff",
    borderRadius: "20px 20px 0 0",
    padding: "24px 20px",
    width: "100%",
    maxHeight: "95vh",
    overflowY: "auto",
};