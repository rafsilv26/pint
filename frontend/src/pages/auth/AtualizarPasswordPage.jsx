import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function AtualizarPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)

    if (password.length < 8) {
      setErro(t('atualizarPassword.erros.minimoCaracteres'))
      return
    }
    if (password !== confirmar) {
      setErro(t('atualizarPassword.erros.naoCoincidem'))
      return
    }

    setLoading(true)
    try {
      const res = await api.resetPassword({ token, novaPassword: password })
      setMensagem(res?.message || t('atualizarPassword.sucesso'))
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title={t('atualizarPassword.titulo')}
        subtitle={t('atualizarPassword.subtitulo')}
      >
        <div className="d-flex flex-column gap-4 text-center">
          <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">
            {t('atualizarPassword.erros.semToken')}
          </div>
          <button
            type="button"
            onClick={() => navigate('/recuperar-password')}
            className="btn btn-brand rounded-pill px-5 py-2 fw-semibold mx-auto"
          >
            {t('atualizarPassword.botoes.pedirNovoLink')}
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('atualizarPassword.titulo')}
      subtitle={t('atualizarPassword.subtitulo')}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}
        {mensagem && (
          <div className="rounded-3 bg-success-subtle px-3 py-2 small text-success">{mensagem}</div>
        )}
        <Field
          label={t('atualizarPassword.campos.passwordLabel')}
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('atualizarPassword.campos.passwordPlaceholder')}
          required
        />
        <Field
          label={t('atualizarPassword.campos.confirmarLabel')}
          type="password"
          icon={Lock}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder={t('atualizarPassword.campos.confirmarPlaceholder')}
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
