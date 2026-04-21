import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";
import { ventasApi } from "../api/inventario";

const DIAS_ES = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo",
};
const DIAS_CORTO = {
  Monday: "L", Tuesday: "M", Wednesday: "X",
  Thursday: "J", Friday: "V", Saturday: "S", Sunday: "D",
};
const METODO_LABEL = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia",
};
const METODO_COLOR = {
  efectivo:      "bg-emerald-100 text-emerald-700",
  tarjeta:       "bg-sky-100 text-sky-700",
  transferencia: "bg-violet-100 text-violet-700",
};

// ── Gráfica ─────────────────────────────────────────────────────
function GraficaVentas({ datos }) {
  if (!datos?.length) return null;
  const totales = datos.map(d => d.total);
  const maxVal  = Math.max(...totales, 1);
  const norm    = (v) => 280 - ((v / maxVal) * 260);
  const puntos  = datos.map((d, i) => ({
    x: (i / (datos.length - 1)) * 800,
    y: norm(d.total), ...d,
  }));
  const pathD = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L800,280 L0,280 Z`;

  return (
    <div className="relative h-[200px] md:h-[280px] w-full mt-4">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300" preserveAspectRatio="none">
        {[0,75,150,225,300].map(y => (
          <line key={y} stroke="#E2E9F1" strokeDasharray={y<300?"4":"0"} strokeWidth="1" x1="0" x2="800" y1={y} y2={y}/>
        ))}
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#00527b" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#00527b" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGradient)"/>
        <path d={pathD} fill="none" stroke="#00527b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        {puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#00527b" strokeWidth="2.5"/>
            {p.total > 0 && (
              <text x={p.x} y={p.y-12} textAnchor="middle" fontSize="11" fill="#00527b" fontWeight="700">
                ${p.total.toLocaleString("es-CO",{maximumFractionDigits:0})}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-3 px-1">
        {datos.map((d, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="hidden sm:inline text-xs font-semibold text-slate-400">{DIAS_ES[d.dia]||d.dia}</span>
            <span className="sm:hidden text-xs font-semibold text-slate-400">{DIAS_CORTO[d.dia]||d.dia?.[0]}</span>
            {d.cantidad > 0 && <span className="text-[9px] text-emerald-500 font-bold">{d.cantidad}v</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Modal Factura ────────────────────────────────────────────────
function ModalFactura({ ventaId, onCerrar }) {
  const [venta, setVenta]       = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    ventasApi.obtener(ventaId)
      .then(setVenta)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [ventaId]);

  const imprimir = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00527b]">receipt_long</span>
            <h2 className="text-base font-extrabold text-slate-800">
              {venta ? `Ticket #${String(venta.numero_ticket).padStart(4,"0")}` : "Cargando..."}
            </h2>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {cargando ? (
            <div className="flex justify-center items-center py-16">
              <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">autorenew</span>
            </div>
          ) : !venta ? (
            <p className="text-center text-slate-400 py-10">No se pudo cargar la venta.</p>
          ) : (
            <div className="space-y-5 print:p-0" id="factura-print">

              {/* Encabezado factura */}
              <div className="text-center border-b border-dashed border-slate-200 pb-4">
                <p className="text-lg font-extrabold text-[#00527b] tracking-tight">FarmaSmart</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(venta.fecha_venta).toLocaleString("es-CO", {
                    day:"2-digit", month:"long", year:"numeric",
                    hour:"2-digit", minute:"2-digit"
                  })}
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Ticket #{String(venta.numero_ticket).padStart(4,"0")}
                </p>
              </div>

              {/* Productos */}
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1">
                  <span className="col-span-5">Producto</span>
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-2 text-center">P/U</span>
                  <span className="col-span-3 text-right">Total</span>
                </div>
                {venta.detalles.map((d, i) => (
                  <div key={i} className="grid grid-cols-12 items-center py-2 border-b border-slate-50">
                    <div className="col-span-5">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{d.nombre_comercial}</p>
                    </div>
                    <span className="col-span-2 text-center text-xs text-slate-600">{d.cantidad}</span>
                    <span className="col-span-2 text-center text-xs text-slate-600">
                      ${Number(d.precio_unitario).toLocaleString("es-CO",{maximumFractionDigits:0})}
                    </span>
                    <span className="col-span-3 text-right text-xs font-bold text-slate-800">
                      ${Number(d.subtotal).toLocaleString("es-CO",{maximumFractionDigits:0})}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>${Number(venta.subtotal).toLocaleString("es-CO",{maximumFractionDigits:0})}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>IVA (19%)</span>
                  <span>${Number(venta.iva).toLocaleString("es-CO",{maximumFractionDigits:0})}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Total</span>
                  <span>${Number(venta.total).toLocaleString("es-CO",{maximumFractionDigits:0})}</span>
                </div>
              </div>

              {/* Pago */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Método de pago</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${METODO_COLOR[venta.metodo_pago]||"bg-slate-100 text-slate-600"}`}>
                    {METODO_LABEL[venta.metodo_pago]||venta.metodo_pago}
                  </span>
                </div>
                {venta.monto_recibido != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Recibido</span>
                    <span className="font-bold text-slate-800">
                      ${Number(venta.monto_recibido).toLocaleString("es-CO",{maximumFractionDigits:0})}
                    </span>
                  </div>
                )}
                {venta.cambio != null && Number(venta.cambio) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Cambio</span>
                    <span className="font-bold text-emerald-600">
                      ${Number(venta.cambio).toLocaleString("es-CO",{maximumFractionDigits:0})}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                ¡Gracias por su compra!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {venta && (
          <div className="px-6 py-3 border-t border-slate-100 flex gap-2 justify-end">
            <button
              onClick={imprimir}
              className="flex items-center gap-1.5 border border-[#00527b] text-[#00527b] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#00527b]/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Imprimir
            </button>
            <button
              onClick={onCerrar}
              className="bg-[#00527b] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#00427b] transition-all"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [datos, setDatos]                             = useState(null);
  const [cargando, setCargando]                       = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada]     = useState(null); // id para modal

  const cargarDatos = useCallback(async () => {
    try {
      const data = await dashboardApi.obtener();
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 60000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  if (cargando) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-sky-600 animate-spin block mb-4">autorenew</span>
        <p className="text-slate-500 font-medium">Cargando dashboard...</p>
      </div>
    </div>
  );

  const { resumen, ventas_hoy, tickets_hoy, ventas_recientes, grafica_7_dias, stock_critico, proximos_vencer } = datos;

  // ── Inventario crítico combinado: stock bajo + próximos a vencer ──
  const inventarioCritico = [
    ...(stock_critico || []).map(p => ({ ...p, _tipo: "stock" })),
    ...(proximos_vencer || []).map(l => ({ ...l, _tipo: "vencer" })),
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-24 md:pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-sky-900 tracking-tight">Panel de Administración</h1>
        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <span className="text-[11px] text-slate-400 hidden md:block">
              Actualizado: {ultimaActualizacion.toLocaleTimeString()}
            </span>
          )}
          <button onClick={cargarDatos} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Banner stock crítico */}
      {resumen.stock_critico_count > 0 && (
        <div className="bg-red-50 text-red-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <span className="font-semibold">
              {resumen.stock_critico_count} producto{resumen.stock_critico_count > 1 ? "s" : ""} con stock crítico
            </span>
          </div>
          <button
            onClick={() => navigate("/inventario")}
            className="bg-white hover:bg-red-50 border border-red-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            Ver Inventario
          </button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-700">
              <span className="material-symbols-outlined">payments</span>
            </div>
            {ventas_hoy.cantidad_transacciones > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {ventas_hoy.cantidad_transacciones} venta{ventas_hoy.cantidad_transacciones > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ventas de Hoy</p>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800">
              {ventas_hoy.cantidad_transacciones === 0
                ? <span className="text-slate-300">—</span>
                : `$${ventas_hoy.total.toLocaleString("es-CO",{maximumFractionDigits:0})}`}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-slate-100">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600 w-fit">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Productos en Stock</p>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800">{resumen.total_productos}</h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-slate-100">
          <div className="p-3 bg-red-50 rounded-xl text-red-500 w-fit">
            <span className="material-symbols-outlined">notification_important</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Alertas de Inventario</p>
            <h3 className={`text-xl md:text-2xl font-extrabold ${resumen.stock_critico_count > 0 ? "text-red-500" : "text-emerald-600"}`}>
              {resumen.stock_critico_count > 0 ? `${resumen.stock_critico_count} crítico${resumen.stock_critico_count > 1 ? "s" : ""}` : "Sin alertas"}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-slate-100">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500 w-fit">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tickets Generados</p>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800">
              {tickets_hoy > 0 ? tickets_hoy : <span className="text-slate-300">—</span>}
            </h3>
            {tickets_hoy > 0 && <p className="text-[10px] text-slate-400 font-medium mt-1">Hoy</p>}
          </div>
        </div>
      </div>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

        {/* Gráfica */}
        <section className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">Resumen de Ventas</h2>
              <p className="text-sm text-slate-400">Desempeño de los últimos 7 días</p>
            </div>
          </div>
          {grafica_7_dias?.some(d => d.total > 0)
            ? <GraficaVentas datos={grafica_7_dias}/>
            : (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-300">
                <span className="material-symbols-outlined text-5xl mb-2">bar_chart</span>
                <p className="text-sm font-semibold text-slate-400">Sin ventas en los últimos 7 días</p>
              </div>
            )
          }
        </section>

        {/* ── Inventario Crítico: stock bajo + próximos a vencer ── */}
        <section className="lg:col-span-4 bg-slate-50 rounded-3xl p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Inventario Crítico</h2>
            <span className="p-2 bg-red-50 rounded-lg text-red-500">
              <span className="material-symbols-outlined text-sm">low_priority</span>
            </span>
          </div>

          {inventarioCritico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>
              <p className="font-semibold text-sm">Sin alertas de stock</p>
              <p className="text-xs mt-1">Todos los productos bien abastecidos</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1">

              {/* Stock bajo */}
              {stock_critico?.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Stock Bajo
                  </p>
                  <div className="grid grid-cols-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    <span>Producto</span>
                    <span className="text-center">Stock</span>
                    <span className="text-right">Mínimo</span>
                  </div>
                  <div className="space-y-1.5">
                    {stock_critico.map(p => (
                      <div key={p.id} className={`grid grid-cols-3 items-center bg-white p-3 rounded-xl shadow-sm border-l-4
                        ${p.stock_actual === 0 ? "border-red-500" : "border-amber-400"}`}>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{p.nombre_comercial}</span>
                          <span className="text-[10px] text-slate-400">{p.laboratorio}</span>
                        </div>
                        <span className={`text-center font-bold text-sm ${p.stock_actual === 0 ? "text-red-500" : "text-amber-500"}`}>
                          {p.stock_actual}
                        </span>
                        <span className="text-right text-xs font-medium text-slate-400">{p.stock_minimo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Próximos a vencer */}
              {proximos_vencer?.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    Próximos a Vencer
                  </p>
                  <div className="space-y-1.5">
                    {proximos_vencer.map(l => (
                      <div key={l.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border-l-4 border-orange-400">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 truncate">{l.nombre_comercial}</span>
                          <span className="text-[10px] text-slate-400">Lote {l.numero_lote}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={`text-xs font-extrabold block
                            ${l.dias_restantes <= 7 ? "text-red-500" : l.dias_restantes <= 15 ? "text-orange-500" : "text-amber-500"}`}>
                            {l.dias_restantes}d
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(l.fecha_vencimiento + "T00:00:00").toLocaleDateString("es-CO",{day:"2-digit",month:"short"})}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate("/inventario")}
            className="w-full py-3 bg-slate-200 text-[#00527b] font-bold text-sm rounded-xl hover:bg-slate-300 transition-colors mt-auto"
          >
            Ver Inventario Completo
          </button>
        </section>
      </div>

      {/* ── Ventas recientes + Acciones rápidas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* Ventas recientes */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-800">Ventas Recientes</h2>
            <button onClick={() => navigate("/ventas")} className="text-[#00527b] font-bold text-sm hover:underline">
              Ver todo
            </button>
          </div>

          {ventas_recientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">point_of_sale</span>
              <p className="font-semibold text-sm">Sin ventas registradas aún</p>
              <p className="text-xs mt-1">Las transacciones aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 pb-1">
                <span className="col-span-2">Ticket</span>
                <span className="col-span-3">Fecha</span>
                <span className="col-span-3 text-center">Método</span>
                <span className="col-span-2 text-center">Items</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {ventas_recientes.map(v => {
                const fecha = new Date(v.fecha_venta);
                return (
                  <button
                    key={v.id}
                    onClick={() => setVentaSeleccionada(v.id)}
                    className="grid grid-cols-12 items-center w-full text-left bg-slate-50 hover:bg-sky-50 active:scale-[.99] transition-all rounded-xl px-3 py-3 group"
                  >
                    <span className="col-span-2 text-xs font-extrabold text-[#00527b]">
                      #{String(v.numero_ticket).padStart(4,"0")}
                    </span>
                    <div className="col-span-3">
                      <p className="text-xs font-semibold text-slate-700">
                        {fecha.toLocaleDateString("es-CO",{day:"2-digit",month:"short"})}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {fecha.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}
                      </p>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${METODO_COLOR[v.metodo_pago]||"bg-slate-100 text-slate-600"}`}>
                        {METODO_LABEL[v.metodo_pago]||v.metodo_pago}
                      </span>
                    </div>
                    <span className="col-span-2 text-center text-xs text-slate-500 font-semibold">
                      {v.items} ítem{v.items!==1?"s":""}
                    </span>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="text-sm font-extrabold text-slate-800">
                        ${v.total.toLocaleString("es-CO",{maximumFractionDigits:0})}
                      </span>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-[#00527b] text-sm transition-colors">
                        chevron_right
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-[#00527b] p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">Acciones Rápidas</h2>
            <p className="text-sky-200 text-sm mb-6 md:mb-8">Accesos directos para la gestión diaria.</p>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                { icon: "add_shopping_cart", label: "Nueva Venta",   action: () => navigate("/ventas") },
                { icon: "post_add",          label: "Recarga Stock", action: () => navigate("/inventario") },
                { icon: "group",             label: "Empleados",     action: () => navigate("/empleados") },
                { icon: "settings",          label: "Configuración", action: () => navigate("/configuracion") },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action}
                  className="bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 text-white">
                  <span className="material-symbols-outlined">{icon}</span>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"/>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl"/>
        </div>
      </div>

      {/* ── Modal Factura ── */}
      {ventaSeleccionada && (
        <ModalFactura
          ventaId={ventaSeleccionada}
          onCerrar={() => setVentaSeleccionada(null)}
        />
      )}
    </div>
  );
}