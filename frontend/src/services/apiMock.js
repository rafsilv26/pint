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

// ---------- Talent Manager ----------
export async function getTalentDashboard() {
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
      { id: 1, nome: 'Certificado.pdf', url: '#', requisito: 'Certificado oficial reconhecido pela entidade fornecedora.' },
      { id: 2, nome: 'Projeto.pdf', url: '#', requisito: 'Projeto prático validado, com evidências do trabalho realizado.' },
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

// ---------- Service Line Leader ----------
export async function getServiceLineDashboard() {
  await delay()
  return clone(mockServiceLineDashboard)
}
export async function getServiceLinePedidos() {
  await delay()
  return clone(mockServiceLinePedidos)
}
export async function validarServiceLine() {
  await delay(500)
  return { mensagem: i18next.t('api.mensagens.decisaoRegistada') }
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

export async function updateConsultant(id, body) {
  return { mensagem: i18next.t('api.mensagens.perfilAtualizado') }
}