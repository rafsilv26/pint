// =============================================================
//  IMPLEMENTAÇÃO REAL DA API (liga ao backend Express/Sequelize)
//  Cada função chama o endpoint real e ADAPTA a resposta para o
//  formato que as páginas esperam (que vem do design Figma).
// =============================================================
import { http, getUser, getToken, API_URL } from './http.js'
import i18next from 'i18next' // <-- Import da instância global para ficheiros JS puros

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
  return { message: i18next.t('api.recuperacaoIndisponivel') }
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
    greeting: (d.greeting || i18next.t('api.dashboard.ola')).replace(/,$/, ''),
    userName: (d.userName || '').split(' ')[0] || d.userName || '',
    stats: [
      { label: i18next.t('api.dashboard.pontosTotais'), value: String(d.totalPoints ?? 0), delta: '', tint: 'violet', deltaTint: 'green' },
      { label: i18next.t('api.dashboard.badgesConquistados'), value: String(d.badgesWon ?? 0), delta: '', tint: 'violet', deltaTint: 'green' },
      { label: i18next.t('api.dashboard.emProgresso'), value: String(d.inProgress ?? 0), delta: '', tint: 'orange', deltaTint: 'orange' },
      { label: i18next.t('api.dashboard.ranking'), value: `#${d.ranking ?? '—'}`, delta: '', tint: 'emerald', deltaTint: 'green' },
    ],
    badgesRecentes: (cands || []).slice(0, 3).map((c) => ({
      id: c.badge.id,
      nome: c.badge.nome,
      nivel: c.tags?.[0] ? i18next.t('api.generic.nivel', { nivel: c.tags[0] }) : '',
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
    nivel: b.nivel || (b.nivelId != null ? i18next.t('api.generic.nivel', { nivel: b.nivelId }) : ''),
    tipo: b.tipo || i18next.t('api.generic.certificacao'),
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
      badge: { id: c.Badge?.id ?? c.badgeId, nome: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }) },
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
  ficheiros.forEach((ev) => {
    if (ev.file) {
      form.append('evidencias', ev.file)
      form.append('requisitoIds', ev.requisitoId ?? '')
    }
  })
  return http('/candidaturas', { method: 'POST', body: form, isForm: true })
}

// ---------- Badges conquistados ----------
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
      nome: b.nome || i18next.t('api.generic.badgeId', { id: r.badgeId }),
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
    nome: p.name || '', cargo: p.role || i18next.t('api.generic.consultor'), email: p.email || '',
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

export async function updateConsultant(id, body) {
  return http(`/consultants/${id}`, { method: 'PUT', body })
}

// ---------- Talent Manager ----------
export async function getTalentDashboard() {
  const [consultants, badges, slines, pendentes] = await Promise.all([
    http('/consultants').catch(() => ({ data: [], total: 0 })),
    http('/catalog/badges').catch(() => []),
    http('/catalog/service-lines').catch(() => []),
    http('/candidaturas/talent/pendentes').catch(() => []),
  ])
  const cons = consultants?.data || []
  return {
    stats: [
      { label: i18next.t('api.tm.stats.consultores'), value: String(consultants?.total ?? cons.length), delta: '', tint: 'sky' },
      { label: i18next.t('api.tm.stats.badges'), value: String((badges || []).length), delta: '', tint: 'violet' },
      { label: i18next.t('api.tm.stats.candidaturas'), value: String((pendentes || []).length), delta: '', tint: 'amber' },
      { label: i18next.t('api.tm.stats.serviceLines'), value: String((slines || []).length), delta: '', tint: 'emerald' },
    ],
    pontuacaoGlobal: cons.slice(0, 8).map((c, i) => ({ rank: i + 1, nome: c.name, pontos: c.points })),
    pedidosFechados: [],
    atividadeRecente: (pendentes || []).slice(0, 3).map((c) => ({
      nome: c.Consultant?.User?.nome || i18next.t('api.generic.consultor'),
      texto: i18next.t('api.tm.atividade', { nome: c.Badge?.nome || '' }),
    })),
  }
}
export async function getTalentCandidaturas(estado = 'pendentes') {
  if (estado !== 'pendentes') return []
  const rows = await http('/candidaturas/talent/pendentes').catch(() => [])
  return (rows || []).map((c) => ({
    id: c.id,
    trackingId: `#${String(c.id).padStart(5, '0')}`,
    consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
    badge: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }),
    nivel: c.Badge?.nivelId != null ? String(c.Badge.nivelId) : '—',
    data: c.dataSubmicao ? new Date(c.dataSubmicao).toLocaleDateString('pt-PT') : '—',
    status: { code: c.status?.code || 'SUBMITTED', name: c.status?.name || i18next.t('api.status.submetido'), cor: 'amber' },
  }))
}
export async function getCandidatura(id) {
  const c = await http(`/candidaturas/${id}`)
  const code = c.status?.code
  return {
    id: c.id,
    numero: `#${String(c.id).padStart(6, '0')}`,
    estado: { code, name: c.status?.name || code || '—', cor: CODE_COR[code] || 'gray' },
    consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
    submissao: dataPT(c.dataSubmicao),
    badge: {
      nome: c.Badge?.nome || 'Badge', // Nome vem da API
      nivel: c.Badge?.nivelId != null ? i18next.t('api.generic.nivel', { nivel: c.Badge.nivelId }) : '—',
      tint: tintFor(c.Badge?.fornecedor || c.Badge?.nome || ''),
    },
    evidencias: (c.evidencias || []).map((e) => ({
      id: e.id, nome: e.nomeFicheiro || i18next.t('api.generic.evidencia'), url: e.url || '#', requisito: e.descricao || '—',
    })),
    historico: (c.history || []).map((h) => ({
      estado: '—', data: dataPT(h.createdAt), motivo: h.motivo || h.reason || '',
    })),
  }
}
export async function validarTalentManager(id, { decisao, comentario } = {}) {
  return http(`/candidaturas/talent/${id}/validar`, { method: 'PUT', body: { decisao, comentario } })
}

