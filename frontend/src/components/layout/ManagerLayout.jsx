import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { panelForPath } from '../../config/navigation'
import Logo from '../Logo'
import ChangePasswordModal from '../ChangePasswordModal'

// Layout dos painéis de gestão (Admin / Talent Manager / Service Line Leader):
// sidebar azul à esquerda + barra de pesquisa no topo + conteúdo.
export default function ManagerLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const bloqueado = Boolean(user?.mustChangePassword)
  const panel = panelForPath(location.pathname)
  const base = '/' + (location.pathname.split('/')[1] || '')

  const iniciais = (user?.nome || 'U')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-brand-dark via-brand to-brand-accent text-white md:flex">
        <div className="px-6 py-5">
          <Logo className="h-7 w-auto" />
          <p className="mt-1 text-xs text-white/60">{panel.label}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {panel.nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-white text-brand shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <NavLink to={`${base}/conta`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/10">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm font-semibold">{iniciais}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.nome}</p>
              <p className="truncate text-xs text-white/60">{panel.label}</p>
            </div>
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            <LogOut size={18} /> Terminar sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Procurar…"
              className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {bloqueado ? null : <Outlet />}
        </main>
      </div>

      {bloqueado && <ChangePasswordModal />}
    </div>
  )
}
