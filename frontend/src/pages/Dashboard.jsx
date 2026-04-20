import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const data = await dashboardApi.obtener();
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 60000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  const navItems = [
    { icon: "dashboard",      label: "Inicio",         path: "/dashboard" },
    { icon: "point_of_sale",  label: "Ventas",         path: null },
    { icon: "inventory_2",    label: "Inventario",     path: "/inventario" },
    { icon: "analytics",      label: "Reportes",       path: null },
    { icon: "settings",       label: "Configuración",  path: null },
  ];

  if (cargando) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin block mb-4">autorenew</span>
        <p className="text-on-surface-variant font-medium">Cargando dashboard...</p>
      </div>
    </div>
  );

  const { resumen, ventas_hoy, stock_critico, proximos_vencer } = datos;

  return (
    <div className="bg-surface text-on-surface min-h-screen">

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarAbierto(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`
        h-screen w-64 fixed left-0 top-0 flex flex-col bg-slate-50 border-r border-transparent z-40
        transition-transform duration-300
        ${sidebarAbierto ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
        <div className="p-6">
          <h2 className="text-xl font-extrabold text-primary font-headline">FarmaSmart</h2>
          <p className="text-xs text-slate-500 font-medium">Gestión Clínica</p>
        </div>
        <nav className="flex flex-col gap-2 p-4 h-full">
          {navItems.map(({ icon, label, path }) => {
            const active = path === "/dashboard";
            return (
              <button
                key={label}
                onClick={() => { if (path) navigate(path); setSidebarAbierto(false); }}
                className={active
                  ? "flex items-center gap-3 px-4 py-3 bg-cyan-100 text-cyan-900 rounded-xl font-bold transition-all"
                  : "flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-primary hover:translate-x-1 transition-transform duration-200"
                }
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-error hover:translate-x-1 transition-transform duration-200 w-full">
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="md:ml-64 flex flex-col min-h-screen">

        {/* ── Header ── */}
        <header className="w-full sticky top-0 z-50 bg-white shadow-sm h-16 px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Hamburguesa móvil */}
            <button onClick={() => setSidebarAbierto(true)} className="md:hidden text-outline hover:text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base md:text-xl font-extrabold text-primary font-headline tracking-tight">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex items-center bg-slate-50 rounded-full px-4 py-1.5 gap-2 border border-outline-variant/15">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm text-on-surface w-48 outline-none" placeholder="Buscar..." />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            {ultimaActualizacion && (
              <span className="text-[10px] text-on-surface-variant hidden xl:block">
                Act: {ultimaActualizacion.toLocaleTimeString()}
              </span>
            )}
            <button onClick={cargarDatos} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Refrescar">
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center border-2 border-primary/10 text-primary font-bold text-xs">
              A
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-24 md:pb-8">

          {/* ── Banner alerta stock crítico ── */}
          {resumen.stock_critico_count > 0 && (
            <div className="bg-error-container text-on-error-container px-6 py-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">warning</span>
                <span className="font-semibold">
                  ⚠ {resumen.stock_critico_count} producto{resumen.stock_critico_count > 1 ? "s" : ""} con stock crítico
                </span>
              </div>
              <button
                onClick={() => navigate("/inventario")}
                className="bg-white/50 hover:bg-white/80 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
              >
                Ver Inventario
              </button>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* Ventas hoy */}
            <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-outline-variant/5">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-primary-fixed-dim rounded-xl text-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                {ventas_hoy.modulo_pendiente
                  ? <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
                  : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% vs ayer</span>
                }
              </div>
              <div>
                <p className="text-sm font-medium text-outline">Ventas de Hoy</p>
                <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">
                  {ventas_hoy.modulo_pendiente ? "—" : `$${ventas_hoy.total.toLocaleString()}`}
                </h3>
              </div>
            </div>

            {/* Productos en stock */}
            <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-outline-variant/5">
              <div className="p-3 bg-secondary-container rounded-xl text-secondary w-fit">
                <span className="material-symbols-outlined">inventory</span>
              </div>
              <div>
                <p className="text-sm font-medium text-outline">Productos en Stock</p>
                <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">{resumen.total_productos}</h3>
              </div>
            </div>

            {/* Alertas */}
            <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-outline-variant/5">
              <div className="p-3 bg-error-container rounded-xl text-error w-fit">
                <span className="material-symbols-outlined">notification_important</span>
              </div>
              <div>
                <p className="text-sm font-medium text-outline">Alertas de Inventario</p>
                <h3 className={`text-xl md:text-2xl font-extrabold ${resumen.stock_critico_count > 0 ? "text-error" : "text-emerald-600"}`}>
                  {resumen.stock_critico_count > 0 ? `${resumen.stock_critico_count} críticos` : "Sin alertas"}
                </h3>
              </div>
            </div>

            {/* Tickets — módulo pendiente */}
            <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-outline-variant/5">
              <div className="p-3 bg-tertiary-fixed rounded-xl text-tertiary w-fit">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <p className="text-sm font-medium text-outline">Tickets Generados</p>
                <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">—</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Módulo próximamente</p>
              </div>
            </div>
          </div>

          {/* ── Grid principal ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

            {/* Gráfica ventas — 8 cols */}
            <section className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg md:text-2xl font-extrabold text-on-surface tracking-tight">Resumen de Ventas</h2>
                  <p className="text-sm text-outline">Desempeño comercial de los últimos 7 días</p>
                </div>
                <div className="flex bg-surface-container-high p-1 rounded-xl">
                  {["Hoy", "Semana", "Mes"].map((t, i) => (
                    <button key={t} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${i === 0 ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-highest"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Chart */}
              <div className="relative h-[200px] md:h-[300px] w-full mt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
                  <line stroke="#E2E9F1" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="0" y2="0" />
                  <line stroke="#E2E9F1" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="75" y2="75" />
                  <line stroke="#E2E9F1" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
                  <line stroke="#E2E9F1" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="225" y2="225" />
                  <line stroke="#E2E9F1" strokeWidth="2" x1="0" x2="800" y1="300" y2="300" />
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1A6B9A" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#1A6B9A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,200 L133,220 L266,150 L399,180 L532,80 L665,110 L800,40 V300 H0 Z" fill="url(#chartGradient)" />
                  <path d="M0,200 L133,220 L266,150 L399,180 L532,80 L665,110 L800,40" fill="none" stroke="#1A6B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                  {[[133,220],[266,150],[399,180],[532,80],[665,110]].map(([cx,cy]) => (
                    <circle key={cx} cx={cx} cy={cy} r="5" fill="#ffffff" stroke="#1A6B9A" strokeWidth="2" />
                  ))}
                  <circle cx="800" cy="40" r="6" fill="#1A6B9A" />
                </svg>
                <div className="flex justify-between mt-4 text-xs font-semibold text-outline px-2">
                  {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => (
                    <span key={d} className="hidden sm:inline">{d}</span>
                  ))}
                  {["L","M","X","J","V","S","D"].map(d => (
                    <span key={d} className="sm:hidden">{d}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2 font-medium">Gráfica se conectará al módulo de ventas</p>
            </section>

            {/* Inventario Crítico — 4 cols */}
            <section className="lg:col-span-4 bg-surface-container-low rounded-3xl p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-on-surface tracking-tight">Inventario Crítico</h2>
                <span className="p-2 bg-error-container/50 rounded-lg text-error">
                  <span className="material-symbols-outlined text-sm">low_priority</span>
                </span>
              </div>

              {stock_critico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>
                  <p className="font-semibold text-sm">Sin alertas de stock</p>
                  <p className="text-xs mt-1">Todos los productos bien abastecidos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 text-[10px] font-extrabold uppercase tracking-wider text-outline px-2">
                    <span>Producto</span>
                    <span className="text-center">Stock</span>
                    <span className="text-right">Mínimo</span>
                  </div>
                  <div className="space-y-2">
                    {stock_critico.map(p => (
                      <div key={p.id} className={`grid grid-cols-3 items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border-l-4 ${p.stock_actual === 0 ? "border-error" : "border-tertiary"}`}>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm font-bold text-on-surface truncate">{p.nombre_comercial}</span>
                          <span className="text-[10px] text-outline">{p.laboratorio}</span>
                        </div>
                        <span className={`text-center font-bold ${p.stock_actual === 0 ? "text-error" : "text-tertiary"}`}>
                          {p.stock_actual}
                        </span>
                        <span className="text-right text-xs font-medium text-outline">{p.stock_minimo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="w-full py-3 bg-surface-container-highest text-primary font-bold text-sm rounded-xl hover:bg-outline-variant/20 transition-colors mt-auto">
                Descargar Reporte Completo
              </button>
            </section>
          </div>

          {/* ── Bottom: Ventas recientes + Acciones rápidas ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

            {/* Ventas recientes */}
            <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-outline-variant/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-bold text-on-surface">Ventas Recientes</h2>
                <span className="text-primary font-bold text-sm cursor-pointer hover:underline">Ver todo</span>
              </div>

              {ventas_hoy.modulo_pendiente ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-3">point_of_sale</span>
                  <p className="font-semibold text-sm">Módulo de ventas próximamente</p>
                  <p className="text-xs mt-1 text-outline">Las transacciones aparecerán aquí cuando esté disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* aquí irán las ventas reales */}
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="bg-primary p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="relative z-10">
                <h2 className="text-xl md:text-2xl font-extrabold text-on-primary mb-2">Acciones Rápidas</h2>
                <p className="text-primary-fixed-dim text-sm mb-6 md:mb-8">Accesos directos para la gestión diaria.</p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {[
                    { icon: "add_shopping_cart", label: "Nueva Venta" },
                    { icon: "post_add",           label: "Recarga Stock", action: () => navigate("/inventario") },
                    { icon: "clinical_notes",     label: "Recetas" },
                    { icon: "support_agent",      label: "Soporte" },
                  ].map(({ icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 text-on-primary"
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-container/20 rounded-full -ml-16 -mb-16 blur-2xl" />
            </div>
          </div>

        </div>
      </main>

      {/* ══ NAV INFERIOR MÓVIL ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white shadow-2xl z-50 flex items-center justify-around px-2">
        {[
          { icon: "dashboard",     label: "Inicio",   path: "/dashboard", active: true },
          { icon: "point_of_sale", label: "Ventas",   path: null,         active: false },
          { icon: "inventory_2",   label: "Stock",    path: "/inventario",active: false },
          { icon: "settings",      label: "Ajustes",  path: null,         active: false },
        ].map(({ icon, label, path, active }) => (
          <button
            key={label}
            onClick={() => path && navigate(path)}
            className={`flex flex-col items-center gap-1 ${active ? "text-primary" : "text-slate-500"}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        {/* Botón central */}
        <div className="relative -mt-8">
          <button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center border-4 border-surface">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>
      </nav>

    </div>
  );
}