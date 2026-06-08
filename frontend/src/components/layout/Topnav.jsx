import { NavLink } from 'react-router-dom'
import { navItems } from '../../config/navigation'
import Logo from '../Logo'

// Navbar horizontal de topo (gradiente azul Softinsa).
export default function Topnav() {
  return (
    <header className="bg-gradient-to-r from-brand-dark via-brand to-brand-accent text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <NavLink to="/" className="flex items-center">
          <Logo className="h-7 w-auto" textClassName="text-xl" />
        </NavLink>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
