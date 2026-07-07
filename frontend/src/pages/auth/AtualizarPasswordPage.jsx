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
      <form onSubmit={handleSubmit} className="space-y-5">
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
          className="mx-auto block rounded-full bg-brand px-12 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? t('atualizarPassword.botoes.guardando') : t('atualizarPassword.botoes.entrar')}
        </button>
      </form>
    </AuthShell>
  )
}