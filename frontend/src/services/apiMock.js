// =============================================================
//  IMPLEMENTAÇÃO MOCK DA API
//  Devolve dados estáticos (de ../data/mockData) com latência simulada.
//  Usada quando VITE_USE_REAL_API !== 'true' (ver api.js).
// =============================================================
import i18next from 'i18next' // <-- Import da instância global para ficheiros JS puros
import {
  mockUser,
  mockBadges,
  mockMyBadges,
  mockCandidaturas,
  mockNotifications,
  mockGamification,
  mockDashboard,
  mockPublicBadges,
  mockTalentDashboard,
  mockTalentCandidaturas,
  mockServiceLineDashboard,
  mockServiceLinePedidos,
} from '../data/mockData'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (data) => JSON.parse(JSON.stringify(data))

// ---------- Autenticação ----------
export async function login({ email, password }) {
  await delay()
  if (!email || !password) throw new Error(i18next.t('api.validacao.emailPassword'))
  return { token: 'mock-token-' + Date.now(), user: { ...clone(mockUser), email } }
}

export async function register(dados) {
  await delay()
  if (!dados?.nome || !dados?.email || !dados?.password) throw new Error(i18next.t('api.validacao.registoCampos'))
  return { message: i18next.t('api.mensagens.contaCriada') }
}

export async function recuperarPassword({ email }) {
  await delay()
  if (!email) throw new Error(i18next.t('api.validacao.indicaEmail'))
  return { message: i18next.t('api.mensagens.recuperacaoEnviada') }
}

export async function resetPassword({ token, novaPassword }) {
  await delay()
  if (!token) throw new Error(i18next.t('api.validacao.tokenInvalido'))
  if (!novaPassword || novaPassword.length < 8) throw new Error(i18next.t('api.validacao.passwordCurta'))
  return { message: i18next.t('api.mensagens.passwordAlterada') }
}

export async function confirmarEmail({ token }) {
  await delay()
  if (!token) throw new Error(i18next.t('api.validacao.tokenInvalido'))
  return { message: i18next.t('api.mensagens.emailConfirmado') }
}

// ---------- Preferências de notificação ----------
let mockNotificationPrefs = {
  email: true, aprovado: true, rejeitado: true,
  novos: true, ranking: false, semanal: true, mensal: false,
}

export async function getNotificationPrefs() {
  await delay()
  return { ...mockNotificationPrefs }
}

export async function saveNotificationPrefs(prefs) {
  await delay()
  mockNotificationPrefs = { ...mockNotificationPrefs, ...prefs }
  return { message: i18next.t('api.mensagens.preferenciasGuardadas'), prefs: { ...mockNotificationPrefs } }
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
  if (!badgeId) throw new Error(i18next.t('api.validacao.selecionaBadge'))
  return { mensagem: i18next.t('api.mensagens.candidaturaSubmetida'), candidaturaId: Math.floor(Math.random() * 1000) + 200 }
}
export async function getRascunho() {
  await delay()
  return null
}
export async function apagarEvidencia() {
  await delay()
  return {}
}
let _mockObjetivos = [
  { id: 1, title: 'Obter badge Outsystems Júnior', description: '', expectedDate: new Date(Date.now() + 6 * 86400000).toISOString(), completionDate: null, status: 'Pendente', priority: 2, concluido: false },
]
export async function getMeusObjetivos() {
  await delay()
  return clone(_mockObjetivos)
}
export async function criarObjetivo(body) {
  await delay()
  const novo = { id: Date.now(), title: body.title, description: body.description || '', expectedDate: body.expectedDate || null, completionDate: null, status: 'Pendente', priority: body.priority || 3, concluido: false }
  _mockObjetivos = [..._mockObjetivos, novo]
  return clone(novo)
}
export async function concluirObjetivo(id, concluido = true) {
  await delay()
  _mockObjetivos = _mockObjetivos.map((o) => (o.id === id ? { ...o, concluido, completionDate: concluido ? new Date().toISOString() : null, status: concluido ? 'Concluído' : 'Pendente' } : o))
  return clone(_mockObjetivos.find((o) => o.id === id))
}
export async function apagarObjetivo(id) {
  await delay()
  _mockObjetivos = _mockObjetivos.filter((o) => o.id !== id)
  return {}
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
  return { mensagem: i18next.t('api.mensagens.assinaturaGuardada') }
}

