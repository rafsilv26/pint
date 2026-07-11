import { NavLink } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Sino de notificações na navbar, com contador de não lidas.
export default function NotificationsBell() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data } = useAsync(() => api.getNotificacoes().catch(() => []))
  const naoLidas = (data || []).filter((n) => !n.lida).length

  return (
    <NavLink
      to="/notificacoes"
      className={({ isActive }) =>
        `position-relative rounded-circle p-2 text-decoration-none ${
          isActive ? 'bg-white bg-opacity-25 text-white' : 'text-white-50'
        }`
      }
      aria-label={t('notificationsBell.ariaLabel')}
    >
      <Bell size={18} />
      {naoLidas > 0 && (
        <span
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          style={{ fontSize: '0.625rem' }}
        >
          {naoLidas > 9 ? '9+' : naoLidas}
        </span>
      )}
    </NavLink>
  )
}