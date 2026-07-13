import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle2, Info } from 'lucide-react'
import { Card, Field, Button } from '../components/ui'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = location.pathname.startsWith('/tm')
    ? '/tm/conta'
    : location.pathname.startsWith('/admin')
      ? '/admin/conta'
      : '/perfil'
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const REGRAS = [
    t('mudarPassword.regras.minimo'),
    t('mudarPassword.regras.maiuscula'),
    t('mudarPassword.regras.numero'),
    t('mudarPassword.regras.especial'),
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (nova.length < 8) return setErro(t('mudarPassword.erroComprimento'))
    if (nova !== confirmar) return setErro(t('mudarPassword.erroCoincidem'))

    try {
      await api.changePassword({ currentPassword: atual, newPassword: nova })
      setSucesso(true)
      setTimeout(() => navigate(backTo), 1500)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '36rem' }}>
      <Link to={backTo} className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('mudarPassword.voltar')}
      </Link>

      <div className="mb-4">
        <h1 className="d-flex align-items-center gap-2 fs-2 fw-bold text-ink">
          <KeyRound className="text-brand" /> {t('mudarPassword.titulo')}
        </h1>
        <p className="mt-1 small text-muted">{t('mudarPassword.subtitulo')}</p>
      </div>

      <Card>
        {sucesso ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={44} className="mx-auto text-success" />
            <p className="mt-3 fw-semibold text-ink">{t('mudarPassword.sucesso')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}

            <Field label={t('mudarPassword.atual')} type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
            <Field label={t('mudarPassword.nova')} type="password" value={nova} onChange={(e) => setNova(e.target.value)} required />
            <Field label={t('mudarPassword.confirmar')} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />

            <div className="rounded-3 bg-brand-light p-3">
              <p className="d-flex align-items-center gap-2 small fw-semibold text-ink mb-0">
                <Info size={15} className="text-brand" /> {t('mudarPassword.boasPraticas')}
              </p>
              <ul className="mt-2 mb-0 fs-xs text-muted" style={{ paddingLeft: '1.1rem' }}>
                {REGRAS.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <Button type="submit" className="w-100">{t('mudarPassword.botao')}</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