// ---------- Password ----------
export async function changePassword({ currentPassword, newPassword }) {
  await delay()
  if (!currentPassword || !newPassword) throw new Error(i18next.t('api.validacao.preencheCampos'))
  return { message: i18next.t('api.mensagens.passwordAlterada') }
}

// ---------- Consultores (diretório) ----------
export async function getConsultants() {
  await delay()
  return [
    {
      id: 7, name: 'Maria Costa', area: 'Cloud & Infrastructure', serviceLine: 'Technology', points: 480, badges: 8, specials: 1, rank: 1, isCurrentUser: false,
      email: 'maria.costa@softinsa.pt', biography: 'Especialista em Cloud & Infraestrutura, focada em AWS e Kubernetes.', linkedinUrl: 'https://linkedin.com/in/maria-costa', startDate: '03/2021',
      badgesConquistados: [
        { id: 1, nome: 'OutSystems', nivelId: 3, pontos: 150, fornecedor: 'OutSystems', obtidoEm: '2024-11-02', valido: true },
        { id: 3, nome: 'MongoDB', nivelId: 2, pontos: 120, fornecedor: 'MongoDB', obtidoEm: '2024-06-15', valido: true },
      ],
    },
    { id: 9, name: 'João Pereira', area: 'Data & AI', serviceLine: 'Technology', points: 410, badges: 7, specials: 0, rank: 2, isCurrentUser: false, email: 'joao.pereira@softinsa.pt', startDate: '09/2021', badgesConquistados: [] },
    { id: 1, name: 'Rafael Silva', area: 'Cloud & Infrastructure', serviceLine: 'Technology', points: 320, badges: 5, specials: 0, rank: 3, isCurrentUser: true, email: 'rafael@softinsa.pt', startDate: '01/2022', badgesConquistados: [] },
    { id: 4, name: 'Ana Martins', area: 'Custom Development', serviceLine: 'Technology', points: 250, badges: 4, specials: 0, rank: 4, isCurrentUser: false, email: 'ana.martins@softinsa.pt', startDate: '05/2022', badgesConquistados: [] },
  ]
}
export async function getConsultant(id) {
  const all = await getConsultants()
  return all.find((c) => c.id === Number(id)) || null
}
export async function getConsultantCandidaturas(id) {
  await delay()
  return Number(id) === 7 ? mockTalentCandidaturas.map((c) => ({ ...c })) : []
}

// ---------- Sessão ----------
export async function me() {
  await delay()
  return { user: clone(mockUser) }
}

// ---------- RGPD ----------
// Em modo mock não há políticas pendentes a bloquear a entrada.
export async function acceptPolicy() {
  await delay(200)
  return { message: 'Política aceite com sucesso.', pendingPolicies: [] }
}

// ---------- Talent Manager ----------
export async function getTalentDashboard() {
  await delay()
  return clone(mockTalentDashboard)
}
export async function getAdminDashboard() {
  await delay()
  return clone(mockTalentDashboard)
}
export async function getTalentCandidaturas(estado = 'pendentes') {
  await delay()
  if (estado === 'validadas') {
    return clone(mockTalentCandidaturas.filter((c) => c.status.code === 'VALIDATED'))
  }
  return clone(mockTalentCandidaturas)
}
export async function getCandidatura(id) {
  await delay()
  const base = mockTalentCandidaturas.find((c) => c.id === Number(id))
  return {
    id: Number(id),
    numero: base?.trackingId || `#${id}`,
    estado: base?.status || { code: 'SUBMITTED', name: 'Submetido', cor: 'amber' },
    consultor: base?.consultor || 'Consultor',
    submissao: base?.data || '—',
    badge: { nome: base?.badge || 'Badge', nivel: base?.nivel || '—', tint: 'salmon' },
    evidencias: [
      { id: 1, nome: 'Certificado.pdf', url: '#', requisito: 'Certificado oficial reconhecido pela entidade fornecedora.', validado: base?._evidenciasValidadas ? true : null },
      { id: 2, nome: 'Projeto.pdf', url: '#', requisito: 'Projeto prático validado, com evidências do trabalho realizado.', validado: base?._evidenciasValidadas ? true : null },
    ],
    historico: [
      { estado: 'Submetida', data: base?.data || '—', motivo: 'Candidatura submetida pelo consultor' },
    ],
  }
}
export async function validarTalentManager() {
  await delay(500)
  return { mensagem: i18next.t('api.mensagens.decisaoRegistada') }
}
export async function validarEvidencia(id, validado) {
  await delay(300)
  return { mensagem: i18next.t('api.mensagens.decisaoRegistada'), evidencia: { id, validado } }
}

