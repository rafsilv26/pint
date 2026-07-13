import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTranslation } from 'react-i18next'

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center text-muted">{t('protectedRoute.carregando')}</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
