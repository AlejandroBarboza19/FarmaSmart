// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react'
import { loginService } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    // al cargar la app revisa si ya hay sesión guardada
    const guardado = localStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  })  

  const login = async (email, password) => {
    const response = await loginService(email, password)
    const { access_token } = response.data

    // decodificar el payload del token para obtener los datos del usuario
    const payload = JSON.parse(atob(access_token.split('.')[1]))

    const datosUsuario = {
      token:      access_token,
      rol:        payload.rol,
      farmaciaId: payload.farmacia_id,
      userId:     payload.sub
    }

    // guardar en localStorage para persistir la sesión
    localStorage.setItem('token',   access_token)
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))

    setUsuario(datosUsuario)
    return datosUsuario
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// hook para usar el contexto fácilmente en cualquier componente
export function useAuth() {
  return useContext(AuthContext)
}