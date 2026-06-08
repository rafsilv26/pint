import { Outlet } from 'react-router-dom'
import Topnav from './Topnav'

// Estrutura das páginas privadas: navbar de topo + conteúdo centrado.
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Topnav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
