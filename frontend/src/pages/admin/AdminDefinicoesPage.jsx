import { useState } from 'react'
import { Clock, Bell, Megaphone, Send, PlayCircle } from 'lucide-react'
import { PageHeader, Card, Toggle, Spinner, ErrorState } from '../../components/ui'
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

const SLA_EQUIPAS = [
  {
    key: 'talent',
    label: 'Talent Manager',
    desc: 'Validam as evidências que os consultores submetem.',
  },
  {
    key: 'serviceline',
    label: 'Service Line Leader',
    desc: 'Aprovam os badges já validados, na sua área.',
  },
]

function SlaManagerCard() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getSlaConfigs())

  const [dias, setDias] = useState({ talent: 5, serviceline: 5 })
  const [carregado, setCarregado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [resumo, setResumo] = useState(null)

  if (data?.efetivo && !carregado) {
    setCarregado(true)
    setDias({
      talent: data.efetivo.talent?.responseDays ?? 5,
      serviceline: data.efetivo.serviceline?.responseDays ?? 5,
    })
  }

  const ajustar = (key, delta) =>
    setDias((d) => ({ ...d, [key]: Math.max(1, Number(d[key] || 1) + delta) }))

  async function guardar() {
    setGuardando(true)
    setErro('')
    setGuardado(false)
    try {
      await Promise.all([
        api.saveSlaTeam('talent', Math.max(1, Number(dias.talent) || 1)),
        api.saveSlaTeam('serviceline', Math.max(1, Number(dias.serviceline) || 1)),
      ])
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
      reload()
    } catch (err) {
      setErro(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function verificar() {
    setVerificando(true)
    setErro('')
    setResumo(null)
    try { setResumo(await api.runSlaCheck()) } catch (err) { setErro(err.message) } finally { setVerificando(false) }
  }

  return (
    <Card className="mt-4">
      <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
        <Clock size={18} className="text-brand" /> {t('adminDefinicoes.sla.titulo', 'Prazos de resposta')}
      </h2>
      <p className="fs-xs text-muted mb-3">
        {t('adminDefinicoes.sla.novoSubtitulo', 'Ao fim de quantos dias um pedido parado gera um alerta (email + notificação) à equipa responsável.')}
      </p>

      {loading ? <Spinner /> : error ? <ErrorState onRetry={reload} /> : (
        <>
          <div className="d-flex flex-column gap-2">
            {SLA_EQUIPAS.map((eq) => (
              <div key={eq.key} className="d-flex align-items-center justify-content-between gap-3 rounded-3 border p-3">
                <div className="min-w-0">
                  <p className="small fw-semibold text-ink mb-0">{eq.label}</p>
                  <p className="fs-xs text-muted mb-0">{eq.desc}</p>
                </div>
                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => ajustar(eq.key, -1)}
                    className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                    aria-label={`Menos um dia (${eq.label})`}
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={dias[eq.key]}
                    onChange={(e) => setDias((d) => ({ ...d, [eq.key]: e.target.value }))}
                    className="form-control form-control-sm text-center"
                    style={{ width: '3.5rem' }}
                    aria-label={`Dias (${eq.label})`}
                  />
                  <button
                    type="button"
                    onClick={() => ajustar(eq.key, 1)}
                    className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                    aria-label={`Mais um dia (${eq.label})`}
                  >+</button>
                  <span className="small text-muted ms-1">{t('adminDefinicoes.sla.unidadeDias', 'dias')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
            <button onClick={guardar} disabled={guardando} className="btn btn-brand btn-sm">
              {guardado
                ? t('adminDefinicoes.sla.guardado', 'Guardado ✓')
                : guardando
                  ? t('adminDefinicoes.sla.aGuardar', 'A guardar…')
                  : t('adminDefinicoes.sla.guardar', 'Guardar prazos')}
            </button>
            <button type="button" onClick={verificar} disabled={verificando} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-2">
              <PlayCircle size={15} /> {verificando ? t('adminDefinicoes.sla.aVerificar') : t('adminDefinicoes.sla.verificar')}
            </button>
          </div>

          {resumo && (
            <p className="mt-2 mb-0 rounded-3 bg-success-subtle text-success-emphasis px-3 py-2 small">
              {t('adminDefinicoes.sla.resumo', {
                tm: resumo.pendentesTalentManager,
                sll: resumo.pendentesServiceLine,
                emails: resumo.emailsEnviados,
              })}
            </p>
          )}
          {erro && <p className="mt-2 mb-0 fs-xs text-danger">{erro}</p>}
        </>
      )}
    </Card>
  )
}

export default function AdminDefinicoesPage() {
  const { t } = useTranslation()
  const { data, loading } = useAsync(() => api.getDefinicoes())

  const [notif, setNotif] = useState({ email: true, push: false, diasExpiracao: 5 })
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [aviso, setAviso] = useState({ title: '', message: '', type: 'info' })
  const [difundindo, setDifundindo] = useState(false)
  const [difResultado, setDifResultado] = useState(null)

  const [definicoesCarregadas, setDefinicoesCarregadas] = useState(null)
  if (data && data !== definicoesCarregadas) {
    setDefinicoesCarregadas(data)
    setNotif({ email: data.emailEnabled !== false, push: Boolean(data.pushEnabled), diasExpiracao: data.daysBefore ?? 5 })
  }

  async function guardar() {
    setGuardando(true)
    try {
      await api.saveDefinicoes({ emailEnabled: notif.email, pushEnabled: notif.push, daysBefore: notif.diasExpiracao })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  async function difundir(e) {
    e.preventDefault()
    if (!aviso.title.trim()) return
    setDifundindo(true)
    setDifResultado(null)
    try {
      const r = await api.difundirAviso({ title: aviso.title.trim(), message: aviso.message.trim(), type: aviso.type })
      setDifResultado({ ok: true, total: r.total ?? 0 })
      setAviso({ title: '', message: '', type: 'info' })
    } catch (err) {
      setDifResultado({ ok: false, erro: err.message })
    } finally {
      setDifundindo(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto" style={{ maxWidth: '46rem' }}>
      <PageHeader title={t('adminDefinicoes.titulo')} subtitle={t('adminDefinicoes.subtitulo')} />

      <Card>
        <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Megaphone size={18} className="text-brand" /> {t('adminDefinicoes.broadcast.titulo')}
        </h2>
        <p className="fs-xs text-muted mb-3">{t('adminDefinicoes.broadcast.subtitulo')}</p>
        <form onSubmit={difundir} className="d-flex flex-column gap-3">
          <div className="row g-3">
            <label className="col-12 col-sm-8">
              <span className="mb-1 d-block small fw-medium text-ink">{t('adminDefinicoes.broadcast.titulo_campo')}</span>
              <input value={aviso.title} onChange={(e) => setAviso({ ...aviso, title: e.target.value })} className="form-control" placeholder={t('adminDefinicoes.broadcast.tituloPlaceholder')} />
            </label>
            <label className="col-12 col-sm-4">
              <span className="mb-1 d-block small fw-medium text-ink">{t('adminDefinicoes.broadcast.tipo')}</span>
              <select value={aviso.type} onChange={(e) => setAviso({ ...aviso, type: e.target.value })} className="form-select">
                <option value="info">{t('adminDefinicoes.broadcast.tipos.info')}</option>
                <option value="warning">{t('adminDefinicoes.broadcast.tipos.warning')}</option>
                <option value="success">{t('adminDefinicoes.broadcast.tipos.success')}</option>
              </select>
            </label>
          </div>
          <label className="d-block">
            <span className="mb-1 d-block small fw-medium text-ink">{t('adminDefinicoes.broadcast.mensagem')}</span>
            <textarea rows={2} value={aviso.message} onChange={(e) => setAviso({ ...aviso, message: e.target.value })} className="form-control" placeholder={t('adminDefinicoes.broadcast.mensagemPlaceholder')} />
          </label>
          {difResultado && (
            <p className={`rounded-3 px-3 py-2 small mb-0 ${difResultado.ok ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger'}`}>
              {difResultado.ok ? t('adminDefinicoes.broadcast.enviado', { total: difResultado.total }) : difResultado.erro}
            </p>
          )}
          <button type="submit" disabled={difundindo || !aviso.title.trim()} className="btn btn-brand align-self-start d-inline-flex align-items-center gap-2">
            <Send size={16} /> {difundindo ? t('adminDefinicoes.broadcast.aEnviar') : t('adminDefinicoes.broadcast.enviar')}
          </button>
        </form>
      </Card>

      <SlaManagerCard />

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
        <label className="d-block py-3">
          <span className="mb-1 d-block small fw-medium text-ink">{t('adminDefinicoes.notificacoes.diasExpiracao')}</span>
          <span className="mb-2 d-block fs-xs text-muted">{t('adminDefinicoes.notificacoes.diasExpiracaoDesc')}</span>
          <input type="number" min={1} value={notif.diasExpiracao} onChange={(e) => setNotif({ ...notif, diasExpiracao: Number(e.target.value) })} className="form-control" style={{ width: '8rem' }} />
        </label>
      </Card>

      <button onClick={guardar} disabled={guardando} className="mt-4 btn btn-brand w-100 py-2 fw-semibold">
        {guardado ? t('adminDefinicoes.botoes.guardado') : t('adminDefinicoes.botoes.guardar')}
      </button>
    </div>
  )
}
