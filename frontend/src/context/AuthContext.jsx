import { useEffect, useState } from 'react'
import * as api from '../services/api'
import { clearHttpCache } from '../services/http'
import AuthContext from './authContextValue'

const STORAGE_KEY = 'softinsa.auth'
const LAST_LOGIN_PREFIX = 'softinsa.lastLogin.'
const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000

let authStore = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage
function persistAuth(data) {
  authStore.setItem(STORAGE_KEY, JSON.stringify(data))
}
function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

function readStoredAuth() {
  try {
    return JSON.parse(authStore.getItem(STORAGE_KEY) || '{}')
  } catch {
    clearAuth()
    return {}
  }
}

export function AuthProvider({ children }) {
  const [initialAuth] = useState(readStoredAuth)
  const [user, setUser] = useState(initialAuth.user || null)
  const [token, setToken] = useState(initialAuth.token || null)
  const [loading, setLoading] = useState(Boolean(initialAuth.token))

  useEffect(() => {
    if (!initialAuth.token) return undefined
    let alive = true
    api.me()
      .then((response) => {
        if (!alive) return
        const fresh = response?.user || response?.data || response
        if (fresh?.id) {
          setUser((current) => ({ ...current, ...fresh }))
          persistAuth({ token: initialAuth.token, user: { ...initialAuth.user, ...fresh } })
        }
      })
      .catch(() => {
        if (!alive) return
        setUser(null)
        setToken(null)
        clearAuth()
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [initialAuth])

  async function login(credentials, lembrar = true) {
    clearHttpCache()
    const { token, user: authenticatedUser } = await api.login(credentials)
    const now = Date.now()
    const lastLogin = Number(localStorage.getItem(`${LAST_LOGIN_PREFIX}${authenticatedUser.id}`) || 0)
    const greetingKind = !lastLogin ? 'welcome' : now - lastLogin >= FIFTEEN_DAYS ? 'welcomeBack' : 'time'
    const user = { ...authenticatedUser, greetingKind }
    localStorage.setItem(`${LAST_LOGIN_PREFIX}${authenticatedUser.id}`, String(now))

    authStore = lembrar ? localStorage : sessionStorage
    clearAuth()
    setUser(user)
    setToken(token)
    persistAuth({ token, user })
    return user
  }

  function logout() {
    clearHttpCache()
    setUser(null)
    setToken(null)
    clearAuth()
  }

  function markPasswordChanged() {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, mustChangePassword: false }
      try {
        const saved = JSON.parse(authStore.getItem(STORAGE_KEY) || '{}')
        persistAuth({ ...saved, user: updated })
      } catch { /* ignora */ }
      return updated
    })
  }

  async function acceptPolicy(policyId) {
    const resultado = await api.acceptPolicy(policyId)
    setUser((prev) => {
      if (!prev) return prev
      const pendingPolicies = resultado?.pendingPolicies
        ?? (prev.pendingPolicies || []).filter((p) => p.policyId !== policyId)
      const updated = { ...prev, pendingPolicies }
      try {
        const saved = JSON.parse(authStore.getItem(STORAGE_KEY) || '{}')
        persistAuth({ ...saved, user: updated })
      } catch { /* ignora */ }
      return updated
    })
    return resultado
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout,
    markPasswordChanged,
    acceptPolicy,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
