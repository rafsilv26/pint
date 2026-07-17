

import { http, getUser, getToken, api } from './http.js'
import i18next from 'i18next'
import {
  buildTalentConsultantReport,
  buildTalentDecisionHistory,
  buildTalentProfile,
  buildTalentReport,
  getTalentWorkspace,
  invalidateTalentWorkspace,
} from './talentWorkspace.js'
import {
  buildServiceLineConsultants,
  buildServiceLineDecisionHistory,
  buildServiceLineProfile,
  buildServiceLineReport,
  filterServiceLineApplications,
  getServiceLineWorkspace,
  invalidateServiceLineWorkspace,
} from './serviceLineWorkspace.js'

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
const statusName = (code, fallback = code || '—') => i18next.t(`api.statusCodes.${code}`, { defaultValue: fallback })
const recommendationReason = (reason = {}) => {
  if (reason.code === 'NEXT_LEVEL') {
    return i18next.t('dashboard.recomendacaoProximoNivel', {
      anterior: reason.previousLevel,
      nivel: reason.targetLevel,
    })
  }
  if (reason.code === 'START_LEVEL') {
    return i18next.t('dashboard.recomendacaoInicio', { nivel: reason.targetLevel })
  }
  return i18next.t('dashboard.recomendacaoArea')
}
const localizeTalentRow = (row) => ({
  ...row,
  status: row.status ? { ...row.status, name: statusName(row.status.code, row.status.name) } : row.status,
})

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
      pendingPolicies: u.pendingPolicies || [],
    },
  }
}

export async function getAreasPublicas() {
  return http('/auth/areas', { auth: false }).catch(() => [])
}

export async function recuperarPassword({ email }) {
  return http('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
}

export async function resetPassword({ token, novaPassword }) {
  return http('/auth/reset-password', { method: 'POST', body: { token, novaPassword }, auth: false })
}

export async function confirmarEmail({ token }) {
  return http('/auth/confirm-email', { method: 'POST', body: { token }, auth: false })
}

export async function getNotificationPrefs() {
  return http('/notifications/preferences')
}

export async function saveNotificationPrefs(prefs) {
  return http('/notifications/preferences', { method: 'PUT', body: prefs })
}

export async function changePassword({ currentPassword, newPassword, areaId }) {
  return http('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword, areaId } })
}

export async function me() {
  return http('/auth/me')
}

export async function acceptPolicy(policyId) {
  return http('/auth/accept-policy', { method: 'POST', body: { policyId } })
}

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
    areaNome: d.areaNome || '',
    learningPath: {
      titulo: d.learningPathTitle || 'Learning Path',
      progresso: Math.round((d.learningPathProgress ?? 0) * 100),
    },
    recomendados: (d.recommendations || []).slice(0, 3).map((r, i) => ({
      id: r.id,
      nome: r.title,
      nivel: r.level || '',
      motivo: recommendationReason(r.reason),
      tint: TINTS[i % TINTS.length],
    })),
    perfil: { nome: d.userName || '', cargo: '', nivel: '', pontos: d.totalPoints ?? 0, posicao: d.ranking ?? '—' },
    eventos: [],
  }
}

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
    expiracao: b.expiracao || null,
    custoEstimado: b.custoEstimado ?? null,
    descricao: b.descricao || '',
    imagem: b.imagem || null,
    ativo: b.ativo !== false,
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
    const [reqs, levels, areas, serviceLines, learningPaths] = await Promise.all([
      http(`/catalog/requirements?nivelId=${raw.nivelId}`).catch(() => []),
      http('/catalog/levels').catch(() => []),
      http('/catalog/areas').catch(() => []),
      http('/catalog/service-lines').catch(() => []),
      http('/catalog/learning-paths').catch(() => []),
    ])
    badge.requisitos = (reqs || []).map((r) => ({
      id: r.requisitoId ?? r.id,
      titulo: r.titulo ?? r.descricao ?? '',
      descricao: r.descricao || '',
      obrigatorio: r.obrigatorio !== false,
      ordem: r.ordem,
      icone: r.icone || '',
    }))
    const level = (levels || []).find((row) => Number(row.id) === Number(raw.nivelId)) || {}
    const area = (areas || []).find((row) => Number(row.id) === Number(level.areaId)) || {}
    const serviceLine = (serviceLines || []).find((row) => Number(row.id) === Number(area.serviceLineId)) || {}
    const learningPath = (learningPaths || []).find((row) => Number(row.id) === Number(serviceLine.learningPathId)) || {}
    badge.nivel = level.nome || level.ordem || badge.nivel
    badge.area = area.nome || ''
    badge.serviceLine = serviceLine.nome || ''
    badge.learningPath = learningPath.nome || ''
  }
  return badge
}

