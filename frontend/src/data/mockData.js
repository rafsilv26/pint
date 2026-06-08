// =============================================================
//  DADOS MOCK — perfil Consultor
//  Estrutura espelha (de forma simplificada) as respostas do backend,
//  para que mais tarde seja fácil trocar pela API real sem mexer nas páginas.
// =============================================================

export const mockUser = {
  id: 1,
  nome: 'Rafael Silva',
  email: 'rafael@softinsa.pt',
  fotoPerfil: null,
  idioma: 'PT',
  role: 'Consultor',
  roles: ['Consultor'],
  area: 'Cloud & Infrastructure',
  serviceLine: 'Technology',
  mustChangePassword: false,
}

// ---- Catálogo de badges ----
// Gerado a partir de tecnologias × níveis (segue o estilo do Figma do catálogo).
const TECHS = [
  { nome: 'OutSystems', tint: 'salmon', fornecedor: 'OutSystems' },
  { nome: 'Visual Code', tint: 'sky', fornecedor: 'Microsoft' },
  { nome: 'Docker', tint: 'sky', fornecedor: 'Docker' },
  { nome: 'Java', tint: 'salmon', fornecedor: 'Oracle' },
  { nome: 'MongoDB', tint: 'emerald', fornecedor: 'MongoDB' },
]
const NIVEIS = ['Júnior', 'Intermédio', 'Sénior', 'Especialista']

let _badgeId = 0
export const mockBadges = TECHS.flatMap((t) =>
  NIVEIS.map((nivel) => ({
    id: ++_badgeId,
    nome: t.nome,
    nivel,
    tipo: 'Certificação',
    fornecedor: t.fornecedor,
    tint: t.tint,
    ponto: 100,
    duracaoMeses: 24,
    descricao: `Demonstra competências em ${t.nome} ao nível ${nivel}, aplicadas em contexto de projeto real.`,
    requisitos: [
      'Certificado oficial reconhecido',
      'Projeto prático validado',
      'Avaliação por um Talent Manager',
    ],
    slug: `${t.nome.toLowerCase().replace(/\s+/g, '-')}-${nivel.toLowerCase()}`,
  }))
)

// ---- Badges já conquistadas (histórico) ----
export const mockMyBadges = [
  {
    badgeId: 2,
    nome: 'Azure Fundamentals',
    fornecedor: 'Microsoft',
    pontos: 20,
    obtainedDate: '2026-02-10',
    expirationDate: '2029-02-10',
    valid: true,
    publicToken: 'pub-azure-001',
    imagem: null,
  },
  {
    badgeId: 4,
    nome: 'React Developer',
    fornecedor: 'Softinsa Academy',
    pontos: 30,
    obtainedDate: '2026-04-22',
    expirationDate: null,
    valid: true,
    publicToken: 'pub-react-004',
    imagem: null,
  },
]

// ---- Estados das candidaturas ----
export const ESTADOS = {
  OPEN: { code: 'OPEN', name: 'Aberta', cor: 'gray' },
  SUBMITTED: { code: 'SUBMITTED', name: 'Submetido', cor: 'blue' },
  IN_VALIDATION: { code: 'IN_VALIDATION', name: 'Em Validação', cor: 'amber' },
  VALIDATED: { code: 'VALIDATED', name: 'Validada', cor: 'indigo' },
  IN_APPROVAL: { code: 'IN_APPROVAL', name: 'Em Aprovação', cor: 'amber' },
  APPROVED: { code: 'APPROVED', name: 'Aprovado', cor: 'green' },
  REJECTED: { code: 'REJECTED', name: 'Rejeitada', cor: 'red' },
}

// ---- Candidaturas (ecrã "Meus Badges") ----
export const mockCandidaturas = [
  {
    id: 101,
    badge: { id: 1, nome: 'Azure Solutions Architect Expert' },
    tags: ['Especialista', 'Cloud'],
    status: ESTADOS.IN_VALIDATION,
    progresso: 70,
    submittedDate: '26 Jan 2025',
    diasAnalise: 7,
    evidencias: 4,
  },
  {
    id: 102,
    badge: { id: 9, nome: 'Kubernetes Administrator' },
    tags: ['Sénior', 'DevOps'],
    status: ESTADOS.SUBMITTED,
    progresso: 25,
    submittedDate: '1 Fev 2025',
    diasAnalise: 4,
    evidencias: 3,
  },
  {
    id: 103,
    badge: { id: 2, nome: 'React Advanced Developer' },
    tags: ['Sénior', 'Frontend'],
    status: ESTADOS.REJECTED,
    progresso: 0,
    submittedDate: '20 Jan 2025',
    diasAnalise: 2,
    evidencias: 2,
    feedback: {
      autor: 'Ana Rita Ferreira',
      papel: 'Service Line Líder',
      texto: 'As evidências submetidas não demonstram experiência em React Hooks e Context API.',
    },
  },
  {
    id: 104,
    badge: { id: 13, nome: 'Python Backend Developer' },
    tags: ['Júnior', 'Backend'],
    status: ESTADOS.APPROVED,
    progresso: 100,
    submittedDate: '11 Jan 2025',
    diasAnalise: 7,
    evidencias: 3,
  },
  {
    id: 105,
    badge: { id: 9, nome: 'Docker Certified Associate' },
    tags: ['Especialista', 'Cloud'],
    status: ESTADOS.IN_VALIDATION,
    progresso: 60,
    submittedDate: '26 Jan 2025',
    diasAnalise: 12,
    evidencias: 5,
  },
  {
    id: 106,
    badge: { id: 1, nome: 'AWS DevOps Engineer' },
    tags: ['Especialista', 'Cloud'],
    status: ESTADOS.SUBMITTED,
    progresso: 10,
    submittedDate: '3 Fev 2025',
    diasAnalise: 3,
    evidencias: 6,
  },
]

