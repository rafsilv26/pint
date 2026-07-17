import axios from 'axios'
import i18next from 'i18next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const STORAGE_KEY = 'softinsa.auth'

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

api.interceptors.response.use(
  (response) => response,
  (erro) => {
    const status = erro.response?.status
    const tinhaToken = Boolean(erro.config?.headers?.Authorization)
    if (status === 401 && tinhaToken && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(erro)
  },
)

export async function http(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  if (body != null && !isForm) headers['Content-Type'] = 'application/json'

  try {
    const res = await api.request({ url: path, method, headers, data: body })

    return res.data === '' ? null : res.data
  } catch (erro) {
    if (erro.response) {
      const data = erro.response.data
      const msg = data?.message || data?.erro || data?.error || i18next.t('api.erros.generico', { status: erro.response.status })
      throw new Error(msg, { cause: erro })
    }

    throw new Error(erro.message || i18next.t('api.erros.generico', { status: '' }), { cause: erro })
  }
}
