// URL base del backend — en desarrollo apunta a FastAPI
const BASE_URL = "http://127.0.0.1:8000";

// ─── Helper: manejo de errores centralizado ───────────────
async function request(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    });

    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error en el servidor");
    }

  // 204 No Content no tiene body
    if (response.status === 204) return null;
    return response.json();
}

// ─── Medicamentos ─────────────────────────────────────────
export const medicamentosApi = {
  // Listar todos
    listar: () => request("/medicamentos/"),

  // Buscar por nombre o EAN
    buscar: (q) => request(`/medicamentos/buscar?q=${encodeURIComponent(q)}`),

  // Obtener uno con sus lotes
    obtener: (id) => request(`/medicamentos/${id}`),

  // Crear nuevo
    crear: (datos) =>
    request("/medicamentos/", {
        method: "POST",
        body: JSON.stringify(datos),
    }),

  // Actualizar
    actualizar: (id, datos) =>
    request(`/medicamentos/${id}`, {
        method: "PUT",
            body: JSON.stringify(datos),
    }),

  // Eliminar (soft delete)
    eliminar: (id) =>
    request(`/medicamentos/${id}`, { method: "DELETE" }),
};

// ─── Lotes ────────────────────────────────────────────────
export const lotesApi = {
  // Lotes de un medicamento (ordenados FEFO)
    porMedicamento: (productoId) =>
    request(`/lotes/medicamento/${productoId}`),

  // Lotes próximos a vencer
    proximosVencer: (dias = 90) =>
    request(`/lotes/proximos-vencer?dias=${dias}`),

  // Crear lote
    crear: (datos) =>
    request("/lotes/", {
        method: "POST",
        body: JSON.stringify(datos),
    }),

  // Actualizar cantidad disponible
    actualizarCantidad: (id, cantidad) =>
    request(`/lotes/${id}?cantidad_disponible=${cantidad}`, {
        method: "PUT",
    }),
};

// ─── Alertas ──────────────────────────────────────────────
export const alertasApi = {
  // Resumen para el badge del header
    resumen: () => request("/alertas/resumen"),

  // Listar alertas no leídas
    listar: () => request("/alertas/"),

  // Marcar una como leída
    marcarLeida: (id) =>
    request(`/alertas/${id}/leer`, { method: "PUT" }),

  // Marcar todas como leídas
    marcarTodasLeidas: () =>
    request("/alertas/leer-todas", { method: "PUT" }),

  // Verificar y generar alertas
    verificar: () =>
    request("/alertas/verificar", { method: "POST" }),
};

export const categoriasApi = {
  listar: () => request("/categorias/"),
  crear:  (datos) => request("/categorias/", { method: "POST", body: JSON.stringify(datos) }),
  editar: (id, datos) => request(`/categorias/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id) => request(`/categorias/${id}`, { method: "DELETE" }),
};