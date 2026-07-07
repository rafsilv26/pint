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
      <form onSubmit={handleSubmit} className="space-y-5">
        {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
        {mensagem && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensagem}</div>
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
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-full border border-gray-300 px-8 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-50"
          >
            {t('forgotPassword.botoes.voltar')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? t('forgotPassword.botoes.enviando') : t('forgotPassword.botoes.enviar')}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}