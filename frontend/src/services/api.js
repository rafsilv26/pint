// =============================================================
//  CAMADA DE API (mock)
//  Cada função simula um endpoint do backend e devolve uma Promise.
//  Quando o backend estiver pronto, troca-se o corpo destas funções
//  por chamadas `fetch(...)` reais — as páginas não precisam de mudar.
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

// Liga isto a true quando quiseres usar o backend real (e define API_URL)
export const USE_REAL_API = false
export const API_URL = 'http://localhost:3000/api'

// Simula latência de rede para a UI parecer realista (loaders, etc.)
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (data) => JSON.parse(JSON.stringify(data))

// ---------- Autenticação ----------
export async function login({ email, password }) {
  await delay()
  if (!email || !password) {
    throw new Error('Indica o email e a password.')
  }
  // Mock: aceita qualquer credencial e devolve o utilizador de demo.
  return {
    token: 'mock-token-' + Date.now(),
    user: { ...clone(mockUser), email },
  }
}

export async function register(dados) {
  await delay()
  if (!dados?.nome || !dados?.email || !dados?.password) {
    throw new Error('Preenche nome, email e password.')
  }
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

export async function submeterCandidatura({ badgeId, descricao, ficheiros }) {
  await delay(700)
  if (!badgeId) throw new Error('Seleciona um badge.')
  return {
    mensagem: 'Candidatura submetida com sucesso.',
    candidaturaId: Math.floor(Math.random() * 1000) + 200,
  }
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
