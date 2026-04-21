// src/components/inventario/DetalleLotes.jsx
import { useState, useEffect } from "react";
import { lotesApi } from "../../api/inventario";

export default function DetalleLotes({ medicamento, onCerrar, onActualizar }) {
  const [lotes, setLotes]             = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoLote, setNuevoLote]     = useState({
    numero_lote:       "",
    fecha_vencimiento: "",
    fecha_ingreso:     new Date().toISOString().split("T")[0],
    cantidad_recibida: 0,
    precio_compra:     0,
  });
  const [error, setError]       = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await lotesApi.porMedicamento(medicamento.id);
      setLotes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ✅ Corregido: faltaba cerrar el corchete de la función
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoLote(f => ({ ...f, [name]: value }));
  };

  const crearLote = async () => {
    if (!nuevoLote.numero_lote || !nuevoLote.fecha_vencimiento) {
      setError("Número de lote y fecha de vencimiento son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await lotesApi.crear({
        ...nuevoLote,
        producto_id:         medicamento.id,
        cantidad_recibida:   Number(nuevoLote.cantidad_recibida),
        cantidad_disponible: Number(nuevoLote.cantidad_recibida),
        precio_compra:       Number(nuevoLote.precio_compra),
      });
      setMostrarForm(false);
      cargar();
      onActualizar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const diasParaVencer = (fechaStr) => {
    const diff = new Date(fechaStr + "T00:00:00") - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={overlay} data-modal="">
      <div style={modal}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>📦 Lotes — {medicamento.nombre_comercial}</h2>
            <span style={{ fontSize: 13, color: "#64748b" }}>Stock actual: {medicamento.stock_actual} unidades</span>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabla de lotes */}
        {cargando ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>Cargando lotes...</p>
        ) : lotes.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>No hay lotes registrados.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Nº Lote", "Vence", "Días restantes", "Disponible", "Recibido"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lotes.map(lote => {
                const dias  = diasParaVencer(lote.fecha_vencimiento);
                const color = dias < 30 ? "#dc2626" : dias < 90 ? "#d97706" : "#16a34a";
                const bg    = dias < 30 ? "#fef2f2" : dias < 90 ? "#fffbeb" : "#f0fdf4";
                return (
                  <tr key={lote.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, fontFamily: "monospace" }}>{lote.numero_lote}</td>
                    <td style={{ padding: "10px 14px" }}>{lote.fecha_vencimiento}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                        {dias > 0 ? `${dias} días` : "VENCIDO"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{lote.cantidad_disponible}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{lote.cantidad_recibida}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Formulario nuevo lote */}
        {mostrarForm ? (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Registrar nuevo lote</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Número de lote *",    name: "numero_lote",       type: "text" },
                { label: "Fecha vencimiento *", name: "fecha_vencimiento", type: "date" },
                { label: "Fecha ingreso",       name: "fecha_ingreso",     type: "date" },
                { label: "Cantidad",            name: "cantidad_recibida", type: "number" },
                { label: "Precio compra",       name: "precio_compra",     type: "number" },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>{label}</label>
                  <input
                    name={name} type={type} value={nuevoLote[name]}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setMostrarForm(false)} style={{ ...btnBase, background: "#f1f5f9", color: "#334155" }}>Cancelar</button>
              <button onClick={crearLote} disabled={guardando} style={{ ...btnBase, background: "#00527b", color: "#fff" }}>
                {guardando ? "Guardando..." : "Guardar lote"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setMostrarForm(true)} style={{ ...btnBase, background: "#00527b", color: "#fff", width: "100%" }}>
            + Registrar nuevo lote
          </button>
        )}

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
const btnBase = {
  border: "none", borderRadius: 10, padding: "10px 18px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};