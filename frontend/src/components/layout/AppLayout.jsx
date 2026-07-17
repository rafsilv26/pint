import { Outlet } from 'react-router-dom'
import Topnav from './Topnav'
import { useAuth } from '../../context/useAuth'
import ChangePasswordModal from '../ChangePasswordModal'
import RgpdPolicyModal from '../RgpdPolicyModal'

export default function AppLayout() {
  const { user } = useAuth()
  const pendingPolicies = user?.pendingPolicies || []
  const bloqueadoPassword = Boolean(user?.mustChangePassword)
  // Só as políticas OBRIGATÓRIAS bloqueiam a app. As não obrigatórias aparecem
  // no modal (para o utilizador ver) mas podem ser fechadas sem bloquear.
  const temObrigatoria = pendingPolicies.some((p) => p.mandatory !== false)
  const bloqueadoRgpd = !bloqueadoPassword && temObrigatoria
  const mostrarRgpd = !bloqueadoPassword && pendingPolicies.length > 0
  const bloqueado = bloqueadoPassword || bloqueadoRgpd

  return (
    <div className="min-vh-100">
      <Topnav />
      <main className="container-xxl px-4 py-4 py-md-5">
        {bloqueado ? null : <Outlet />}
      </main>
      {bloqueadoPassword && <ChangePasswordModal />}
      {mostrarRgpd && <RgpdPolicyModal key={pendingPolicies[0]?.policyId} policies={pendingPolicies} />}
    </div>
  )
}
