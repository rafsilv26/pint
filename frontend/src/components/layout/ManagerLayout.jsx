import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getPanelForPath } from '../../config/navigation' // <-- Import da função atualizada
import Logo from '../Logo'
import ChangePasswordModal from '../ChangePasswordModal'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Layout dos painéis de gestão (Admin / Talent Manager / Service Line Leader):
// sidebar azul à esquerda + barra de pesquisa no topo + conteúdo.
export default function ManagerLayout() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const bloqueado = Boolean(user?.mustChangePassword)

  // Obter o painel dinâmico já com os labels traduzidos
  const panel = getPanelForPath(location.pathname, t)
  const base = '/' + (location.pathname.split('/')[1] || '')

  const iniciais = (user?.nome || 'U')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="d-none d-md-flex flex-shrink-0 flex-column bg-gradient-brand text-white"
        style={{ width: '16rem' }}
      >
        <div className="px-4 py-4">
          <Logo height={28} />
          <p className="mt-1 mb-0 small text-white-50">{panel.label}</p>
        </div>

        <nav className="flex-grow-1 d-flex flex-column gap-1 px-2 py-2">
          {panel.nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `d-flex align-items-center gap-2 rounded-3 px-3 py-2 small fw-medium text-decoration-none ${
                  isActive ? 'bg-white text-brand shadow-sm' : 'text-white-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-top border-white border-opacity-10 px-2 py-3">
          <NavLink
            to={`${base}/conta`}
            className="d-flex align-items-center gap-2 rounded-3 px-2 py-2 text-decoration-none text-white"
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25 small fw-semibold flex-shrink-0"
              style={{ height: '2.25rem', width: '2.25rem' }}
            >
              {iniciais}
            </div>
            <div className="flex-grow-1 min-w-0">
              <p className="text-truncate small fw-semibold mb-0">{user?.nome}</p>
              <p className="text-truncate small text-white-50 mb-0">{panel.label}</p>
            </div>
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="btn btn-link d-flex align-items-center gap-2 w-100 mt-1 px-2 py-2 small text-white-50 text-decoration-none"
          >
            <LogOut size={18} /> {t('managerLayout.terminarSessao')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="d-flex flex-grow-1 flex-column overflow-hidden">
        <header
          className="d-flex flex-shrink-0 align-items-center gap-3 border-bottom bg-white px-4"
          style={{ height: '4rem' }}
        >
          <div className="position-relative w-100" style={{ maxWidth: '28rem' }}>
            <Search
              size={18}
              className="position-absolute text-secondary"
              style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              placeholder={t('managerLayout.procurar')}
              className="form-control rounded-pill ps-5"
            />
          </div>
        </header>
        <main className="flex-grow-1 overflow-y-auto p-4 p-lg-5">
          {bloqueado ? null : <Outlet />}
        </main>
      </div>

      {bloqueado && <ChangePasswordModal />}
    </div>
  )
}
