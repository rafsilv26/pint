import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Bloqueia rotas privadas: se não houver sessão, redireciona para /login.
export default function ProtectedRoute({ children }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="grid h-screen place-items-center text-muted">{t('protectedRoute.carregando')}</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}