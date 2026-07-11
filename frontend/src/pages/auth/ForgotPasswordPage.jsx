import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function ForgotPasswordPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState(null)
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    setLoading(true)
    try {
      const res = await api.recuperarPassword({ email })
      setMensagem(res.message) // Nota: Se a API devolver a mensagem fixa, podes querer traduzi-la no backend ou usar uma chave aqui
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('forgotPassword.titulo')}
      subtitle={t('forgotPassword.subtitulo')}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}
        {mensagem && (
          <div className="rounded-3 bg-success-subtle px-3 py-2 small text-success">{mensagem}</div>
        )}
        <Field
          label={t('forgotPassword.campos.emailLabel')}
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('forgotPassword.campos.emailPlaceholder')}
          required
        />
        <div className="d-flex justify-content-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-outline-secondary bg-white rounded-pill px-4 py-2 fw-semibold"
          >
            {t('forgotPassword.botoes.voltar')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-brand rounded-pill px-4 py-2 fw-semibold"
          >
            {loading ? t('forgotPassword.botoes.enviando') : t('forgotPassword.botoes.enviar')}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
