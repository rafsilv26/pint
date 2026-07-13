import axios from 'axios'
import i18next from 'i18next' // <-- Import da instância global para ficheiros JS puros

// Wrapper de Axios para o backend Softinsa.
// - prefixa o API_URL
// - junta o token JWT (guardado pelo AuthContext em localStorage)
// - trata JSON e erros de forma uniforme
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const STORAGE_KEY = 'softinsa.auth'

// A sessão pode estar em localStorage (com "Lembrar-me") ou sessionStorage
// (sem "Lembrar-me" — cai ao fechar o browser). Lê de qualquer um.
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

// Utilizador autenticado guardado (para obter o id nas chamadas filtradas)
export function getUser() {
  return rawAuth().user || null
}

// Instância de Axios partilhada por toda a app (também usada diretamente
// noutros pontos, como o download de relatórios, para reaproveitar o
// baseURL já configurado).
export const api = axios.create({ baseURL: API_URL })

export async function http(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  // Em pedidos com FormData (isForm), não definimos Content-Type: o browser
  // trata disso sozinho (inclui o boundary do multipart/form-data).
  if (body != null && !isForm) headers['Content-Type'] = 'application/json'

  try {
    const res = await api.request({ url: path, method, headers, data: body })
    // Tal como no wrapper anterior (fetch + safeJson), uma resposta vazia
    // (sem corpo) deve resultar em `null`, não em string vazia.
    return res.data === '' ? null : res.data
  } catch (erro) {
    if (erro.response) {
      const data = erro.response.data
      const msg = data?.message || data?.erro || data?.error || i18next.t('api.erros.generico', { status: erro.response.status })
      throw new Error(msg, { cause: erro })
    }
    // Erro de rede (sem resposta do servidor, ex: backend em baixo/CORS)
    throw new Error(erro.message || i18next.t('api.erros.generico', { status: '' }), { cause: erro })
  }
}
