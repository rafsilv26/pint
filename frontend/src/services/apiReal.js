// =============================================================
//  IMPLEMENTAÇÃO REAL DA API (liga ao backend Express/Sequelize)
//  Cada função chama o endpoint real e ADAPTA a resposta para o
//  formato que as páginas esperam (que vem do design Figma).
// =============================================================
import { http, getUser } from './http'

const CODE_COR = {
  OPEN: 'gray', SUBMITTED: 'blue', IN_VALIDATION: 'amber', VALIDATED: 'indigo',
  IN_APPROVAL: 'amber', APPROVED: 'green', REJECTED: 'red',
}
const CODE_PROGRESSO = {
  OPEN: 5, SUBMITTED: 25, IN_VALIDATION: 60, VALIDATED: 80, IN_APPROVAL: 90, APPROVED: 100, REJECTED: 0,
}
const TINTS = ['salmon', 'sky', 'emerald', 'violet']
const tintFor = (s = '') => TINTS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]
const dataPT = (d) => (d ? new Date(d).toLocaleDateString('pt-PT') : '—')

// ---------- Autenticação ----------
export async function login({ email, password }) {
  const data = await http('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  const u = data.user || {}
  return {
    token: data.token,
    user: {
      id: u.id, nome: u.nome, email: u.email,
      role: u.role || (u.roles || [])[0] || null,
      roles: u.roles || [], area: u.area || '',
      mustChangePassword: u.mustChangePassword,
    },
  }
}

export async function register(dados) {
  return http('/auth/register', { method: 'POST', body: dados })
}

export async function recuperarPassword() {
  return { message: 'Recuperação de password ainda não disponível no servidor.' }
}

export async function changePassword({ currentPassword, newPassword }) {
  return http('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } })
}

export async function me() {
  return http('/auth/me')
}

// ---------- Dashboard ----------
export async function getDashboard() {
  const [res, cands] = await Promise.all([
    http('/dashboard'),
    getMinhasCandidaturas().catch(() => []),
  ])
  const d = res?.data || res || {}
  return {
    greeting: (d.greeting || 'Olá').replace(/,$/, ''),
    userName: (d.userName || '').split(' ')[0] || d.userName || '',
    stats: [
      { label: 'Pontos Totais', value: String(d.totalPoints ?? 0), delta: '', tint: 'violet', deltaTint: 'green' },
      { label: 'Badges Conquistados', value: String(d.badgesWon ?? 0), delta: '', tint: 'violet', deltaTint: 'green' },
      { label: 'Em Progresso', value: String(d.inProgress ?? 0), delta: '', tint: 'orange', deltaTint: 'orange' },
      { label: 'Ranking', value: `#${d.ranking ?? '—'}`, delta: '', tint: 'emerald', deltaTint: 'green' },
    ],
    badgesRecentes: (cands || []).slice(0, 3).map((c) => ({
      id: c.badge.id,
      nome: c.badge.nome,
      nivel: c.tags?.[0] ? `Nível ${c.tags[0]}` : '',
      progresso: c.progresso,
      status: c.status,
    })),
    recomendados: (d.recommendations || []).slice(0, 3).map((r, i) => ({
      id: r.id, nome: r.title, nivel: r.level || '', tint: TINTS[i % TINTS.length],
    })),
    perfil: { nome: d.userName || '', cargo: '', nivel: '', pontos: d.totalPoints ?? 0, posicao: d.ranking ?? '—' },
    eventos: [],
  }
}

// ---------- Catálogo ----------
function adaptBadge(b = {}) {
  return {
    id: b.id,
    nome: b.nome,
    nivelId: b.nivelId,
    nivel: b.nivel || (b.nivelId != null ? `Nível ${b.nivelId}` : ''),
    tipo: b.tipo || 'Certificação',
    fornecedor: b.fornecedor || '',
    tint: tintFor(b.fornecedor || b.nome || ''),
    ponto: b.ponto ?? 0,
    duracaoMeses: b.duracaoMeses,
    descricao: b.descricao || '',
    requisitos: [],
    slug: b.slug,
    publicToken: b.publicToken,
  }
}
export async function getBadges() {
  const rows = await http('/catalog/badges')
  return (rows || []).map(adaptBadge)
}
export async function getBadge(id) {
  const raw = await http(`/catalog/badges/${id}`)
  const badge = adaptBadge(raw)
  // Requisitos vêm da tabela REQUISITO, filtrados pelo nível do badge
  if (raw?.nivelId != null) {
    const reqs = await http(`/catalog/requirements?nivelId=${raw.nivelId}`).catch(() => [])
    badge.requisitos = (reqs || []).map((r) => ({
      id: r.requisitoId ?? r.id,
      titulo: r.titulo ?? r.descricao ?? '',
    }))
  }
  return badge
}

// ---------- Candidaturas ----------
export async function getMinhasCandidaturas() {
  const rows = await http('/candidaturas/minhas')
  return (rows || []).map((c) => {
    const code = c.status?.code || c.BadgeStatus?.code
    return {
      id: c.id,
      badge: { id: c.Badge?.id ?? c.badgeId, nome: c.Badge?.nome || `Badge #${c.badgeId}` },
      tags: [],
      status: { code, name: c.status?.name || code || '—', cor: CODE_COR[code] || 'gray' },
      progresso: CODE_PROGRESSO[code] ?? 0,
      submittedDate: dataPT(c.dataSubmicao),
      diasAnalise: c.dataSubmicao ? Math.max(0, Math.round((Date.now() - new Date(c.dataSubmicao)) / 86400000)) : 0,
      evidencias: c.evidencias?.length ?? 0,
      feedback: undefined,
    }
  })
}

export async function submeterCandidatura({ badgeId, descricao, ficheiros = [] }) {
  const form = new FormData()
  form.append('badgeId', badgeId)
  if (descricao) form.append('descricao', descricao)
  // Anexa os ficheiros reais + o requisito de cada um (na mesma ordem)
  ficheiros.forEach((ev) => {
    if (ev.file) {
      form.append('evidencias', ev.file)
      form.append('requisitoIds', ev.requisitoId ?? '')
    }
  })
  return http('/candidaturas', { method: 'POST', body: form, isForm: true })
}

// ---------- Badges conquistados (filtrado por utilizador + nomes) ----------
export async function getMeusBadges() {
  const id = getUser()?.id
  const [rows, badges] = await Promise.all([
    http(`/catalog/consultor-badges${id ? `?consultorId=${id}` : ''}`).catch(() => []),
    http('/catalog/badges').catch(() => []),
  ])
  const porId = new Map((badges || []).map((b) => [b.id, b]))
  return (rows || []).map((r) => {
    const b = porId.get(r.badgeId) || {}
    return {
      badgeId: r.badgeId,
      nome: b.nome || `Badge #${r.badgeId}`,
      fornecedor: b.fornecedor || '',
      pontos: r.pointsObtained ?? b.ponto ?? 0,
      obtainedDate: r.obtainedDate,
      expirationDate: r.expirationDate,
      valid: r.valid !== false,
      publicToken: b.publicToken || '',
      imagem: b.imagem || null,
    }
  })
}

// ---------- Notificações ----------
export async function getNotificacoes() {
  const res = await http('/notifications').catch(() => ({ data: [] }))
  return (res?.data || []).map((n) => ({
    id: n.noticeId ?? n.id,
    title: n.title,
    message: n.message,
    type: n.tipo || 'info',
    lida: !!n.read,
    createdAt: n.createdAt,
  }))
}
export async function markNotificationRead(id) {
  return http(`/notifications/${id}/read`, { method: 'PUT' })
}
export async function markAllNotificationsRead() {
  return http('/notifications/read-all', { method: 'PUT' })
}

// ---------- Gamificação ----------
export async function getGamification() {
  const g = await http('/gamification')
  const ranking = g.ranking || []
  return {
    me: {
      posicao: g.summary?.rank ?? '—',
      totalConsultores: ranking.length,
      pontos: g.summary?.points ?? 0,
      badges: g.summary?.badges ?? 0,
      percentil: '—', evolucao: '—',
    },
    lista: ranking.map((r) => ({ rank: r.rank, nome: r.name, area: '', pontos: r.points, badges: r.badges, delta: '' })),
    top3: ranking.slice(0, 3).map((r) => ({ rank: r.rank, nome: r.name, area: '', pontos: r.points })),
  }
}

// ---------- Página pública de badge ----------
export async function verificarBadge(publicToken) {
  return http(`/relatorios/verificar/${publicToken}`, { auth: false }).catch(() => null)
}

// ---------- Assinatura de email ----------
export async function getEmailSignature() {
  const res = await http('/email-signature')
  const p = res?.profile || {}
  return {
    nome: p.name || '', cargo: p.role || 'Consultor', email: p.email || '',
    telefone: '', localizacao: '', website: p.website || '',
    badges: res?.badges || [], templateHtml: res?.templateHtml || '',
  }
}
export async function saveEmailSignature({ badgeIds = [], templateHtml } = {}) {
  return http('/email-signature', { method: 'PUT', body: { badgeIds, templateHtml } })
}

// ---------- Consultores (diretório) ----------
export async function getConsultants(q = '') {
  const res = await http(`/consultants${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  return res?.data || []
}
export async function getConsultant(id) {
  return http(`/consultants/${id}`)
}
