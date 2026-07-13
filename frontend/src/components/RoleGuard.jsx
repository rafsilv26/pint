import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth'
import { roleShortCode } from '../config/navigation'

export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role ? roleShortCode(user.role) : 'desconhecido'

  if (!allowedRoles.includes(userRole)) {

    let fallback = '/'
    if (userRole === 'admin') fallback = '/admin'
    else if (userRole === 'tm') fallback = '/tm'
    else if (userRole === 'sll') fallback = '/sll'

    if (location.pathname === fallback || fallback === '/') {
      return (
        <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light p-4 text-center">
          <div className="rounded-4 bg-white p-5 shadow" style={{ maxWidth: '28rem' }}>
            <h1 className="h3 fw-bold text-danger">{t('roleGuard.acessoNegado')}</h1>
            <p className="mt-4 text-secondary">
              {t('roleGuard.aTentarAceder')} <strong>{location.pathname}</strong>
            </p>
            <p className="mt-2 text-secondary">
              {t('roleGuard.perfilAtual')} <strong className="text-brand">{userRole}</strong>
            </p>
            <p className="mt-2 small text-secondary">
              {t('roleGuard.perfisPermitidos', { perfis: allowedRoles.join(', ') })}
            </p>
          </div>
        </div>
      )
    }

    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