// ---- Notificações / alertas ----
export const mockNotifications = [
  {
    id: 1,
    title: 'Candidatura em validação',
    message: 'A tua candidatura ao badge "Azure Solutions Architect" está a ser analisada.',
    type: 'info',
    lida: false,
    createdAt: '2026-06-03T09:12:00Z',
  },
  {
    id: 2,
    title: 'Badge a expirar',
    message: 'O teu badge "Azure Fundamentals" expira dentro de 60 dias.',
    type: 'warning',
    lida: false,
    createdAt: '2026-06-02T14:00:00Z',
  },
  {
    id: 3,
    title: 'Badge conquistado 🎉',
    message: 'Parabéns! Conquistaste o badge "React Developer".',
    type: 'success',
    lida: true,
    createdAt: '2026-04-22T17:30:00Z',
  },
]

// ---- Gamificação / Ranking ----
export const mockGamification = {
  me: { posicao: 1, totalConsultores: 248, pontos: 1250, badges: 24, percentil: 45, evolucao: '+2' },
  lista: [
    { rank: 4, nome: 'Ana Rodrigues', area: 'Custom Development', pontos: 2890, badges: 38, delta: '+480' },
    { rank: 5, nome: 'Carlos Mendes', area: 'Hybrid Cloud', pontos: 2750, badges: 42, delta: '+420' },
    { rank: 6, nome: 'Sofia Almeida', area: 'Data & AI', pontos: 2680, badges: 51, delta: '+390' },
    { rank: 7, nome: 'Ricardo Pereira', area: 'Cybersecurity', pontos: 2540, badges: 45, delta: '+350' },
    { rank: 8, nome: 'Beatriz Sousa', area: 'Custom Development', pontos: 2420, badges: 33, delta: '+310' },
    { rank: 9, nome: 'Miguel Ferreira', area: 'Hybrid Cloud', pontos: 2310, badges: 29, delta: '+240' },
    { rank: 10, nome: 'Teresa Martins', area: 'Data & AI', pontos: 2180, badges: 36, delta: '+170' },
  ],
  top3: [
    { rank: 2, nome: 'Maria Santos', area: 'Data & AI', pontos: 3180 },
    { rank: 1, nome: 'João Silva', area: 'Hybrid Cloud', pontos: 3250 },
    { rank: 3, nome: 'Pedro Costa', area: 'Cybersecurity', pontos: 3050 },
  ],
}

// ---- Dashboard pessoal (ecrã "Início") ----
export const mockDashboard = {
  greeting: 'Bom dia',
  userName: 'Rafael',
  stats: [
    { label: 'Pontos Totais', value: '1250', delta: '+12%', tint: 'violet', deltaTint: 'green' },
    { label: 'Badges Conquistados', value: '8', delta: '+2', tint: 'violet', deltaTint: 'green' },
    { label: 'Em Progresso', value: '5', delta: '3 ativos', tint: 'orange', deltaTint: 'orange' },
    { label: 'Taxa de Sucesso', value: '85%', delta: '+12', tint: 'emerald', deltaTint: 'green' },
  ],
  badgesRecentes: [
    { id: 2, nome: 'Azure Fundamentals', nivel: 'Nível Júnior', progresso: 100, status: { name: 'Aprovado', cor: 'green' } },
    { id: 3, nome: 'Scrum Master', nivel: 'Nível Sénior', progresso: 75, status: { name: 'Em Validação', cor: 'amber' } },
    { id: 4, nome: 'React Developer', nivel: 'Nível Especialista', progresso: 75, status: { name: 'Em Progresso', cor: 'blue' } },
  ],
  recomendados: [
    { id: 9, nome: 'Docker Essentials', nivel: 'Júnior', tint: 'sky' },
    { id: 10, nome: 'Kubernetes Admin', nivel: 'Sénior', tint: 'violet' },
    { id: 17, nome: 'MongoDB', nivel: 'Intermédio', tint: 'emerald' },
  ],
  perfil: {
    nome: 'Utilizador Softinsa',
    cargo: 'Application Operations · SRE',
    nivel: 'Pleno',
    pontos: 250,
    posicao: 12,
  },
  eventos: [
    { id: 1, titulo: 'Workshop: Azure Fundamentals', data: '15 Jun', cor: 'violet' },
    { id: 2, titulo: 'Sessão de Mentoria', data: '18 Jun', cor: 'blue' },
    { id: 3, titulo: 'Prazo: Scrum Master Badge', data: '30 Jun', cor: 'green' },
  ],
}

// ---- Página pública de badge (verificação por token) ----
export const mockPublicBadges = {
  'pub-azure-001': {
    badge: { nome: 'Azure Fundamentals', descricao: 'Conceitos base de cloud Microsoft Azure.', fornecedor: 'Microsoft', tipo: 'Certificação' },
    consultor: { nome: 'Rafael Silva' },
    dataAtribuicao: '2026-02-10',
    dataExpiracao: '2029-02-10',
    valido: true,
  },
  'pub-react-004': {
    badge: { nome: 'React Developer', descricao: 'Desenvolvimento de interfaces com React.', fornecedor: 'Softinsa Academy', tipo: 'Conquista' },
    consultor: { nome: 'Rafael Silva' },
    dataAtribuicao: '2026-04-22',
    dataExpiracao: null,
    valido: true,
  },
}
