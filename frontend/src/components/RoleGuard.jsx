import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Este componente recebe uma lista de perfis permitidos (ex: ['admin', 'tm'])
export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth()

  // 1. Se não houver utilizador, manda para o login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 2. Se o utilizador não tiver um dos perfis permitidos, redireciona
  // Nota: Ajusta "user.role" ou "user.tipo" dependendo de como guardas o perfil do utilizador na tua base de dados
  if (!allowedRoles.includes(user.role)) {
    // Redireciona para uma página de "Acesso Negado" ou para a página inicial do perfil dele
    return <Navigate to="/" replace /> 
  }

  // 3. Se estiver tudo bem, carrega a página que ele pediu (Outlet)
  return <Outlet />
}