export async function getTalentConsultants() {
  const rows = await getConsultants()
  return rows.map((consultant) => ({
    ...consultant,
    learningPath: 'Technology',
    progress: Math.min(100, Math.round(((consultant.badges || 0) / 10) * 100)),
    pathCompleted: consultant.badges || 0,
    pathTotal: 10,
    expiringCount: 0,
    expiredCount: 0,
    activeApplications: 0,
    awards: consultant.badgesConquistados || [],
    specialAchievements: [],
    timeline: [],
  }))
}

export async function getTalentConsultant(id) {
  const rows = await getTalentConsultants()
  return rows.find((consultant) => Number(consultant.id) === Number(id)) || null
}

export async function getTalentCatalog() {
  return getBadges()
}

export async function getTalentReports(filters = {}) {
  await delay()
  const candidaturas = clone(mockTalentCandidaturas).filter((row) => !filters.status || filters.status === 'ALL' || row.status.code === filters.status)
  const consultants = await getTalentConsultants()
  const approvals = candidaturas.filter((row) => row.status.code === 'APPROVED')
  const rejections = candidaturas.filter((row) => row.status.code === 'REJECTED')
  const awards = consultants.flatMap((consultant) => (consultant.badgesConquistados || []).map((award) => ({
    ...award,
    badgeId: award.id,
    consultor: consultant.name,
    consultantId: consultant.id,
    area: consultant.area,
    serviceLine: consultant.serviceLine,
    learningPath: consultant.learningPath,
    nivel: award.nivelId || '—',
    pontos: award.pontos || 0,
    obtainedDate: award.obtidoEm,
    expirationDate: award.expiraEm,
  })))
  const learningPathBreakdown = [...new Set(awards.map((award) => award.learningPath))].filter(Boolean).map((learningPath) => ({ learningPath, value: awards.filter((award) => award.learningPath === learningPath).length }))
  const levelBreakdown = [...new Set(awards.map((award) => award.nivel))].map((level) => ({ level, value: awards.filter((award) => award.nivel === level).length }))
  return {
    candidaturas,
    consultants,
    awards,
    approvals,
    rejections,
    specialAchievements: [],
    statusBreakdown: [...new Set(candidaturas.map((row) => row.status.code))].map((code) => ({
      code,
      label: candidaturas.find((row) => row.status.code === code)?.status.name || code,
      value: candidaturas.filter((row) => row.status.code === code).length,
    })),
    areaBreakdown: [],
    learningPathBreakdown,
    levelBreakdown,
    badgeBreakdown: [],
    monthlyBreakdown: [],
    filterOptions: {
      areas: [...new Set(consultants.map((consultant) => consultant.area).filter(Boolean))],
      serviceLines: [...new Set(consultants.map((consultant) => consultant.serviceLine).filter(Boolean))],
      learningPaths: [...new Set(consultants.map((consultant) => consultant.learningPath).filter(Boolean))],
      levels: [...new Set(awards.map((award) => award.nivel))],
      badges: mockBadges.map((badge) => ({ id: badge.id, nome: badge.nome })),
    },
    totals: { candidaturas: candidaturas.length, consultants: consultants.length, registeredUsers: consultants.length, awards: awards.length, approvals: approvals.length, rejections: rejections.length, specialAchievements: 0, awardedPoints: awards.reduce((sum, award) => sum + award.pontos, 0) },
  }
}

export async function getTalentProfile() {
  const report = await getTalentReports()
  return {
    serviceLines: report.filterOptions.serviceLines.map((nome, index) => ({ id: index + 1, nome })),
    learningPaths: report.filterOptions.learningPaths.map((nome, index) => ({ id: index + 1, nome })),
    areas: report.filterOptions.areas.map((nome, index) => ({ id: index + 1, nome })),
    stats: {
      consultants: report.totals.consultants,
      serviceLines: report.filterOptions.serviceLines.length,
      availableBadges: mockBadges.filter((badge) => badge.ativo !== false).length,
      pendingValidations: report.candidaturas.filter((row) => row.status?.code === 'SUBMITTED').length,
      awardedBadges: report.totals.awards,
      expiringBadges: 0,
    },
  }
}

