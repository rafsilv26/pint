import { useState, useEffect } from 'react'
import { Clock, Bell, Mail, CheckCircle2, XCircle, Send, PlugZap } from 'lucide-react'
import { PageHeader, Card, Toggle, Spinner } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 border-bottom py-3">
      <div className="min-w-0">
        <p className="small fw-medium text-ink mb-0">{label}</p>
        {desc && <p className="fs-xs text-muted mb-0">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function AdminDefinicoesPage() {
  const { t } = useTranslation()
  const { data, loading } = useAsync(() => api.getDefinicoes())
  const [sla, setSla] = useState({ dias: 5, alertas: true })
  const [notif, setNotif] = useState({ email: true, push: false })
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Diagnóstico de email
  const [emailState, setEmailState] = useState({ loading: false, ligacao: null, envio: null, erro: null })

  useEffect(() => {
    if (data) {
      setSla((s) => ({ ...s, dias: data.daysBefore ?? s.dias }))
      setNotif({ email: data.emailEnabled !== false, push: Boolean(data.pushEnabled) })
    }
  }, [data])

  async function guardar() {
    setGuardando(true)
    try {
      await api.saveDefinicoes({ emailEnabled: notif.email, pushEnabled: notif.push, daysBefore: sla.dias })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  async function testarEmail(enviar) {
    setEmailState({ loading: true, ligacao: null, envio: null, erro: null })
    try {
      const r = await api.getEmailStatus(enviar)
      setEmailState({ loading: false, ligacao: r.ligacao, envio: r.envioTeste, erro: null })
    } catch (err) {
      const detalhe = err.response?.data
      setEmailState({ loading: false, ligacao: detalhe?.ligacao || { ok: false }, envio: detalhe?.envioTeste || null, erro: detalhe?.ligacao?.erro || err.message })
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto" style={{ maxWidth: '44rem' }}>
      <PageHeader title={t('adminDefinicoes.titulo')} subtitle={t('adminDefinicoes.subtitulo')} />

      {/* SLA */}
      <Card>
        <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Clock size={18} className="text-brand" /> {t('adminDefinicoes.sla.titulo')}
        </h2>
        <p className="fs-xs text-muted mb-2">{t('adminDefinicoes.sla.subtitulo')}</p>
        <label className="d-block py-3">
          <span className="mb-2 d-block small fw-medium text-ink">{t('adminDefinicoes.sla.dias')}</span>
          <input
            type="number" min={1}
            value={sla.dias}
            onChange={(e) => setSla({ ...sla, dias: Number(e.target.value) })}
            className="form-control"
            style={{ width: '8rem' }}
          />
        </label>
        <ToggleRow
          label={t('adminDefinicoes.sla.alertasLabel')}
          desc={t('adminDefinicoes.sla.alertasDesc')}
          checked={sla.alertas}
          onChange={(v) => setSla({ ...sla, alertas: v })}
        />
      </Card>

      {/* Notificações */}
      <Card className="mt-4">
        <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Bell size={18} className="text-brand" /> {t('adminDefinicoes.notificacoes.titulo')}
        </h2>
        <p className="fs-xs text-muted mb-2">{t('adminDefinicoes.notificacoes.subtitulo')}</p>
        <ToggleRow
          label={t('adminDefinicoes.notificacoes.email')}
          desc={t('adminDefinicoes.notificacoes.emailDesc')}
          checked={notif.email}
          onChange={(v) => setNotif({ ...notif, email: v })}
        />
        <ToggleRow
          label={t('adminDefinicoes.notificacoes.push')}
          desc={t('adminDefinicoes.notificacoes.pushDesc')}
          checked={notif.push}
          onChange={(v) => setNotif({ ...notif, push: v })}
        />
      </Card>

      <button onClick={guardar} disabled={guardando} className="mt-4 btn btn-brand w-100 py-2 fw-semibold">
        {guardado ? t('adminDefinicoes.botoes.guardado') : t('adminDefinicoes.botoes.guardar')}
      </button>

      {/* Diagnóstico de email */}
      <Card className="mt-4">
        <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Mail size={18} className="text-brand" /> {t('adminDefinicoes.email.titulo')}
        </h2>
        <p className="fs-xs text-muted mb-3">{t('adminDefinicoes.email.subtitulo')}</p>

        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => testarEmail(false)} disabled={emailState.loading} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-2">
            <PlugZap size={15} /> {t('adminDefinicoes.email.verificar')}
          </button>
          <button onClick={() => testarEmail(true)} disabled={emailState.loading} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-2">
            <Send size={15} /> {t('adminDefinicoes.email.enviarTeste')}
          </button>
        </div>

        {emailState.loading && <p className="mt-3 mb-0 small text-muted">{t('adminDefinicoes.email.aVerificar')}</p>}

        {emailState.ligacao && (
          <div className={`mt-3 rounded-3 px-3 py-2 small d-flex align-items-center gap-2 ${emailState.ligacao.ok ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger'}`}>
            {emailState.ligacao.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {emailState.ligacao.ok
              ? t('adminDefinicoes.email.ligacaoOk', { modo: emailState.ligacao.modo || '—' })
              : t('adminDefinicoes.email.ligacaoErro', { erro: emailState.erro || '—' })}
          </div>
        )}

        {emailState.envio && (
          <div className={`mt-2 rounded-3 px-3 py-2 small d-flex align-items-center gap-2 ${emailState.envio.ok ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger'}`}>
            {emailState.envio.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {emailState.envio.ok
              ? t('adminDefinicoes.email.envioOk', { para: emailState.envio.para || '—' })
              : t('adminDefinicoes.email.envioErro', { erro: emailState.envio.erro || '—' })}
          </div>
        )}
      </Card>
    </div>
  )
}
