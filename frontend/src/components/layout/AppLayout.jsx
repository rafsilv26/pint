import { Outlet } from 'react-router-dom'
import Topnav from './Topnav'
import { useAuth } from '../../context/useAuth'
import ChangePasswordModal from '../ChangePasswordModal'
import RgpdPolicyModal from '../RgpdPolicyModal'

// Estrutura das páginas privadas: navbar de topo + conteúdo centrado.
// No primeiro acesso (mustChangePassword) mostra um pop-up que bloqueia a app.
// Depois disso, se houver políticas RGPD obrigatórias por aceitar, bloqueia
// novamente até estarem todas aceites — o consultor não entra sem aceitar.
export default function AppLayout() {
  const { user } = useAuth()
  const pendingPolicies = user?.pendingPolicies || []
  const bloqueadoPassword = Boolean(user?.mustChangePassword)
  const bloqueadoRgpd = !bloqueadoPassword && pendingPolicies.length > 0
  const bloqueado = bloqueadoPassword || bloqueadoRgpd

  return (
    <div className="min-vh-100">
      <Topnav />
      <main className="container-xxl px-4 py-4 py-md-5">
        {bloqueado ? null : <Outlet />}
      </main>
      {bloqueadoPassword && <ChangePasswordModal />}
      {bloqueadoRgpd && <RgpdPolicyModal policies={pendingPolicies} />}
    </div>
  )
}
