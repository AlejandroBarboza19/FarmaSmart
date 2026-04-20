import { useState, useEffect, useCallback } from "react";
import { medicamentosApi, alertasApi } from "../api/inventario";
import TablaInventario from "../components/inventario/TablaInventario";
import FormMedicamento from "../components/inventario/FormMedicamento";
import DetalleLotes from "../components/inventario/DetalleLotes";
import GestorCategorias from "../components/inventario/GestorCategorias";

export default function Inventario() {
  const [medicamentos, setMedicamentos]       = useState([]);
  const [alertasCount, setAlertasCount]       = useState({ total: 0, stock_minimo: 0, proximos_vencer: 0 });
  const [busqueda, setBusqueda]               = useState("");
  const [cargando, setCargando]               = useState(false);
  const [sidebarAbierto, setSidebarAbierto]   = useState(false);
  const [modalForm, setModalForm]             = useState(false);
  const [modalLotes, setModalLotes]           = useState(false);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [medicamentoActual, setMedicamentoActual] = useState(null);
  const [filtroActivo, setFiltroActivo]       = useState(null);

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
    try { setAlertasCount(await alertasApi.resumen()); } catch (_) {}
  }, []);

  useEffect(() => {
    const t = setTimeout(cargarMedicamentos, 300);
    return () => clearTimeout(t);
  }, [cargarMedicamentos]);

  useEffect(() => { cargarAlertas(); }, [cargarAlertas]);

  // ── Stats ──────────────────────────────────────────────
  const total     = medicamentos.length;
  const stockOk   = medicamentos.filter(m => m.stock_actual > m.stock_minimo).length;
  const stockBajo = medicamentos.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo).length;
  const sinStock  = medicamentos.filter(m => m.stock_actual === 0).length;

  // ── Filtro activo → medicamentos que se pasan a la tabla ──
  const medicamentosFiltrados = (() => {
    switch (filtroActivo) {
      case "ok":        return medicamentos.filter(m => m.stock_actual > m.stock_minimo);
      case "bajo":      return medicamentos.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo);
      case "sin_stock": return medicamentos.filter(m => m.stock_actual === 0);
      default:          return medicamentos;
    }
  })();

  const onGuardar = () => { setModalForm(false); cargarMedicamentos(); cargarAlertas(); };

  const navItems = [
    { icon: "dashboard",      label: "Panel",      active: false },
    { icon: "inventory_2",    label: "Inventario", active: true  },
    { icon: "event_busy",     label: "Caducidad",  active: false },
    { icon: "local_shipping", label: "Pedidos",    active: false },
    { icon: "analytics",      label: "Reportes",   active: false },
  ];

  const cards = [
    { key: "total",     label: "Total Productos", value: total,     icon: "inventory",    border: "border-primary",     iconBg: "bg-primary/10", iconColor: "text-primary",     badge: null },
    { key: "ok",        label: "Stock OK",        value: stockOk,   icon: "check_circle", border: "border-emerald-500", iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", badge: { text: "Saludable", cls: "bg-emerald-100 text-emerald-700" } },
    { key: "bajo",      label: "Stock Bajo",      value: stockBajo, icon: "warning",      border: "border-amber-500",   iconBg: "bg-amber-50",    iconColor: "text-amber-600",   badge: { text: "Atención",  cls: "bg-amber-100 text-amber-700" } },
    { key: "sin_stock", label: "Sin Stock",       value: sinStock,  icon: "error",        border: "border-error",       iconBg: "bg-red-50",      iconColor: "text-error",       badge: { text: "Crítico",   cls: "bg-red-100 text-error" } },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen">

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`
        fixed left-0 top-0 h-screen z-40 bg-[#edf4fc] flex flex-col justify-between py-6
        transition-all duration-300 ease-in-out w-64
        ${sidebarAbierto ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <div>
          <div className="px-6 mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-primary">FarmaSmart</h1>
              <p className="text-xs text-on-surface-variant opacity-70">Farmacia v2.0</p>
            </div>
            <button onClick={() => setSidebarAbierto(false)} className="lg:hidden text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="flex flex-col space-y-1">
            {navItems.map(({ icon, label, active }) => (
              <a key={label} href="#" className={
                active
                  ? "text-primary font-bold bg-white rounded-l-full ml-4 py-3 pl-6 flex items-center gap-3 shadow-sm"
                  : "text-on-surface-variant hover:text-primary py-3 pl-10 flex items-center gap-3 transition-colors"
              }>
                <span className={`material-symbols-outlined${active ? " fill-icon" : ""}`}>{icon}</span>
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="px-4">
          <button className="w-full mb-3 bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm text-sm">
            <span className="material-symbols-outlined">add</span>
            Nuevo Pedido
          </button>
          <button
            onClick={() => { setModalCategorias(true); setSidebarAbierto(false); }}
            className="w-full mb-4 border border-primary text-primary py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-sm">label</span>
            Categorías
          </button>
          <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
            <a href="#" className="text-on-surface-variant py-2 pl-4 flex items-center gap-3 hover:text-primary transition-colors text-sm">
              <span className="material-symbols-outlined">settings</span> Configuración
            </a>
            <a href="#" className="text-on-surface-variant py-2 pl-4 flex items-center gap-3 hover:text-error transition-colors text-sm">
              <span className="material-symbols-outlined">logout</span> Cerrar Sesión
            </a>
          </div>
        </div>
      </aside>

      {/* ══ HEADER ══ */}
      <header className="fixed top-0 right-0 z-30 bg-[#f6faff]/90 backdrop-blur-md flex items-center gap-4 px-4 md:px-8 h-16 shadow-sm w-full lg:w-[calc(100%-16rem)]">
        <button onClick={() => setSidebarAbierto(true)} className="lg:hidden text-outline hover:text-primary transition-colors flex-shrink-0">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="lg:hidden font-extrabold text-primary text-base flex-shrink-0">FarmaSmart</span>

        <div className="relative flex-1 max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setFiltroActivo(null); }}
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button className="sm:hidden text-outline hover:text-primary transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="relative text-outline hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            {alertasCount.total > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-white"></span>
            )}
          </button>
          <div className="flex items-center gap-2 border-l border-outline-variant pl-3">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-on-surface leading-tight">Admin</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Supervisor</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">A</div>
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main className="lg:ml-64 pt-20 px-4 md:px-8 pb-24 lg:pb-12">

        {/* Búsqueda móvil */}
        <div className="sm:hidden mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              className="w-full bg-white border border-outline-variant rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setFiltroActivo(null); }}
            />
          </div>
        </div>

        {/* ── Cards de resumen — clickeables ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {cards.map(({ key, label, value, icon, border, iconBg, iconColor, badge }) => {
            const activa = filtroActivo === key;
            return (
              <button
                key={key}
                onClick={() => setFiltroActivo(activa ? null : key)}
                className={`bg-white rounded-xl p-4 md:p-6 border-t-4 ${border} shadow-sm text-left w-full
                  transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95
                  ${activa ? "ring-2 ring-offset-2 ring-primary shadow-lg -translate-y-0.5" : ""}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`${iconBg} p-1.5 md:p-2 rounded-lg ${iconColor}`}>
                    <span className="material-symbols-outlined text-sm md:text-base">{icon}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {badge && !activa && (
                      <span className={`${badge.cls} text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline`}>
                        {badge.text}
                      </span>
                    )}
                    {activa && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider">
                        Filtrando
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-on-surface-variant text-xs font-medium mb-1 leading-tight">{label}</p>
                <span className="text-2xl md:text-3xl font-black text-on-surface">{value}</span>
              </button>
            );
          })}
        </section>

        {/* Banner de filtro activo */}
        {filtroActivo && (
          <div className="mb-4 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-primary text-sm">filter_alt</span>
            <p className="text-sm text-primary font-semibold flex-1">
              Mostrando: <span className="font-black">
                {filtroActivo === "ok"        && "Productos con Stock OK"}
                {filtroActivo === "bajo"      && "Productos con Stock Bajo"}
                {filtroActivo === "sin_stock" && "Productos Sin Stock"}
                {filtroActivo === "total"     && "Todos los productos"}
              </span>
              {" "}— {medicamentosFiltrados.length} resultado{medicamentosFiltrados.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setFiltroActivo(null)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Quitar filtro
            </button>
          </div>
        )}

        {/* ── Filtros y botón ── */}
        <section className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["Categoría", "Estado", "Laboratorio"].map(f => (
              <div key={f} className="bg-surface-container p-1 rounded-lg flex-shrink-0">
                <select className="bg-transparent border-none text-xs font-medium text-on-surface-variant focus:ring-0 cursor-pointer pr-6 py-1">
                  <option>{f}: Todos</option>
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setMedicamentoActual(null); setModalForm(true); }}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-md text-sm flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Registrar Producto
          </button>
        </section>

        {/* ── Tabla ── */}
        <TablaInventario
          medicamentos={medicamentosFiltrados}
          cargando={cargando}
          busqueda={busqueda}
          filtroActivo={filtroActivo}
          onEditar={(med) => { setMedicamentoActual(med); setModalForm(true); }}
          onEliminar={async (id) => {
            if (!confirm("¿Eliminar este medicamento?")) return;
            await medicamentosApi.eliminar(id);
            cargarMedicamentos();
          }}
          onVerLotes={(med) => { setMedicamentoActual(med); setModalLotes(true); }}
        />
      </main>

      {/* ══ NAV INFERIOR MÓVIL ══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-outline-variant flex justify-around items-center h-16 px-2">
        {navItems.map(({ icon, label, active }) => (
          <button key={label} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${active ? "text-primary" : "text-outline"}`}>
            <span className={`material-symbols-outlined text-xl${active ? " fill-icon" : ""}`}>{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

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
          onActualizar={cargarMedicamentos}
        />
      )}
      {modalCategorias && (
        <GestorCategorias onCerrar={() => setModalCategorias(false)} />
      )}
    </div>
  );
}