// src/api/inventario.js
import api from '../services/api'

export const medicamentosApi = {
  listar:     ()              => api.get('/medicamentos/').then(r => r.data),
  buscar:     (q)             => api.get(`/medicamentos/buscar?q=${encodeURIComponent(q)}`).then(r => r.data),
  obtener:    (id)            => api.get(`/medicamentos/${id}`).then(r => r.data),
  crear:      (datos)         => api.post('/medicamentos/', datos).then(r => r.data),
  actualizar: (id, datos)     => api.put(`/medicamentos/${id}`, datos).then(r => r.data),
  eliminar:   (id)            => api.delete(`/medicamentos/${id}`).then(r => r.data),
}

export const lotesApi = {
  porMedicamento:     (productoId)      => api.get(`/lotes/medicamento/${productoId}`).then(r => r.data),
  proximosVencer:     (dias = 90)       => api.get(`/lotes/proximos-vencer?dias=${dias}`).then(r => r.data),
  crear:              (datos)           => api.post('/lotes/', datos).then(r => r.data),
  actualizarCantidad: (id, cantidad)    => api.put(`/lotes/${id}?cantidad_disponible=${cantidad}`).then(r => r.data),
}

export const alertasApi = {
  resumen:           ()    => api.get('/alertas/resumen').then(r => r.data),
  listar:            ()    => api.get('/alertas/').then(r => r.data),
  marcarLeida:       (id)  => api.put(`/alertas/${id}/leer`).then(r => r.data),
  marcarTodasLeidas: ()    => api.put('/alertas/leer-todas').then(r => r.data),
  verificar:         ()    => api.post('/alertas/verificar').then(r => r.data),
}

export const categoriasApi = {
  listar:  ()              => api.get('/categorias/').then(r => r.data),
  crear:   (datos)         => api.post('/categorias/', datos).then(r => r.data),
  editar:  (id, datos)     => api.put(`/categorias/${id}`, datos).then(r => r.data),
  eliminar:(id)            => api.delete(`/categorias/${id}`).then(r => r.data),
}

export const ventasApi = {
  obtener: (id) => api.get(`/ventas/${id}`).then(r => r.data),
}