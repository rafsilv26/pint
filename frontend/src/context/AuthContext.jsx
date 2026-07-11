import { useEffect, useState } from 'react'
import * as api from '../services/api'
import AuthContext from './authContextValue'

const STORAGE_KEY = 'softinsa.auth'
const LAST_LOGIN_PREFIX = 'softinsa.lastLogin.'
const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return {}
  }
}

export function AuthProvider({ children }) {
  const [initialAuth] = useState(readStoredAuth)
  const [user, setUser] = useState(initialAuth.user || null)
  const [token, setToken] = useState(initialAuth.token || null)
  const [loading, setLoading] = useState(Boolean(initialAuth.token))

  // Confirma no servidor que a sessão persistida ainda é válida.
  useEffect(() => {
    if (!initialAuth.token) return undefined
    let alive = true
    api.me()
      .then((response) => {
        if (!alive) return
        const fresh = response?.user || response?.data || response
        if (fresh?.id) {
          setUser((current) => ({ ...current, ...fresh }))
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: initialAuth.token, user: { ...initialAuth.user, ...fresh } }))
        }
      })
      .catch(() => {
        if (!alive) return
        setUser(null)
        setToken(null)
        localStorage.removeItem(STORAGE_KEY)
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [initialAuth])

  async function login(credentials) {
    const { token, user: authenticatedUser } = await api.login(credentials)
    const now = Date.now()
    const lastLogin = Number(localStorage.getItem(`${LAST_LOGIN_PREFIX}${authenticatedUser.id}`) || 0)
    const greetingKind = !lastLogin ? 'welcome' : now - lastLogin >= FIFTEEN_DAYS ? 'welcomeBack' : 'time'
    const user = { ...authenticatedUser, greetingKind }
    localStorage.setItem(`${LAST_LOGIN_PREFIX}${authenticatedUser.id}`, String(now))
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
