import {
  Home, LayoutGrid, Medal, Trophy, User,
  LayoutDashboard, ClipboardCheck, Route, Users, Award, FileBarChart, Bell,
  ShieldCheck, Info, Settings, Network, Boxes, BarChart3, ListChecks, Gem,
} from 'lucide-react'

// ===== Navbar de topo do Consultor =====
export const getNavItems = (t) => [
  { to: '/', label: t('nav.consultor.inicio'), icon: Home, end: true },
  { to: '/catalogo', label: t('nav.consultor.catalogo'), icon: LayoutGrid },
  { to: '/candidaturas', label: t('nav.consultor.meusBadges'), icon: Medal },
  { to: '/ranking', label: t('nav.consultor.ranking'), icon: Trophy },
  { to: '/perfil', label: t('nav.consultor.perfil'), icon: User },
]

// ===== Sidebar do Talent Manager =====
export const getTalentNav = (t) => [
  { to: '/tm', label: t('nav.tm.dashboard'), icon: LayoutDashboard, end: true },
  { to: '/tm/candidaturas', label: t('nav.tm.candidaturas'), icon: ClipboardCheck },
  { to: '/tm/catalogo', label: t('nav.tm.catalogo'), icon: LayoutGrid },
  { to: '/tm/learning-paths', label: t('nav.tm.learningPaths'), icon: Route },
  { to: '/tm/consultores', label: t('nav.tm.consultores'), icon: Users },
]

// ===== Sidebar do Service Line Leader =====
export const getSllNav = (t) => [
  { to: '/sll', label: t('nav.sll.dashboard'), icon: LayoutDashboard, end: true },
  { to: '/sll/consultores', label: t('nav.sll.consultores'), icon: Users },
  { to: '/sll/badges', label: t('nav.sll.badges'), icon: Award },
  { to: '/sll/pedidos', label: t('nav.sll.pedidos'), icon: ClipboardCheck },
  { to: '/sll/relatorios', label: t('nav.sll.relatorios'), icon: FileBarChart },
  { to: '/sll/notificacoes', label: t('nav.sll.notificacoes'), icon: Bell },
]

// ===== Sidebar do Administrador =====
export const getAdminNav = (t) => [
  { to: '/admin', label: t('nav.admin.dashboard'), icon: LayoutDashboard, end: true },
  { to: '/admin/utilizadores', label: t('nav.admin.utilizadores'), icon: Users },
  { to: '/admin/badges', label: t('nav.admin.badges'), icon: Award },
  { to: '/admin/badges-premium', label: t('nav.admin.badgesPremium'), icon: Gem },
  { to: '/admin/pedidos', label: t('nav.admin.pedidos'), icon: ClipboardCheck },
  { to: '/admin/learning-paths', label: t('nav.admin.learningPaths'), icon: Route },
  { to: '/admin/service-lines', label: t('nav.admin.serviceLines'), icon: Network },
  { to: '/admin/areas', label: t('nav.admin.areas'), icon: Boxes },
  { to: '/admin/niveis', label: t('nav.admin.niveis'), icon: BarChart3 },
  { to: '/admin/requisitos', label: t('nav.admin.requisitos'), icon: ListChecks },
  { to: '/admin/politicas', label: t('nav.admin.politicas'), icon: ShieldCheck },
  { to: '/admin/avisos', label: t('nav.admin.avisos'), icon: Bell },
  { to: '/admin/informacoes', label: t('nav.admin.informacoes'), icon: Info },
  { to: '/admin/definicoes', label: t('nav.admin.definicoes'), icon: Settings },
]

export const getRolePanels = (t) => ({
  TalentManager: { label: 'Talent Manager', home: '/tm', nav: getTalentNav(t) },
  ServiceLineLeader: { label: 'Service Line Leader', home: '/sll', nav: getSllNav(t) },
  Admin: { label: t('nav.roles.admin'), home: '/admin', nav: getAdminNav(t) },
})

export const ROLE_HOME = {
  Consultor: '/',
  TalentManager: '/tm',
  ServiceLineLeader: '/sll',
  Admin: '/admin',
}

export const primaryRole = (user) => (user?.roles && user.roles[0]) || user?.role || 'Consultor'
export const homeForRole = (user) => ROLE_HOME[primaryRole(user)] || '/'

// O backend devolve sempre os perfis com o nome completo (ex: 'TalentManager',
// 'ServiceLineLeader'), mas as rotas/RoleGuard usam códigos curtos ('tm', 'sll').
// Este mapa é o único sítio que faz essa conversão — evita bugs de "Acesso
// Negado" por o código curto nunca coincidir com o nome completo em minúsculas.
const ROLE_SHORT_CODES = {
  Consultor: 'consultor',
  TalentManager: 'tm',
  ServiceLineLeader: 'sll',
  Admin: 'admin',
}
export const roleShortCode = (role) => ROLE_SHORT_CODES[role] || String(role || '').toLowerCase()

// O painel (sidebar) é escolhido pelo caminho — fácil de pré-visualizar.
export const getPanelForPath = (pathname = '', t) => {
  const panels = getRolePanels(t)
  if (pathname.startsWith('/tm')) return panels.TalentManager
  if (pathname.startsWith('/sll')) return panels.ServiceLineLeader
  if (pathname.startsWith('/admin')) return panels.Admin
  return { label: t('nav.painelDefault'), nav: [] }
}