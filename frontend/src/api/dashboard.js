const BASE_URL = "http://127.0.0.1:8000";

async function request(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error en el servidor");
    }
    return response.json();
}

export const dashboardApi = {
    obtener: () => request("/dashboard/"),
};