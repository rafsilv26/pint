import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Field } from './ui'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Pop-up de primeira-troca de password (mostrado por cima da app quando
// mustChangePassword está ativo). Bloqueia a app até estar trocada.
export default function ChangePasswordModal() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const { markPasswordChanged, logout } = useAuth()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    
    // Validações traduzidas
    if (nova.length < 8) return setErro(t('changePasswordModal.erros.comprimento'))
    if (nova !== confirmar) return setErro(t('changePasswordModal.erros.coincidem'))
    
    setLoading(true)
    try {
      await api.changePassword({ currentPassword: atual, newPassword: nova })
      markPasswordChanged()
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-light text-brand">
            <Lock size={18} />
          </div>
          <h2 className="text-lg font-bold text-ink">{t('changePasswordModal.titulo')}</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          {t('changePasswordModal.descricao')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
          <Field
            label={t('changePasswordModal.campos.atualLabel')}
            type="password"
            icon={Lock}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            placeholder={t('changePasswordModal.campos.atualPlaceholder')}
            required
          />
          <Field
            label={t('changePasswordModal.campos.novaLabel')}
            type="password"
            icon={Lock}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            hint={t('changePasswordModal.campos.novaHint')}
            required
          />
          <Field
            label={t('changePasswordModal.campos.confirmarLabel')}
            type="password"
            icon={Lock}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? t('changePasswordModal.botoes.guardando') : t('changePasswordModal.botoes.guardar')}
          </button>
        </form>

        <button
          onClick={() => { logout(); navigate('/login') }}
          className="mt-3 w-full text-center text-sm text-muted transition hover:text-brand"
        >
          {t('changePasswordModal.botoes.sair')}
        </button>
      </div>
    </div>
  )
}