import { useState, useEffect, useCallback } from "react";
import { medicamentosApi, alertasApi, lotesApi } from "../api/inventario";
import TablaInventario from "../components/inventario/TablaInventario";
import FormMedicamento from "../components/inventario/FormMedicamento";
import DetalleLotes from "../components/inventario/DetalleLotes";
import GestorCategorias from "../components/inventario/GestorCategorias";
import ModalConfirmar from "../components/shared/ModalConfirmar";
import ModalStockCritico from "../components/inventario/ModalStockCritico";

export default function Inventario() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [alertasCount, setAlertasCount] = useState({
    total: 0, stock_minimo: 0, proximos_vencer: 0, vencidos: 0,
  });
  const [lotesProximos, setLotesProximos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalLotes, setModalLotes] = useState(false);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [modalStockCritico, setModalStockCritico] = useState(false);
  const [medicamentoActual, setMedicamentoActual] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarMedicamentos = useCallback(async () => {
    setCargando(true);
    try {
      const data = busqueda.trim()
        ? await medicamentosApi.buscar(busqueda)
        : await medicamentosApi.listar();
      setMedicamentos(data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, [busqueda]);

  const cargarAlertas = useCallback(async () => {
    try {
      await alertasApi.verificar();
      const [resumen, proximos] = await Promise.all([
        alertasApi.resumen(),
        lotesApi.proximosVencer(20), // ← 20 días
      ]);
      setAlertasCount({
        total: resumen.total ?? 0,
        stock_minimo: resumen.stock_minimo ?? 0,
        proximos_vencer: resumen.proximos_vencer ?? 0,
        vencidos: resumen.vencidos ?? 0,
      });
      setLotesProximos(proximos);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const t = setTimeout(cargarMedicamentos, 300);
    return () => clearTimeout(t);
  }, [cargarMedicamentos]);

  useEffect(() => { cargarAlertas(); }, [cargarAlertas]);

  const total     = medicamentos.length;
  const stockOk   = medicamentos.filter(m => m.stock_actual > m.stock_minimo).length;
  const stockBajo = medicamentos.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo).length;
  const sinStock  = medicamentos.filter(m => m.stock_actual === 0).length;

  // ── Stock Crítico = sin stock + stock bajo + próximos a vencer (sin duplicar)
  const stockCritico = (() => {
    const ids = new Set();
    const lista = [];
    medicamentos.forEach(m => {
      if (m.stock_actual === 0) {
        ids.add(m.id);
        lista.push({ ...m, _razon: "sin_stock" });
      } else if (m.stock_actual <= m.stock_minimo) {
        ids.add(m.id);
        lista.push({ ...m, _razon: "stock_bajo" });
      }
    });
    lotesProximos.forEach(lote => {
      if (!ids.has(lote.producto_id)) {
        ids.add(lote.producto_id);
        const med = medicamentos.find(m => m.id === lote.producto_id);
        if (med) lista.push({ ...med, _razon: "proximo_vencer", _lote: lote });
      } else {
        // ya está en la lista, solo agregar el lote
        const entry = lista.find(m => m.id === lote.producto_id);
        if (entry) entry._lote = lote;
      }
    });
    return lista;
  })();

  const medicamentosFiltrados = (() => {
    switch (filtroActivo) {
      case "ok":       return medicamentos.filter(m => m.stock_actual > m.stock_minimo);
      case "bajo":     return medicamentos.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo);
      case "sin_stock":return medicamentos.filter(m => m.stock_actual === 0);
      default:         return medicamentos;
    }
  })();

  const onGuardar = () => { setModalForm(false); cargarMedicamentos(); cargarAlertas(); };

  const handleSolicitarEliminar = (id) => {
    const med = medicamentos.find(m => m.id === id);
    setConfirmar({ id, nombre: med?.nombre_comercial || "este medicamento" });
  };

  const handleConfirmarEliminar = async () => {
    setEliminando(true);
    try {
      await medicamentosApi.eliminar(confirmar.id);
      setConfirmar(null);
      cargarMedicamentos();
      cargarAlertas();
    } catch (e) { console.error(e); }
    finally { setEliminando(false); }
  };

  const cards = [
    { key: "total",    label: "Total Productos", value: total,    icon: "inventory",    border: "border-sky-500",     iconBg: "bg-sky-50",     iconColor: "text-sky-600",     badge: null },
    { key: "ok",       label: "Stock OK",        value: stockOk,  icon: "check_circle", border: "border-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", badge: { text: "Saludable", cls: "bg-emerald-100 text-emerald-700" } },
    { key: "bajo",     label: "Stock Bajo",      value: stockBajo,icon: "warning",      border: "border-amber-500",   iconBg: "bg-amber-50",   iconColor: "text-amber-600",   badge: { text: "Atención",  cls: "bg-amber-100 text-amber-700" } },
    {
      key: "critico",
      label: "Stock Crítico",
      value: stockCritico.length,
      icon: "emergency",
      border: "border-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      badge: { text: "Crítico", cls: "bg-red-100 text-red-500" },
      esModal: true, // ← abre modal en lugar de filtrar tabla
    },
  ];

  return (
    <div className="bg-[#f6faff] min-h-screen">

      {/* ══ HEADER ══ */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-sky-900 tracking-tight">Inventario</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Gestión de medicamentos y lotes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00527b]/20 w-48 md:w-64"
              placeholder="Buscar medicamento..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setFiltroActivo(null); }}
            />
          </div>

          {alertasCount.total > 0 && (
            <button
              onClick={() => setModalStockCritico(true)}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition-all"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              {alertasCount.total} alerta{alertasCount.total > 1 ? "s" : ""}
            </button>
          )}

          <button
            onClick={() => setModalCategorias(true)}
            className="border border-[#00527b] text-[#00527b] px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 hover:bg-[#00527b]/5 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-sm">label</span>
            <span className="hidden sm:inline">Categorías</span>
          </button>
          <button
            onClick={() => { setMedicamentoActual(null); setModalForm(true); }}
            className="bg-[#00527b] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#00427b] transition-all shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="hidden sm:inline">Registrar Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">

        {/* ── Cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {cards.map(({ key, label, value, icon, border, iconBg, iconColor, badge, esModal }) => {
            const activa = filtroActivo === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (esModal) { setModalStockCritico(true); return; }
                  setFiltroActivo(activa ? null : key);
                }}
                className={`bg-white rounded-xl p-4 md:p-6 border-t-4 ${border} shadow-sm text-left w-full
                  transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95
                  ${activa ? "ring-2 ring-offset-2 ring-[#00527b] shadow-lg -translate-y-0.5" : ""}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`${iconBg} p-1.5 md:p-2 rounded-lg ${iconColor}`}>
                    <span className="material-symbols-outlined text-sm md:text-base">{icon}</span>
                  </div>
                  {activa
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00527b] text-white uppercase tracking-wider">Filtrando</span>
                    : badge && <span className={`${badge.cls} text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline`}>{badge.text}</span>
                  }
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1 leading-tight">{label}</p>
                <span className="text-2xl md:text-3xl font-black text-slate-800">{value}</span>
                {esModal && value > 0 && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    Ver detalle
                  </p>
                )}
              </button>
            );
          })}
        </section>

        {/* Banner filtro activo */}
        {filtroActivo && filtroActivo !== "critico" && (
          <div className="flex items-center gap-3 bg-[#00527b]/5 border border-[#00527b]/20 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[#00527b] text-sm">filter_alt</span>
            <p className="text-sm text-[#00527b] font-semibold flex-1">
              Mostrando: <span className="font-black">
                {filtroActivo === "ok"        && "Productos con Stock OK"}
                {filtroActivo === "bajo"      && "Productos con Stock Bajo"}
                {filtroActivo === "sin_stock" && "Productos Sin Stock"}
                {filtroActivo === "total"     && "Todos los productos"}
              </span>{" "}— {medicamentosFiltrados.length} resultado{medicamentosFiltrados.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setFiltroActivo(null)}
              className="text-xs text-[#00527b] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Quitar filtro
            </button>
          </div>
        )}

        <TablaInventario
          medicamentos={medicamentosFiltrados}
          cargando={cargando}
          busqueda={busqueda}
          filtroActivo={filtroActivo}
          onEditar={(med) => { setMedicamentoActual(med); setModalForm(true); }}
          onEliminar={handleSolicitarEliminar}
          onVerLotes={(med) => { setMedicamentoActual(med); setModalLotes(true); }}
        />
      </div>

      {/* ══ MODALES ══ */}
      {modalForm && (
        <FormMedicamento
          medicamento={medicamentoActual}
          onGuardar={onGuardar}
          onCerrar={() => setModalForm(false)}
        />
      )}
      {modalLotes && medicamentoActual && (
        <DetalleLotes
          medicamento={medicamentoActual}
          onCerrar={() => setModalLotes(false)}
          onActualizar={() => { cargarMedicamentos(); cargarAlertas(); }}
        />
      )}
      {modalCategorias && (
        <GestorCategorias onCerrar={() => setModalCategorias(false)} />
      )}
      {modalStockCritico && (
        <ModalStockCritico
          items={stockCritico}
          onCerrar={() => setModalStockCritico(false)}
        />
      )}
      {confirmar && (
        <ModalConfirmar
          titulo="¿Eliminar medicamento?"
          mensaje="Estás a punto de eliminar"
          nombreDestacado={confirmar.nombre}
          onConfirmar={handleConfirmarEliminar}
          onCancelar={() => setConfirmar(null)}
          cargando={eliminando}
        />
      )}
    </div>
  );
}