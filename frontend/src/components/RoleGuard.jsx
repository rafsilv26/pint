import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 1. Garantir que capturamos o perfil corretamente (e tudo em minúsculas para evitar erros de 'Admin' vs 'admin')
  // ALERTA: Se o teu backend envia o perfil com outro nome (ex: user.tipo), muda aqui!
  const userRole = user?.role ? String(user.role).toLowerCase() : 'desconhecido'

  // 2. Se o utilizador não tiver permissão para a página atual...
  if (!allowedRoles.includes(userRole)) {
    
    // Descobrimos a "casa" dele
    let fallback = '/' 
    if (userRole === 'admin') fallback = '/admin'
    else if (userRole === 'tm') fallback = '/tm'
    else if (userRole === 'sll') fallback = '/sll'

    // TRAVÃO DE SEGURANÇA: Se a página para onde o vamos mandar é a mesma onde já estamos, 
    // paramos o redirecionamento e mostramos o erro para não encravar o browser!
    if (location.pathname === fallback || fallback === '/') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-red-600">{t('roleGuard.acessoNegado')}</h1>
            <p className="mt-4 text-gray-600">
              {t('roleGuard.aTentarAceder')} <strong>{location.pathname}</strong>
            </p>
            <p className="mt-2 text-gray-600">
              {t('roleGuard.perfilAtual')} <strong className="text-brand">{userRole}</strong>
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {t('roleGuard.perfisPermitidos', { perfis: allowedRoles.join(', ') })}
            </p>
          </div>
        </div>
      )
    }

    // Se estiver tudo bem, redireciona em segurança
    return <Navigate to={fallback} replace /> 
  }

  return <Outlet />
}