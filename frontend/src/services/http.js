import axios from 'axios'
import i18next from 'i18next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const STORAGE_KEY = 'softinsa.auth'
const GET_CACHE_TTL = 5 * 60 * 1000
const getCache = new Map()

export function clearHttpCache() {
  getCache.clear()
}

function rawAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getToken() {
  return rawAuth().token || null
}

export function getUser() {
  return rawAuth().user || null
}

export const api = axios.create({ baseURL: API_URL })

export async function http(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const normalizedMethod = method.toUpperCase()
  const headers = {}
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  if (body != null && !isForm) headers['Content-Type'] = 'application/json'

  const cacheKey = normalizedMethod === 'GET'
    ? `${auth ? token || 'anonymous' : 'public'}:${path}`
    : null

  if (cacheKey) {
    const cached = getCache.get(cacheKey)
    if (cached && Date.now() - cached.createdAt < GET_CACHE_TTL) {
      return cached.promise
    }
    if (cached) getCache.delete(cacheKey)
  } else {
    // Uma alteração pode tornar qualquer resposta GET guardada desatualizada.
    clearHttpCache()
  }

  const request = (async () => {
    try {
      const res = await api.request({ url: path, method: normalizedMethod, headers, data: body })

      return res.data === '' ? null : res.data
    } catch (erro) {
      if (erro.response) {
        const data = erro.response.data
        const msg = data?.message || data?.erro || data?.error || i18next.t('api.erros.generico', { status: erro.response.status })
        throw new Error(msg, { cause: erro })
      }

      throw new Error(erro.message || i18next.t('api.erros.generico', { status: '' }), { cause: erro })
    }
  })()

  if (cacheKey) {
    getCache.set(cacheKey, { promise: request, createdAt: Date.now() })
    request.catch(() => {
      if (getCache.get(cacheKey)?.promise === request) getCache.delete(cacheKey)
    })
  }

  return request
}
