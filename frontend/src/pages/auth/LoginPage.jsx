import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { homeForRole } from '../../config/navigation'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function LoginPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      const u = await login({ email, password })
      navigate(homeForRole(u), { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('login.titulo')}
      subtitle={t('login.subtitulo')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>
        )}
        <Field
          label={t('login.campos.emailLabel')}
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.campos.emailPlaceholder')}
          required
        />
        <Field
          label={t('login.campos.passwordLabel')}
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.campos.passwordPlaceholder')}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="rounded border-gray-300 text-brand focus:ring-brand" />
            {t('login.lembrarMe')}
          </label>
          <Link to="/recuperar-password" className="text-brand hover:underline">
            {t('login.esqueceuPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mx-auto block rounded-full bg-brand px-12 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('login.botoes.entrando') : t('login.botoes.entrar')}
        </button>
      </form>
    </AuthShell>
  )
}