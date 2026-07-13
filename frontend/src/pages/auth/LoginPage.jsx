import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import { useAuth } from '../../context/useAuth'
import { homeForRole } from '../../config/navigation'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function LoginPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setTentou(true)
    setErro(null)
    if (!email || !password) return
    setLoading(true)
    try {
      const u = await login({ email, password }, lembrar)
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
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {erro && (
          <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>
        )}
        <Field
          label={t('login.campos.emailLabel')}
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.campos.emailPlaceholder')}
          required
          invalid={tentou && !email}
        />
        <Field
          label={t('login.campos.passwordLabel')}
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.campos.passwordPlaceholder')}
          required
          invalid={tentou && !password}
          trailing={
            <button
              type="button"
              className="input-group-text bg-white"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? t('login.campos.ocultarPassword') : t('login.campos.mostrarPassword')}
              title={showPassword ? t('login.campos.ocultarPassword') : t('login.campos.mostrarPassword')}
            >
              {showPassword
                ? <EyeOff size={16} className="text-secondary" />
                : <Eye size={16} className="text-secondary" />}
            </button>
          }
        />

        <div className="d-flex align-items-center justify-content-between small">
          <label className="form-check d-flex align-items-center gap-2 text-muted mb-0">
            <input type="checkbox" className="form-check-input" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
            {t('login.lembrarMe')}
          </label>
          <Link to="/recuperar-password" className="text-brand text-decoration-none">
            {t('login.esqueceuPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-brand rounded-pill px-5 py-2 fw-semibold mx-auto"
        >
          {loading ? t('login.botoes.entrando') : t('login.botoes.entrar')}
        </button>
      </form>
    </AuthShell>
  )
}