export async function refreshTalentWorkspace() {
  return { ok: true }
}

// ---------- Service Line Leader ----------
export async function getServiceLineDashboard() {
  await delay()
  const dashboard = clone(mockServiceLineDashboard)
  const ranking = dashboard.ranking || dashboard.pontuacaoMensal || []
  return {
    ...dashboard,
    ranking,
    consultantProgress: ranking.map((row, index) => ({
      id: index + 1,
      name: row.nome,
      area: 'LowCode',
      points: row.pontos,
      badges: row.badges,
      progress: Math.min(100, row.badges * 10),
      pathCompleted: row.badges,
      pathTotal: 10,
    })),
  }
}
export async function getServiceLineProfile() {
  await delay()
  return {
    serviceLine: { id: 1, nome: 'Technology', descricao: '' },
    learningPath: { id: 1, nome: 'Engineering' },
    areas: [{ id: 1, nome: 'LowCode' }],
    stats: {
      consultants: 4,
      availableBadges: mockBadges.length,
      pendingApprovals: mockServiceLinePedidos.filter((row) => row.status?.code === 'VALIDATED').length,
      awardedBadges: 0,
    },
  }
}
export async function getServiceLinePedidos() {
  await delay()
  return clone(mockServiceLinePedidos)
}
export async function getServiceLineDecisionHistory() {
  await delay()
  return clone(mockServiceLinePedidos)
    .filter((row) => ['APPROVED', 'REJECTED'].includes(row.status?.code))
    .map((row, index) => ({
      id: `${row.id}-current`,
      requestId: row.id,
      trackingId: row.trackingId,
      badge: row.badge,
      consultor: row.consultor,
      code: row.status.code,
      statusName: row.status.name,
      status: row.status,
      decidedAt: new Date(2026, 6, 10 - index).toISOString(),
      author: 'Service Line Leader',
      comment: '',
    }))
}
export async function getServiceLineReports() {
  await delay()
  const applications = clone(mockServiceLinePedidos)
  const consultants = await getConsultants()
  const approvals = applications.filter((row) => row.status?.code === 'APPROVED')
  const rejections = applications.filter((row) => row.status?.code === 'REJECTED')
  const comparison = consultants.map((row) => ({ ...row, progress: Math.min(100, (row.badges || 0) * 10), experienceMonths: 24, experienceBand: '12-35' }))
  return {
    applications, consultants, catalog: clone(mockBadges), awards: [], approvals, rejections,
    specialAchievements: [], statusBreakdown: [], areaBreakdown: [], monthlyBreakdown: [], comparison,
    filterOptions: { areas: [...new Set(consultants.map((row) => row.area).filter(Boolean))], experienceBands: ['12-35'] },
    totals: { applications: applications.length, consultants: consultants.length, catalog: mockBadges.length, awards: 0, approvals: approvals.length, rejections: rejections.length, specialAchievements: 0, points: 0 },
  }
}
export async function refreshServiceLineWorkspace() {
  return { ok: true }
}
export async function validarServiceLine() {
  await delay(500)
  return { mensagem: i18next.t('api.mensagens.decisaoRegistada') }
}
export async function downloadManagerCertificate() {
  return { ok: true }
}

