import i18next from 'i18next' // <-- Import da instância global para ficheiros JS puros

// Wrapper de fetch para o backend Softinsa.
// - prefixa o API_URL
// - junta o token JWT (guardado pelo AuthContext em localStorage)
// - trata JSON e erros de forma uniforme
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const STORAGE_KEY = 'softinsa.auth'

export function getToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').token || null
  } catch {
    return null
  }
}

// Utilizador autenticado guardado (para obter o id nas chamadas filtradas)
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').user || null
  } catch {
    return null
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function http(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  console.log("Token que vai para o backend:", token);
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body != null) {
    if (isForm) {
      payload = body // FormData — o browser define o Content-Type
    } else {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload })
  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    // --- ADICIONA ESTAS LINHAS AQUI ---
    console.error("DEBUG - Resposta do Servidor (Erro):", {
      status: res.status,
      data: data
    });
    // ----------------------------------

    const msg = data?.message || data?.erro || data?.error || i18next.t('api.erros.generico', { status: res.status })
    throw new Error(msg)
  }
  return data
}
