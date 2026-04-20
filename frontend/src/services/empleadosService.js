// src/services/empleadosService.js
import axios from './api'   // tu instancia con baseURL y token

export const listarEmpleadosService    = ()           => axios.get('/empleados/').then(r => r.data)
export const obtenerEmpleadoService    = (id)         => axios.get(`/empleados/${id}`).then(r => r.data)
export const crearEmpleadoService      = (datos)      => axios.post('/empleados/', datos).then(r => r.data)
export const actualizarEmpleadoService = (id, datos)  => axios.put(`/empleados/${id}`, datos).then(r => r.data)
export const cambiarPasswordService    = (id, pass)   => axios.patch(`/empleados/${id}/password`, { nueva_password: pass })
export const eliminarEmpleadoService   = (id)         => axios.delete(`/empleados/${id}`)