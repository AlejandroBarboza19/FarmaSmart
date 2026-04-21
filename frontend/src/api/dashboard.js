// src/api/dashboard.js
import api from '../services/api'

export const dashboardApi = {
  obtener: () => api.get('/dashboard/').then(r => r.data),
}