// ---------- Service Line Leader ----------
export async function getServiceLineDashboard() {
  const [consultants, badges, pendentes] = await Promise.all([
    http('/consultants').catch(() => ({ data: [], total: 0 })),
    http('/catalog/badges').catch(() => []),
    http('/candidaturas/serviceline/pendentes').catch(() => []),
  ])
  const cons = consultants?.data || []
  return {
    stats: [
      { label: i18next.t('api.sll.stats.consultoresLowCode'), value: String(consultants?.total ?? cons.length), delta: '', tint: 'sky' },
      { label: i18next.t('api.sll.stats.badgesAtribuidos'), value: String((badges || []).length), delta: '', tint: 'violet' },
      { label: i18next.t('api.sll.stats.pedidosBadges'), value: String((pendentes || []).length), delta: '', tint: 'amber' },
      { label: i18next.t('api.sll.stats.pontosAtribuidos'), value: String(cons.reduce((s, c) => s + (c.points || 0), 0)), delta: '', tint: 'emerald' },
    ],
    pontuacaoMensal: cons.slice(0, 6).map((c, i) => ({ rank: i + 1, nome: c.name, badges: c.badges, pontos: c.points })),
    badgesAtribuidos: [],
    atividadeRecente: (pendentes || []).slice(0, 3).map((c) => ({
      nome: c.Consultant?.User?.nome || i18next.t('api.generic.consultor'),
      texto: i18next.t('api.sll.atividade', { nome: c.Badge?.nome || '' }),
    })),
  }
}
export async function getServiceLinePedidos() {
  const rows = await http('/candidaturas/serviceline/pendentes').catch(() => [])
  return (rows || []).map((c) => ({
    id: c.id,
    trackingId: `#${String(c.id).padStart(5, '0')}`,
    badge: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }),
    consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
    data: c.dataSubmicao ? new Date(c.dataSubmicao).toLocaleDateString('pt-PT') : '—',
    nivel: c.Badge?.nivelId != null ? String(c.Badge.nivelId) : '—',
    pontos: c.Badge?.ponto ?? 0,
    status: { code: c.status?.code || 'VALIDATED', name: c.status?.name || i18next.t('api.status.validada'), cor: 'indigo' },
  }))
}
export async function validarServiceLine(id, { decisao, comentario } = {}) {
  return http(`/candidaturas/serviceline/${id}/validar`, { method: 'PUT', body: { decisao, comentario } })
}

// ---------- Admin (CRUD genérico via catálogo) ----------
export async function listResource(resource) {
  return http(`/catalog/${resource}`)
}
export async function createResource(resource, body) {
  return http(`/catalog/${resource}`, { method: 'POST', body })
}
export async function updateResource(resource, id, body) {
  return http(`/catalog/${resource}/${id}`, { method: 'PUT', body })
}
export async function deleteResource(resource, id) {
  return http(`/catalog/${resource}/${id}`, { method: 'DELETE' })
}

// ---------- Admin: Utilizadores ----------
export async function getUsers() {
  const rows = await http('/users')
  return (rows || []).map((u) => ({
    id: u.id, nome: u.nome, email: u.email, roles: u.roles || [], ativo: u.ativo !== false,
  }))
}
export async function createUser(body) {
  return http('/auth/register', { method: 'POST', body })
}
export async function updateUser(id, body) {
  return http(`/users/${id}`, { method: 'PUT', body })
}
export async function deleteUser(id) {
  return http(`/users/${id}`, { method: 'DELETE' })
}

// ---------- Admin: Pedidos ----------
export async function getAdminPedidos() {
  const rows = await http('/candidaturas/talent/pendentes').catch(() => [])
  return (rows || []).map((c) => ({
    id: c.id,
    trackingId: `#${String(c.id).padStart(5, '0')}`,
    badge: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }),
    consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
    data: c.dataSubmicao ? new Date(c.dataSubmicao).toLocaleDateString('pt-PT') : '—',
    nivel: c.Badge?.nivelId != null ? String(c.Badge.nivelId) : '—',
    pontos: c.Badge?.ponto ?? 0,
    status: { code: c.status?.code || 'SUBMITTED', name: c.status?.name || i18next.t('api.status.submetido'), cor: 'amber' },
  }))
}

// ---------- Exportações ----------
export async function exportarRelatorio(formato = 'excel') {
  const token = getToken()
  const res = await fetch(`${API_URL}/relatorios/${formato}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(i18next.t('api.erros.exportacao'))
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-candidaturas.${formato === 'excel' ? 'xlsx' : 'pdf'}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true }
}