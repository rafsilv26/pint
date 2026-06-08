import { Home, LayoutGrid, Medal, Trophy, User } from 'lucide-react'

// Itens da navbar de topo (perfil Consultor) — segue o design web do Figma.
export const navItems = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/catalogo', label: 'Catálogo de Badges', icon: LayoutGrid },
  { to: '/candidaturas', label: 'Meus Badges', icon: Medal },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: User },
]
