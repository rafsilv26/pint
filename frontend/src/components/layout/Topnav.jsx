import { NavLink } from 'react-router-dom'
import { getNavItems } from '../../config/navigation'
import Logo from '../Logo'
import NotificationsBell from '../NotificationsBell'
import { useTranslation } from 'react-i18next'

export default function Topnav() {
  const { t } = useTranslation()
  const navItems = getNavItems(t)

  return (
    <header className="bg-gradient-brand text-white shadow-sm">
      <div
        className="container-xxl d-flex align-items-center justify-content-between gap-3 px-4"
        style={{ height: '4rem' }}
      >
        <NavLink to="/" className="d-flex align-items-center text-decoration-none">
          <Logo height={28} textClassName="fs-4" />
        </NavLink>

        <div className="d-flex align-items-center gap-1">
          <nav className="d-flex align-items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `d-flex align-items-center gap-2 rounded-pill px-3 py-2 small fw-medium text-decoration-none ${
                    isActive ? 'bg-white bg-opacity-25 text-white' : 'text-white-50'
                  }`
                }
              >
                <Icon size={16} />
                <span className="d-none d-lg-inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <NotificationsBell />
        </div>
      </div>
    </header>
  )
}
