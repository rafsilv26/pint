

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
      { id: 1, titulo: 'Certificado oficial reconhecido' },
      { id: 2, titulo: 'Projeto prático validado' },
      { id: 3, titulo: 'Avaliação por um Talent Manager' },
    ],
    slug: `${t.nome.toLowerCase().replace(/\s+/g, '-')}-${nivel.toLowerCase()}`,
  }))
)

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

const ESTADOS = {
  OPEN: { code: 'OPEN', name: 'Aberta', cor: 'gray' },
  SUBMITTED: { code: 'SUBMITTED', name: 'Submetido', cor: 'blue' },
  IN_VALIDATION: { code: 'IN_VALIDATION', name: 'Em Validação', cor: 'amber' },
  VALIDATED: { code: 'VALIDATED', name: 'Validada', cor: 'indigo' },
  IN_APPROVAL: { code: 'IN_APPROVAL', name: 'Em Aprovação', cor: 'amber' },
  APPROVED: { code: 'APPROVED', name: 'Aprovado', cor: 'green' },
  REJECTED: { code: 'REJECTED', name: 'Rejeitada', cor: 'red' },
}

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

export const mockDashboard = {
  greeting: 'Bom dia',
  userName: 'Rafael',
  areaNome: 'OutSystems Development',
  learningPath: { titulo: 'Learning Path: Jornada Técnica', progresso: 45 },
  learningPaths: [
    { id: 1, nome: 'Jornada Técnica', progresso: 45, obtidos: 5, total: 11, emCurso: 2 },
    { id: 2, nome: 'Cloud & DevOps', progresso: 20, obtidos: 2, total: 10, emCurso: 1 },
  ],
  conquistasEspeciais: [
    { id: 1, nome: 'Especialista Mobile', descricao: 'Excelência em desenvolvimento mobile.', criterio: '5 badges Especialista Mobile.', data: '2026-06-01' },
  ],
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

export const mockTalentDashboard = {
  stats: [
    { label: 'Consultores', value: '40.689', delta: '+0.5%', tint: 'sky' },
    { label: 'Badges', value: '10.589', delta: '+0.5%', tint: 'violet' },
    { label: 'Candidaturas', value: '30.889', delta: '+0.5%', tint: 'amber' },
    { label: 'Service Lines', value: '20.789', delta: '+0.5%', tint: 'emerald' },
  ],
  pontuacaoGlobal: [
    { rank: 1, nome: 'Cody Fisher', pontos: 7500 },
    { rank: 2, nome: 'Kathryn Murphy', pontos: 6200 },
    { rank: 3, nome: 'Kristin Watson', pontos: 5400 },
    { rank: 4, nome: 'Jerome Bell', pontos: 4800 },
    { rank: 5, nome: 'Annette Black', pontos: 4200 },
    { rank: 6, nome: 'Marvin McKinney', pontos: 3600 },
    { rank: 7, nome: 'Devon Lane', pontos: 3100 },
    { rank: 8, nome: 'Floyd Miles', pontos: 2700 },
  ],
  pedidosFechados: [12, 18, 9, 22, 15, 28, 20],
  atividadeRecente: [
    { nome: 'João Silva', texto: 'Submeteu o badge "React Expert"' },
    { nome: 'Ana Fernandes', texto: 'Novo utilizador criado' },
    { nome: 'Carlos Lopes', texto: 'Badge "TypeScript" expirado' },
  ],
}

export const mockTalentCandidaturas = [
  { id: 201, trackingId: '#20482', consultor: 'Matt Dickerson', badge: 'Java', nivel: 'A', data: '13/06/2022', status: ESTADOS.IN_VALIDATION },
  { id: 202, trackingId: '#20482', consultor: 'Joaquim Pernil', badge: 'OutSystems', nivel: 'A', data: '13/06/2022', status: ESTADOS.IN_VALIDATION },
  { id: 203, trackingId: '#20482', consultor: 'Joaquim Pernil', badge: 'MongoDB', nivel: 'C', data: '13/06/2022', status: ESTADOS.SUBMITTED },
  { id: 204, trackingId: '#20482', consultor: 'Joaquim Pernil', badge: 'Visual Code', nivel: 'A', data: '13/06/2022', status: ESTADOS.IN_VALIDATION },
  { id: 205, trackingId: '#20482', consultor: 'Joaquim Pernil', badge: 'Java', nivel: 'C', data: '13/06/2022', status: ESTADOS.IN_VALIDATION },
  { id: 206, trackingId: '#20482', consultor: 'Joaquim Pernil', badge: 'OutSystems', nivel: 'A', data: '13/06/2022', status: ESTADOS.SUBMITTED },
]

export const mockServiceLineDashboard = {
  stats: [
    { label: 'Consultores LowCode', value: '890', delta: '+0.5%', tint: 'sky' },
    { label: 'Badges atribuídos', value: '367', delta: '+0.5%', tint: 'violet' },
    { label: 'Pedidos de badges', value: '189', delta: '+0.5%', tint: 'amber' },
    { label: 'Pontos atribuídos', value: '20.789', delta: '+0.5%', tint: 'emerald' },
  ],
  pontuacaoMensal: [
    { rank: 1, nome: 'Cody Fisher', badges: 8, pontos: 1500 },
    { rank: 2, nome: 'Kathryn Murphy', badges: 7, pontos: 1200 },
    { rank: 3, nome: 'Kristin Watson', badges: 6, pontos: 900 },
    { rank: 4, nome: 'Jerome Bell', badges: 5, pontos: 500 },
    { rank: 5, nome: 'Annette Black', badges: 4, pontos: 350 },
    { rank: 6, nome: 'Marvin McKinney', badges: 3, pontos: 200 },
  ],
  badgesAtribuidos: [10, 16, 12, 22, 18, 26, 20],
  atividadeRecente: [
    { nome: 'João Silva', texto: 'Pedido em validação' },
    { nome: 'Ana Fernandes', texto: 'Pedido devolvido ao consultor' },
    { nome: 'Carlos Lopes', texto: 'Badge expira em 10 dias' },
  ],
}

export const mockServiceLinePedidos = [
  { id: 301, trackingId: '#20482', badge: 'Java', consultor: 'Matt Dickerson', data: '13/06/2022', nivel: 'A', pontos: 100, status: ESTADOS.VALIDATED },
  { id: 302, trackingId: '#20482', badge: 'OutSystems', consultor: 'Joaquim Pernil', data: '13/06/2022', nivel: 'A', pontos: 100, status: ESTADOS.VALIDATED },
  { id: 303, trackingId: '#20482', badge: 'MongoDB', consultor: 'Joaquim Pernil', data: '13/06/2022', nivel: 'C', pontos: 100, status: ESTADOS.APPROVED },
  { id: 304, trackingId: '#20482', badge: 'Visual Code', consultor: 'Joaquim Pernil', data: '13/06/2022', nivel: 'A', pontos: 100, status: ESTADOS.REJECTED },
  { id: 305, trackingId: '#20482', badge: 'Java', consultor: 'Joaquim Pernil', data: '13/06/2022', nivel: 'C', pontos: 100, status: ESTADOS.VALIDATED },
  { id: 306, trackingId: '#20482', badge: 'OutSystems', consultor: 'Joaquim Pernil', data: '13/06/2022', nivel: 'A', pontos: 100, status: ESTADOS.APPROVED },
]
