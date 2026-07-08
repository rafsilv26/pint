import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se o utilizador não tiver permissão para a página atual...
  if (!allowedRoles.includes(user.role)) {
    
    // ...descobrimos qual é a "página inicial" correta para o perfil dele
    let fallback = '/' // Por defeito (Consultor) vai para a raiz
    
    if (user.role === 'admin') {
      fallback = '/admin'
    } else if (user.role === 'tm') {
      fallback = '/tm'
    } else if (user.role === 'sll') {
      fallback = '/sll'
    }

    // E redirecionamos para lá!
    return <Navigate to={fallback} replace /> 
  }

  // Se tiver permissão, deixa passar
  return <Outlet />
}