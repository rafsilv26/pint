import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'softinsa.auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Recupera a sessão guardada no arranque
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setUser(parsed.user)
        setToken(parsed.token)
      }
    } catch {
      // ignora sessão corrompida
    }
    setLoading(false)
  }, [])

  async function login(credentials) {
    const { token, user } = await api.login(credentials)
    setUser(user)
    setToken(token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    return user
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Limpa a flag de primeira-troca de password (após o utilizador a alterar)
  function markPasswordChanged() {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, mustChangePassword: false }
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, user: updated }))
      } catch {
        // ignora
      }
      return updated
    })
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout,
    markPasswordChanged,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de <AuthProvider>')
  return ctx
}
