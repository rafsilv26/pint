import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se o utilizador não tiver permissão para esta área, volta à segurança do Dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace /> 
  }

  return <Outlet />
}