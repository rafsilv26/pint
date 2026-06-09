// =============================================================
//  IMPLEMENTAÇÃO MOCK DA API
//  Devolve dados estáticos (de ../data/mockData) com latência simulada.
//  Usada quando VITE_USE_REAL_API !== 'true' (ver api.js).
// =============================================================
import {
  mockUser,
  mockBadges,
  mockMyBadges,
  mockCandidaturas,
  mockNotifications,
  mockGamification,
  mockDashboard,
  mockPublicBadges,
} from '../data/mockData'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (data) => JSON.parse(JSON.stringify(data))

// ---------- Autenticação ----------
export async function login({ email, password }) {
  await delay()
  if (!email || !password) throw new Error('Indica o email e a password.')
  return { token: 'mock-token-' + Date.now(), user: { ...clone(mockUser), email } }
}

export async function register(dados) {
  await delay()
  if (!dados?.nome || !dados?.email || !dados?.password) throw new Error('Preenche nome, email e password.')
  return { message: 'Conta criada com sucesso! Já podes iniciar sessão.' }
}

export async function recuperarPassword({ email }) {
  await delay()
  if (!email) throw new Error('Indica o teu email.')
  return { message: 'Se o email existir, enviámos um link de recuperação.' }
}

// ---------- Dashboard ----------
export async function getDashboard() {
  await delay()
  return clone(mockDashboard)
}

// ---------- Catálogo ----------
export async function getBadges() {
  await delay()
  return clone(mockBadges)
}
export async function getBadge(id) {
  await delay()
  return clone(mockBadges.find((b) => b.id === Number(id)) || null)
}

// ---------- Candidaturas ----------
export async function getMinhasCandidaturas() {
  await delay()
  return clone(mockCandidaturas)
}
export async function submeterCandidatura({ badgeId }) {
  await delay(700)
  if (!badgeId) throw new Error('Seleciona um badge.')
  return { mensagem: 'Candidatura submetida com sucesso.', candidaturaId: Math.floor(Math.random() * 1000) + 200 }
}

// ---------- Badges conquistados ----------
export async function getMeusBadges() {
  await delay()
  return clone(mockMyBadges)
}

// ---------- Notificações ----------
export async function getNotificacoes() {
  await delay()
  return clone(mockNotifications)
}

// ---------- Gamificação ----------
export async function getGamification() {
  await delay()
  return clone(mockGamification)
}

// ---------- Página pública de badge ----------
export async function verificarBadge(publicToken) {
  await delay()
  return clone(mockPublicBadges[publicToken] || null)
}

// ---------- Notificações (ações) ----------
export async function markNotificationRead() {
  await delay(150)
  return { ok: true }
}
export async function markAllNotificationsRead() {
  await delay(150)
  return { ok: true }
}

// ---------- Assinatura de email ----------
export async function getEmailSignature() {
  await delay()
  return {
    nome: 'Rafael Silva',
    cargo: 'Consultor',
    email: 'rafael@softinsa.pt',
    telefone: '+351 912 345 678',
    localizacao: 'Santa Maria da Feira, Portugal',
    website: 'www.softinsa.pt',
    badges: [],
    templateHtml: '',
  }
}
export async function saveEmailSignature() {
  await delay()
  return { mensagem: 'Assinatura guardada.' }
}

// ---------- Password ----------
export async function changePassword({ currentPassword, newPassword }) {
  await delay()
  if (!currentPassword || !newPassword) throw new Error('Preenche os campos.')
  return { message: 'Password alterada com sucesso.' }
}

// ---------- Consultores (diretório) ----------
export async function getConsultants() {
  await delay()
  return [
    { id: 7, name: 'Maria Costa', area: 'Cloud & Infrastructure', serviceLine: 'Technology', points: 480, badges: 8, rank: 1, isCurrentUser: false },
    { id: 9, name: 'João Pereira', area: 'Data & AI', serviceLine: 'Technology', points: 410, badges: 7, rank: 2, isCurrentUser: false },
    { id: 1, name: 'Rafael Silva', area: 'Cloud & Infrastructure', serviceLine: 'Technology', points: 320, badges: 5, rank: 3, isCurrentUser: true },
    { id: 4, name: 'Ana Martins', area: 'Custom Development', serviceLine: 'Technology', points: 250, badges: 4, rank: 4, isCurrentUser: false },
  ]
}
export async function getConsultant(id) {
  const all = await getConsultants()
  return all.find((c) => c.id === Number(id)) || null
}

// ---------- Sessão ----------
export async function me() {
  await delay()
  return { user: clone(mockUser) }
}
