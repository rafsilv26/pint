import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Definir nova password (após link de recuperação).
export default function AtualizarPasswordPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/login'), 900)
  }

  return (
    <AuthShell
      title={t('atualizarPassword.titulo')}
      subtitle={t('atualizarPassword.subtitulo')}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        <Field
          label={t('atualizarPassword.campos.passwordLabel')}
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('atualizarPassword.campos.passwordPlaceholder')}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-brand rounded-pill px-5 py-2 fw-semibold mx-auto"
        >
          {loading ? t('atualizarPassword.botoes.guardando') : t('atualizarPassword.botoes.entrar')}
        </button>
      </form>
    </AuthShell>
  )
}