// ---------- Admin (CRUD genérico, com store em memória) ----------
let _adminId = 1000
const adminStore = {
  badges: [
    { id: 1, nome: 'OutSystems', nivel: 'Júnior', ponto: 100, descricao: 'Low-code com OutSystems.' },
    { id: 2, nome: 'Java', nivel: 'Sénior', ponto: 150, descricao: 'Desenvolvimento Java.' },
    { id: 3, nome: 'MongoDB', nivel: 'Intermédio', ponto: 120, descricao: 'Base de dados NoSQL.' },
  ],
  'learning-paths': [
    { id: 1, nome: 'Cloud Foundations', descricao: 'Trilho de cloud.' },
    { id: 2, nome: 'Data & AI', descricao: 'Trilho de dados e inteligência artificial.' },
  ],
  policies: [
    { id: 1, titulo: 'Política de Privacidade', versao: '2.0', descricao: 'Tratamento de dados pessoais.' },
  ],
  notices: [
    { id: 1, title: 'Manutenção programada', message: 'A plataforma estará offline dia 20/06.' },
  ],
  information: [
    { id: 1, title: 'Nova época de candidaturas', message: 'Candidaturas abertas até 30 de junho.' },
  ],
  'service-lines': [
    { id: 1, nome: 'Technology', descricao: 'Service line de tecnologia.' },
    { id: 2, nome: 'LowCode', descricao: 'Service line de low-code.' },
  ],
  areas: [
    { id: 1, nome: 'Cloud & Infrastructure', descricao: 'Cloud, redes e infraestrutura.' },
    { id: 2, nome: 'Data & AI', descricao: 'Dados e inteligência artificial.' },
    { id: 3, nome: 'Custom Development', descricao: 'Desenvolvimento à medida.' },
  ],
  levels: [
    { id: 1, codigo: 'JR', nome: 'Júnior', ordem: 1 },
    { id: 2, codigo: 'IN', nome: 'Intermédio', ordem: 2 },
    { id: 3, codigo: 'SR', nome: 'Sénior', ordem: 3 },
    { id: 4, codigo: 'ES', nome: 'Especialista', ordem: 4 },
  ],
  requirements: [
    { id: 1, titulo: 'Certificado oficial', descricao: 'Certificado reconhecido pela entidade.' },
    { id: 2, titulo: 'Projeto prático', descricao: 'Projeto validado por um Talent Manager.' },
  ],
}
const ensure = (r) => (adminStore[r] = adminStore[r] || [])

export async function listResource(resource) {
  await delay()
  return clone(ensure(resource))
}
export async function createResource(resource, body) {
  await delay()
  const row = { id: ++_adminId, ...body }
  ensure(resource).push(row)
  return clone(row)
}
export async function updateResource(resource, id, body) {
  await delay()
  const arr = ensure(resource)
  const i = arr.findIndex((r) => r.id === Number(id))
  if (i >= 0) arr[i] = { ...arr[i], ...body }
  return clone(arr[i] || null)
}
export async function deleteResource(resource, id) {
  await delay()
  const arr = ensure(resource)
  const i = arr.findIndex((r) => r.id === Number(id))
  if (i >= 0) arr.splice(i, 1)
  return { ok: true }
}

// ---------- Admin: Utilizadores ----------
let _userId = 50
const usersStore = [
  { id: 1, nome: 'Rafael Silva', email: 'rafael@softinsa.pt', roles: ['Consultor'], ativo: true },
  { id: 2, nome: 'Joana Freitas', email: 'joana@softinsa.pt', roles: ['TalentManager'], ativo: true },
  { id: 3, nome: 'Pedro Costa', email: 'pedro@softinsa.pt', roles: ['ServiceLineLeader'], ativo: true },
  { id: 4, nome: 'Admin Softinsa', email: 'admin@softinsa.pt', roles: ['Admin'], ativo: true },
]
export async function getUsers() {
  await delay()
  return clone(usersStore)
}
export async function createUser(body) {
  await delay()
  const u = { id: ++_userId, nome: body.nome, email: body.email, roles: body.roles || ['Consultor'], ativo: true }
  usersStore.push(u)
  return clone(u)
}
export async function updateUser(id, body) {
  await delay()
  const i = usersStore.findIndex((u) => u.id === Number(id))
  if (i >= 0) usersStore[i] = { ...usersStore[i], ...body }
  return clone(usersStore[i] || null)
}
export async function deleteUser(id) {
  await delay()
  const i = usersStore.findIndex((u) => u.id === Number(id))
  if (i >= 0) usersStore[i].ativo = false
  return { ok: true }
}

// ---------- Admin: Pedidos ----------
export async function getAdminPedidos() {
  await delay()
  return clone(mockServiceLinePedidos)
}

// ---------- Exportações (gera um CSV de demonstração) ----------
export async function exportarRelatorio() {
  await delay(300)
  const csv = 'Tracking,Consultor,Badge,Nivel,Estado\n#20482,Matt Dickerson,Java,A,Em Validacao\n#20482,Joaquim Pernil,OutSystems,A,Submetido\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'relatorio-mock.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export async function updateConsultant() {
  return { mensagem: i18next.t('api.mensagens.perfilAtualizado') }
}
