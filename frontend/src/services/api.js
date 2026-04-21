// src/services/api.js
import axios from 'axios'

// instancia base apuntando al backend
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// interceptor — agrega el token JWT automáticamente a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Autenticación ──────────────────────────────────────────────
export const loginService = (email, password) =>
  api.post('/auth/login', { email, password })

// ── Ventas ─────────────────────────────────────────────────────
export const registrarVentaService = (datos) =>
  api.post('/ventas', datos)

export default api

export const registrarFarmaciaService = (datos) =>
  api.post('/auth/registro', datos)

export const obtenerProductosService = () => api.get('/medicamentos/')

// ── Perfil ─────────────────────────────────────────────────
export const obtenerPerfilService     = ()       => api.get('/perfil/me')
export const actualizarPerfilService  = (datos)  => api.put('/perfil/me', datos)
export const cambiarPasswordService   = (datos)  => api.put('/perfil/me/password', datos)
export const subirFotoService         = (form)   => api.post('/perfil/me/foto', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// ── Configuración (solo admin) ─────────────────────────────
export const obtenerFarmaciaService    = ()      => api.get('/perfil/farmacia')
export const actualizarFarmaciaService = (datos) => api.put('/perfil/farmacia', datos)