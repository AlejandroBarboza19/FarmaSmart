import { useState, useEffect } from "react";
import { categoriasApi } from "../../api/inventario";

const CATEGORIAS_PREDEFINIDAS = [
  "Analgésicos y Antiinflamatorios",
  "Antibióticos",
  "Antihistamínicos",
  "Cardiovascular",
  "Dermatología",
  "Diabetes",
  "Digestivo y Gastroenterología",
  "Ginecología",
  "Neurología y Psiquiatría",
  "Oftalmología",
  "Pediatría",
  "Respiratorio",
  "Suplementos y Vitaminas",
  "Urología",
  "Insumos Médicos",
];

export default function GestorCategorias({ onCerrar }) {
  const [categorias, setCategorias]     = useState([]);
  const [editando, setEditando]         = useState(null); // { id, nombre }
  const [nueva, setNueva]               = useState("");
  const [error, setError]               = useState(null);
  const [cargando, setCargando]         = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await categoriasApi.listar();
      setCategorias(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const crearCategoria = async (nombre) => {
    if (!nombre.trim()) return;
    // Verificar si ya existe
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
      setError(`"${nombre}" ya existe.`);
      return;
    }
    setError(null);
    try {
      await categoriasApi.crear({ nombre: nombre.trim() });
      setNueva("");
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const guardarEdicion = async () => {
    if (!editando?.nombre.trim()) return;
    setError(null);
    try {
      await categoriasApi.editar(editando.id, { nombre: editando.nombre.trim() });
      setEditando(null);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta categoría? Los medicamentos asociados quedarán sin categoría.")) return;
    try {
      await categoriasApi.eliminar(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  // Categorías predefinidas que aún no están creadas
  const predefinadasDisponibles = CATEGORIAS_PREDEFINIDAS.filter(
    p => !categorias.some(c => c.nombre.toLowerCase() === p.toLowerCase())
  );

  return (
    <div style={overlay} data-modal="">
      <div style={modal}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-lg text-on-surface">🏷️ Gestionar Categorías</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {categorias.length} categoría{categorias.length !== 1 ? "s" : ""} creada{categorias.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onCerrar} className="text-outline hover:text-on-surface text-xl transition-colors">✕</button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-error px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Crear nueva categoría */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Nueva categoría</label>
          <div className="flex gap-2">
            <input
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              onKeyDown={e => e.key === "Enter" && crearCategoria(nueva)}
              placeholder="Ej: Oncología, Homeopatía..."
              className="flex-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => crearCategoria(nueva)}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* Categorías predefinidas disponibles */}
        {predefinadasDisponibles.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Categorías sugeridas — clic para agregar
            </label>
            <div className="flex flex-wrap gap-2">
              {predefinadasDisponibles.map(nombre => (
                <button
                  key={nombre}
                  onClick={() => crearCategoria(nombre)}
                  className="px-3 py-1.5 bg-surface-container text-on-surface-variant text-xs font-medium rounded-full hover:bg-primary/10 hover:text-primary border border-outline-variant/50 transition-colors"
                >
                  + {nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de categorías creadas */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">
            Categorías activas
          </label>

          {cargando ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Cargando...</p>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">
              No hay categorías. Agrega una arriba o usa las sugeridas.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {categorias.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30 group"
                >
                  <span className="material-symbols-outlined text-primary text-sm">label</span>

                  {editando?.id === cat.id ? (
                    <>
                      <input
                        value={editando.nombre}
                        onChange={e => setEditando(ev => ({ ...ev, nombre: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && guardarEdicion()}
                        className="flex-1 px-2 py-1 border border-primary rounded-lg text-sm focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={guardarEdicion}
                        className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-on-surface">{cat.nombre}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditando({ id: cat.id, nombre: cat.nombre })}
                          className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => eliminar(cat.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-error transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onCerrar}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors"
          >
            Listo
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