import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useTranslation } from 'react-i18next'

// Botão de terminar sessão com confirmação (guião: "Pretende terminar a sua
// sessão?" + possibilidade de cancelar).
export default function LogoutButton({ className = '', children }) {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmar, setConfirmar] = useState(false)

  function terminar() {
    setConfirmar(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <button type="button" onClick={() => setConfirmar(true)} className={className}>
        <LogOut size={16} /> {children || t('logout.terminar')}
      </button>

      {confirmar && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-100 rounded-4 bg-white p-4 text-center shadow-lg" style={{ maxWidth: '24rem' }}>
            <div className="avatar-circle mx-auto" style={{ height: '3rem', width: '3rem' }}>
              <LogOut size={20} />
            </div>
            <p className="mt-3 fw-semibold text-ink mb-0">{t('logout.pergunta')}</p>
            <div className="mt-4 d-flex justify-content-center gap-2">
              <button onClick={() => setConfirmar(false)} className="btn btn-outline-secondary bg-white px-4">
                {t('logout.cancelar')}
              </button>
              <button onClick={terminar} className="btn btn-danger px-4 fw-semibold">
                {t('logout.terminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
