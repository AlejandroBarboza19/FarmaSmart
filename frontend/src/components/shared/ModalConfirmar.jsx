export default function ModalConfirmar({ titulo, mensaje, nombreDestacado, onConfirmar, onCancelar, cargando = false }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             style={{ background: "rgba(21,28,34,0.5)", backdropFilter: "blur(6px)" }}>
            <div className="w-full max-w-sm bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Body */}
                <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">

                    {/* Ícono */}
                    <div className="mb-5 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    {/* Título */}
                    <h2 className="text-lg font-extrabold text-slate-800 mb-2 tracking-tight">
                        {titulo}
                    </h2>

                    {/* Mensaje */}
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                        {mensaje}{" "}
                        {nombreDestacado && (
                            <span className="font-bold text-slate-700">{nombreDestacado}</span>
                        )}
                        {". Esta acción no se puede deshacer."}
                    </p>

                    <div className="h-6" />

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={onCancelar}
                            disabled={cargando}
                            className="flex-1 h-11 px-6 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors order-2 sm:order-1 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirmar}
                            disabled={cargando}
                            className="flex-1 h-11 px-6 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 order-1 sm:order-2 shadow-lg shadow-red-200"
                        >
                            {cargando ? "Eliminando..." : "Eliminar"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 px-8 py-3 text-center">
                    <span className="text-[0.62rem] uppercase tracking-widest text-slate-400 font-bold">
                        Acción irreversible
                    </span>
                </div>
            </div>
        </div>
    );
}