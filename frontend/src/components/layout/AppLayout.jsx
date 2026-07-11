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
    <div className="min-vh-100">
      <Topnav />
      <main className="container-xxl px-4 py-4 py-md-5">
        {bloqueado ? null : <Outlet />}
      </main>
      {bloqueado && <ChangePasswordModal />}
    </div>
  )
}