export async function getMinhasCandidaturas() {
  const rows = await http('/candidaturas/minhas')
  return (rows || []).map((c) => {
    const code = c.status?.code || c.BadgeStatus?.code
    return {
      id: c.id,
      badge: { id: c.Badge?.id ?? c.badgeId, nome: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }), publicToken: c.Badge?.publicToken || '' },
      tags: [],
      status: { code, name: statusName(code, c.status?.name || code || '—'), cor: CODE_COR[code] || 'gray' },
      progresso: CODE_PROGRESSO[code] ?? 0,
      submittedDate: dataPT(c.dataSubmicao),
      diasAnalise: c.dataSubmicao ? Math.max(0, Math.round((Date.now() - new Date(c.dataSubmicao)) / 86400000)) : 0,
      evidencias: c.evidencias?.length ?? 0,
      feedback: undefined,
    }
  })
}

export async function submeterCandidatura({ badgeId, descricao, ficheiros = [], rascunho = false }) {
  const form = new FormData()
  form.append('badgeId', badgeId)
  if (rascunho) form.append('rascunho', 'true')
  if (descricao) form.append('descricao', descricao)
  ficheiros
    .filter((ev) => ev.file && ev.requisitoId != null)
    .forEach((ev) => {
      form.append('evidencias', ev.file)
      form.append('requisitoIds', ev.requisitoId)
    })
  return http('/candidaturas', { method: 'POST', body: form, isForm: true })
}

export async function getRascunho(badgeId) {
  if (!badgeId) return null
  return http(`/candidaturas/rascunho?badgeId=${badgeId}`).catch(() => null)
}

export async function apagarEvidencia(id) {
  return http(`/candidaturas/evidencias/${id}`, { method: 'DELETE' })
}

export async function getDefinicoes() {
  return http('/notifications/config').catch(() => ({ emailEnabled: true, pushEnabled: false, daysBefore: 5 }))
}
export async function saveDefinicoes(body) {
  return http('/notifications/config', { method: 'PUT', body })
}

export async function difundirAviso(body) {
  return http('/notifications/broadcast', { method: 'POST', body })
}

export async function getEmailTemplates() {
  return http('/email-templates')
}
export async function saveEmailTemplate(code, body) {
  return http(`/email-templates/${code}`, { method: 'PUT', body })
}
export async function resetEmailTemplate(code) {
  return http(`/email-templates/${code}`, { method: 'DELETE' })
}
export async function previewEmailTemplate(code, body) {
  return http(`/email-templates/${code}/preview`, { method: 'POST', body })
}
export async function testEmailTemplate(code) {
  return http(`/email-templates/${code}/test`, { method: 'POST' })
}

export async function getSlaConfigs() {
  return http('/sla/configs')
}
export async function criarSlaConfig(body) {
  return http('/sla/configs', { method: 'POST', body })
}
export async function atualizarSlaConfig(id, body) {
  return http(`/sla/configs/${id}`, { method: 'PUT', body })
}
export async function apagarSlaConfig(id) {
  return http(`/sla/configs/${id}`, { method: 'DELETE' })
}
export async function runSlaCheck() {
  return http('/notifications/sla-check', { method: 'POST' })
}

export async function getMeusObjetivos() {
  return http('/timeline/minha').catch(() => [])
}
export async function criarObjetivo(body) {
  return http('/timeline', { method: 'POST', body })
}
export async function concluirObjetivo(id, concluido = true) {
  return http(`/timeline/${id}/concluir`, { method: 'PUT', body: { concluido } })
}
export async function apagarObjetivo(id) {
  return http(`/timeline/${id}`, { method: 'DELETE' })
}

export async function getObjetivosConsultor(consultorId) {
  return http(`/timeline/consultor/${consultorId}`).catch(() => [])
}
export async function criarObjetivoConsultor(consultorId, body) {
  return http(`/timeline/consultor/${consultorId}`, { method: 'POST', body })
}
export async function apagarObjetivoConsultor(consultorId, id) {
  return http(`/timeline/consultor/${consultorId}/${id}`, { method: 'DELETE' })
}

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

