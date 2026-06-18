import {
  Home, LayoutGrid, Medal, Trophy, User,
  LayoutDashboard, ClipboardCheck, Route, Users, Award, FileBarChart, Bell,
  ShieldCheck, Info, Settings, Network, Boxes, BarChart3, ListChecks,
} from 'lucide-react'

// ===== Navbar de topo do Consultor =====
export const navItems = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/catalogo', label: 'Catálogo de Badges', icon: LayoutGrid },
  { to: '/candidaturas', label: 'Meus Badges', icon: Medal },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: User },
]

// ===== Sidebar do Talent Manager =====
export const talentNav = [
  { to: '/tm', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tm/candidaturas', label: 'Candidaturas de Badge', icon: ClipboardCheck },
  { to: '/tm/catalogo', label: 'Catálogo de Badges', icon: LayoutGrid },
  { to: '/tm/learning-paths', label: 'Learning Paths', icon: Route },
  { to: '/tm/consultores', label: 'Consultores', icon: Users },
]

// ===== Sidebar do Service Line Leader =====
export const sllNav = [
  { to: '/sll', label: 'Painel de Controlo', icon: LayoutDashboard, end: true },
  { to: '/sll/consultores', label: 'Consultores', icon: Users },
  { to: '/sll/badges', label: 'Badges', icon: Award },
  { to: '/sll/pedidos', label: 'Pedidos', icon: ClipboardCheck },
  { to: '/sll/relatorios', label: 'Relatórios', icon: FileBarChart },
  { to: '/sll/notificacoes', label: 'Notificações', icon: Bell },
]

// ===== Sidebar do Administrador =====
export const adminNav = [
  { to: '/admin', label: 'Painel de Controlo', icon: LayoutDashboard, end: true },
  { to: '/admin/utilizadores', label: 'Utilizadores', icon: Users },
  { to: '/admin/badges', label: 'Badges', icon: Award },
  { to: '/admin/pedidos', label: 'Pedido de Badges', icon: ClipboardCheck },
  { to: '/admin/learning-paths', label: 'Learning Paths', icon: Route },
  { to: '/admin/service-lines', label: 'Service Lines', icon: Network },
  { to: '/admin/areas', label: 'Áreas', icon: Boxes },
  { to: '/admin/niveis', label: 'Níveis', icon: BarChart3 },
  { to: '/admin/requisitos', label: 'Requisitos', icon: ListChecks },
  { to: '/admin/politicas', label: 'Políticas RGPD', icon: ShieldCheck },
  { to: '/admin/avisos', label: 'Avisos', icon: Bell },
  { to: '/admin/informacoes', label: 'Informações', icon: Info },
  { to: '/admin/definicoes', label: 'Definições', icon: Settings },
]

export const ROLE_PANELS = {
  TalentManager: { label: 'Talent Manager', home: '/tm', nav: talentNav },
  ServiceLineLeader: { label: 'Service Line Leader', home: '/sll', nav: sllNav },
  Admin: { label: 'Administrador', home: '/admin', nav: adminNav },
}

export const ROLE_HOME = {
  Consultor: '/',
  TalentManager: '/tm',
  ServiceLineLeader: '/sll',
  Admin: '/admin',
}

export const primaryRole = (user) => (user?.roles && user.roles[0]) || user?.role || 'Consultor'
export const homeForRole = (user) => ROLE_HOME[primaryRole(user)] || '/'

// O painel (sidebar) é escolhido pelo caminho — fácil de pré-visualizar.
export const panelForPath = (pathname = '') => {
  if (pathname.startsWith('/tm')) return ROLE_PANELS.TalentManager
  if (pathname.startsWith('/sll')) return ROLE_PANELS.ServiceLineLeader
  if (pathname.startsWith('/admin')) return ROLE_PANELS.Admin
  return { label: 'Painel', nav: [] }
}
