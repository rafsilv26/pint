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
        `relative rounded-full p-2 transition ${
          isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`
      }
      aria-label={t('notificationsBell.ariaLabel')}
    >
      <Bell size={18} />
      {naoLidas > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {naoLidas > 9 ? '9+' : naoLidas}
        </span>
      )}
    </NavLink>
  )
}