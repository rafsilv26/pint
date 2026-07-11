import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../../components/layout/AuthShell'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Confirmação do endereço de email (link do email de boas-vindas).
// O link tem o formato /confirmar-email?token=<token>.
export default function ConfirmarEmailPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState(token ? 'a-confirmar' : 'sem-token')
  const [mensagem, setMensagem] = useState(null)

  useEffect(() => {
    if (!token) return
    api.confirmarEmail({ token })
      .then((res) => {
        setMensagem(res?.message || t('confirmarEmail.sucesso'))
        setEstado('confirmado')
      })
      .catch((err) => {
        setMensagem(err.message)
        setEstado('erro')
      })
  }, [token, t])

  return (
    <AuthShell
      title={t('confirmarEmail.titulo')}
      subtitle={t('confirmarEmail.subtitulo')}
    >
      <div className="d-flex flex-column gap-4 text-center">
        {estado === 'a-confirmar' && (
          <div className="rounded-3 bg-brand-light px-3 py-2 small text-brand">{t('confirmarEmail.aConfirmar')}</div>
        )}
        {estado === 'confirmado' && (
          <div className="rounded-3 bg-success-subtle px-3 py-2 small text-success">{mensagem}</div>
        )}
        {(estado === 'erro' || estado === 'sem-token') && (
          <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">
            {estado === 'sem-token' ? t('confirmarEmail.semToken') : mensagem}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="btn btn-brand rounded-pill px-5 py-2 fw-semibold mx-auto"
        >
          {t('confirmarEmail.irParaLogin')}
        </button>
      </div>
    </AuthShell>
  )
}