export async function getNotificacoes() {
  const res = await http('/notifications').catch(() => ({ data: [] }))
  return (res?.data || []).map((n) => ({
    id: n.noticeId ?? n.id,
    title: n.title,
    message: n.message,
    type: n.type || n.tipo || 'info',
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

export async function verificarBadge(publicToken) {
  return http(`/relatorios/verificar/${publicToken}`, { auth: false }).catch(() => null)
}

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

export async function getConsultantCandidaturas(id) {
  const rows = await http(`/candidaturas/consultor/${id}`).catch(() => [])
  return (rows || []).map((c) => {
    const code = c.status?.code
    return {
      id: c.id,
      trackingId: `#${String(c.id).padStart(5, '0')}`,
      badge: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }),
      nivel: c.Badge?.nivelId != null ? i18next.t('api.generic.nivel', { nivel: c.Badge.nivelId }) : '—',
      data: dataPT(c.dataSubmicao),
      status: { code, name: statusName(code, c.status?.name || code || '—'), cor: CODE_COR[code] || 'gray' },
    }
  })
}

export async function getTalentDashboard() {
  const [workspace, fechadas] = await Promise.all([
    getTalentWorkspace(),
    http('/candidaturas/fechadas-semana').catch(() => [0, 0, 0, 0, 0, 0, 0]),
  ])
  const cons = workspace.consultants
  const pendentes = workspace.candidaturas.filter((row) => row.status.code === 'SUBMITTED')
  const emProcesso = workspace.candidaturas.filter((row) => !['APPROVED', 'REJECTED'].includes(row.status.code))
  return {
    stats: [
      { label: i18next.t('api.tm.stats.consultores'), value: String(cons.length), delta: '', tint: 'sky' },
      { label: i18next.t('api.tm.stats.badgesAtribuidos', { defaultValue: 'Badges atribuídas' }), value: String(workspace.awards.length), delta: '', tint: 'violet' },
      { label: i18next.t('api.tm.stats.candidaturasPendentes', { defaultValue: 'Candidaturas pendentes' }), value: String(pendentes.length), delta: '', tint: 'amber' },
      { label: i18next.t('api.tm.stats.serviceLines'), value: String(workspace.serviceLines.length), delta: '', tint: 'emerald' },
    ],
    pontuacaoGlobal: [...cons].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 8).map((c, i) => ({ rank: c.rank || i + 1, id: c.id, nome: c.name, pontos: c.points })),
    pedidosFechados: Array.isArray(fechadas) && fechadas.length === 7 ? fechadas : [0, 0, 0, 0, 0, 0, 0],
    atividadeRecente: workspace.candidaturas.slice(0, 5).map((c) => ({
      nome: c.consultor || i18next.t('api.generic.consultor'),
      texto: `${c.badge} · ${statusName(c.status.code, c.status.name)}`,
    })),
    statusBreakdown: buildTalentReport(workspace).statusBreakdown,
    progressoConsultores: [...cons].sort((a, b) => b.progress - a.progress),
    progressAreas: [...new Set(cons.map((consultant) => consultant.area).filter(Boolean))].sort(),
    progressServiceLines: [...new Set(cons.map((consultant) => consultant.serviceLine).filter(Boolean))].sort(),
    expiracoes: workspace.expiring.slice(0, 6),
    emProcesso: emProcesso.length,
    conquistasEspeciais: cons.reduce((sum, c) => sum + c.specialAchievements.length, 0),
    generatedAt: workspace.generatedAt,
  }
}
export async function getTalentProfile() {
  return buildTalentProfile(await getTalentWorkspace())
}

export async function getAdminDashboard() {
  const [base, atividade] = await Promise.all([
    getTalentDashboard(),
    http('/dashboard/atividade').catch(() => [])
  ])
  return {
    ...base,
    atividadeRecente: (atividade || []).map((a) => ({
      nome: a.nome || i18next.t('api.generic.consultor'),
      texto: a.texto || '',
    })),
  }
}

export async function getTalentCandidaturas(estado = 'pendentes') {
  const workspace = await getTalentWorkspace()
  const filters = {
    pendentes: ['SUBMITTED'],
    validadas: ['VALIDATED', 'IN_APPROVAL'],
    aprovadas: ['APPROVED'],
    rejeitadas: ['REJECTED'],
    processo: ['OPEN', 'SUBMITTED', 'IN_VALIDATION', 'VALIDATED', 'IN_APPROVAL'],
  }
  const codes = filters[estado]
  const rows = codes ? workspace.candidaturas.filter((row) => codes.includes(row.status.code)) : workspace.candidaturas
  return rows.map(localizeTalentRow)
}
export async function getTalentDecisionHistory() {
  const currentUser = getUser()
  return buildTalentDecisionHistory((await getTalentWorkspace()).candidaturas, currentUser?.id).map((row) => ({
    ...row,
    status: {
      code: row.code,
      name: statusName(row.code),
      cor: CODE_COR[row.code] || 'gray',
    },
  }))
}
export async function getCandidatura(id) {
  const currentUser = getUser()
  const isServiceLineLeader = (currentUser?.roles || [currentUser?.role]).includes('ServiceLineLeader')
  const [c, workspace] = await Promise.all([
    http(`/candidaturas/${id}`),
    (isServiceLineLeader ? getServiceLineWorkspace() : getTalentWorkspace()).catch(() => null),
  ])
  const enriched = (workspace?.candidaturas || workspace?.applications || []).find((row) => Number(row.id) === Number(id))
  const code = c.status?.code || enriched?.status?.code
  return {
    id: c.id,
    numero: `#${String(c.id).padStart(5, '0')}`,
    estado: { code, name: statusName(code, c.status?.name || code || '—'), cor: CODE_COR[code] || 'gray' },
    consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
    submissao: dataPT(c.dataSubmicao),
    badge: {
      id: c.Badge?.id ?? c.badgeId,
      nome: c.Badge?.nome || enriched?.badge || 'Badge',
      nivel: enriched?.nivel || (c.Badge?.nivelId != null ? i18next.t('api.generic.nivel', { nivel: c.Badge.nivelId }) : '—'),
      descricao: c.Badge?.descricao || '',
      pontos: c.Badge?.ponto ?? enriched?.pontos ?? 0,
      requisitos: enriched?.requirements || enriched?.requisitos || [],
      tint: tintFor(c.Badge?.fornecedor || c.Badge?.nome || ''),
    },
    evidencias: (c.evidencias || []).map((e) => ({
      id: e.id, nome: e.nomeFicheiro || i18next.t('api.generic.evidencia'), url: e.url || '#',
      requisitoId: e.requisitoId,
      requisito: e.Requirement?.titulo || e.Requirement?.descricao || e.descricao || '—',
      validado: e.validado === true ? true : e.validado === false ? false : null,
    })),
    timeline: (c.timeline || []).map((h) => ({
      code: h.estadoNovoCode,
      estado: statusName(h.estadoNovoCode, h.estadoNovo),
      estadoAnterior: h.estadoAnteriorCode ? statusName(h.estadoAnteriorCode, h.estadoAnterior) : '',
      autor: h.responsavel || '',
      data: h.data ? new Date(h.data).toLocaleString('pt-PT') : '—',
      motivo: h.motivo || '',
    })),

    get historico() {
      if (this.timeline && this.timeline.length) {
        return this.timeline.slice().reverse()
      }
      return (c.history || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((h) => ({
        estado: statusName(h.newStatus?.code, h.newStatus?.name || i18next.t('api.generic.atualizacaoEstado', { defaultValue: 'Atualização de estado' })),
        estadoAnterior: statusName(h.oldStatus?.code, h.oldStatus?.name || ''),
        code: h.newStatus?.code,
        autor: h.responsavel?.nome || '',
        data: dataPT(h.createdAt),
        motivo: h.motivo || h.reason || '',
      }))
    },
  }
}
export async function validarTalentManager(id, { decisao, comentario } = {}) {
  const result = await http(`/candidaturas/talent/${id}/validar`, { method: 'PUT', body: { decisao, comentario } })
  invalidateTalentWorkspace()
  return result
}

export async function validarEvidencia(id, validado) {
  const result = await http(`/candidaturas/evidencias/${id}/validar`, { method: 'PUT', body: { validado } })
  invalidateTalentWorkspace()
  return result
}

export async function getTalentReports(filters = {}) {
  const report = buildTalentReport(await getTalentWorkspace(), filters)
  return {
    ...report,
    candidaturas: report.candidaturas.map(localizeTalentRow),
    approvals: report.approvals.map(localizeTalentRow),
    rejections: report.rejections.map(localizeTalentRow),
    statusBreakdown: report.statusBreakdown.map((item) => ({ ...item, label: statusName(item.code, item.label) })),
  }
}

export async function getTalentConsultants() {
  return (await getTalentWorkspace()).consultants
}

export async function getTalentConsultant(id) {
  return (await getTalentWorkspace()).consultants.find((consultant) => Number(consultant.id) === Number(id)) || null
}

export async function getTalentConsultantReport(id) {
  return buildTalentConsultantReport(await getTalentWorkspace(), id)
}

export async function getTalentCatalog() {
  return (await getTalentWorkspace()).catalog
}

export async function getServiceLineDashboard() {
  const workspace = await getServiceLineWorkspace()
  const cons = workspace.consultants
  const pendentes = workspace.applications.filter((row) => row.status.code === 'VALIDATED')
  const totalBadgesAtribuidos = workspace.awards.length
  return {
    stats: [
      { label: i18next.t('api.sll.stats.consultores'), value: String(cons.length), delta: '', tint: 'sky' },
      { label: i18next.t('api.sll.stats.badgesAtribuidos'), value: String(totalBadgesAtribuidos), delta: '', tint: 'violet' },
      { label: i18next.t('api.sll.stats.pedidosBadges'), value: String((pendentes || []).length), delta: '', tint: 'amber' },
      { label: i18next.t('api.sll.stats.pontosAtribuidos'), value: String(cons.reduce((s, c) => s + (c.points || 0), 0)), delta: '', tint: 'emerald' },
    ],
    ranking: cons.slice(0, 8).map((c, i) => ({ rank: i + 1, nome: c.name, badges: c.badges, pontos: c.points, progress: c.progress, area: c.area })),
    consultantProgress: cons.slice().sort((a, b) => b.progress - a.progress || b.points - a.points),
    badgesAtribuidos: workspace.badgesWeek,
    atividadeRecente: workspace.applications.slice(0, 5).map((c) => ({
      nome: c.consultor || i18next.t('api.generic.consultor'),
      texto: `${c.badge} · ${statusName(c.status.code, c.status.name)}`,
    })),
  }
}
export async function getServiceLineProfile() {
  return buildServiceLineProfile(await getServiceLineWorkspace())
}
export async function getServiceLineConsultants() {
  return buildServiceLineConsultants(await getServiceLineWorkspace())
}

export async function getServiceLinePedidos(filters = {}) {
  const rows = filterServiceLineApplications((await getServiceLineWorkspace()).applications, filters)
  return rows.map((row) => ({
    ...row,
    status: { ...row.status, name: statusName(row.status.code, row.status.name), cor: CODE_COR[row.status.code] || 'gray' },
  }))
}
export async function getServiceLineDecisionHistory() {
  return buildServiceLineDecisionHistory((await getServiceLineWorkspace()).applications).map((row) => ({
    ...row,
    status: {
      code: row.code,
      name: statusName(row.code, row.statusName),
      cor: row.code === 'OPEN' ? 'blue' : CODE_COR[row.code] || 'gray',
    },
  }))
}
export async function getServiceLineReports(filters = {}) {
  const report = buildServiceLineReport(await getServiceLineWorkspace(), filters)
  return {
    ...report,
    applications: report.applications.map((row) => ({ ...row, status: { ...row.status, name: statusName(row.status.code, row.status.name), cor: CODE_COR[row.status.code] || 'gray' } })),
    approvals: report.approvals.map((row) => ({ ...row, status: { ...row.status, name: statusName(row.status.code, row.status.name), cor: CODE_COR[row.status.code] || 'gray' } })),
    rejections: report.rejections.map((row) => ({ ...row, status: { ...row.status, name: statusName(row.status.code, row.status.name), cor: CODE_COR[row.status.code] || 'gray' } })),
    statusBreakdown: report.statusBreakdown.map((row) => ({ ...row, label: statusName(row.code, row.label) })),
  }
}
export async function validarServiceLine(id, { decisao, comentario } = {}) {
  const result = await http(`/candidaturas/serviceline/${id}/validar`, { method: 'PUT', body: { decisao, comentario } })
  invalidateServiceLineWorkspace()
  invalidateTalentWorkspace()
  return result
}

export async function downloadManagerCertificate(consultantId, badgeId) {
  const token = getToken()
  const response = await api.get(`/relatorios/certificado-gestao/${consultantId}/${badgeId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition'] || ''
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `certificado-${badgeId}.pdf`
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

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

export async function getAdminPedidos() {
  const rows = await http('/candidaturas/admin/todas').catch(() => [])
  return (rows || []).map((c) => {
    const code = c.status?.code || 'SUBMITTED'
    return {
      id: c.id,
      trackingId: `#${String(c.id).padStart(5, '0')}`,
      badge: c.Badge?.nome || i18next.t('api.generic.badgeId', { id: c.badgeId }),
      consultor: c.Consultant?.User?.nome || i18next.t('api.generic.consultorId', { id: c.consultorId }),
      data: c.dataSubmicao ? new Date(c.dataSubmicao).toLocaleDateString('pt-PT') : '—',
      nivel: c.Badge?.nivelId != null ? String(c.Badge.nivelId) : '—',
      pontos: c.Badge?.ponto ?? 0,
      status: { code, name: c.status?.name || i18next.t('api.status.submetido'), cor: CODE_COR[code] || 'gray' },
      slaLimite: c.dataSlaLimite ? new Date(c.dataSlaLimite).toLocaleDateString('pt-PT') : null,
      slaExcedido: Boolean(c.slaExcedido),
    }
  })
}
