import { Outlet } from 'react-router-dom'
import Topnav from './Topnav'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../ChangePasswordModal'

// Estrutura das páginas privadas: navbar de topo + conteúdo centrado.
// No primeiro acesso (mustChangePassword) mostra um pop-up que bloqueia a app.
export default function AppLayout() {
  const { user } = useAuth()
  const bloqueado = Boolean(user?.mustChangePassword)

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Topnav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {bloqueado ? null : <Outlet />}
      </main>
      {bloqueado && <ChangePasswordModal />}
    </div>
  )
}
