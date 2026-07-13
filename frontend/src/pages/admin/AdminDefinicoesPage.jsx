import { useState, useEffect } from 'react'
import { Clock, Bell, Megaphone, Users, Award, ClipboardCheck, Layers, Send } from 'lucide-react'
import { PageHeader, Card, Toggle, Spinner } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

const KPI_ICONS = [Users, Award, ClipboardCheck, Layers]

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
  const { data: painel } = useAsync(() => api.getAdminDashboard().catch(() => null))

  const [sla, setSla] = useState({ dias: 5, alertas: true })
  const [notif, setNotif] = useState({ email: true, push: false })
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [aviso, setAviso] = useState({ title: '', message: '', type: 'info' })
  const [difundindo, setDifundindo] = useState(false)
  const [difResultado, setDifResultado] = useState(null)

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

  const kpis = painel?.stats || []

  return (
    <div className="mx-auto" style={{ maxWidth: '46rem' }}>
      <PageHeader title={t('adminDefinicoes.titulo')} subtitle={t('adminDefinicoes.subtitulo')} />

      {kpis.length > 0 && (
        <div className="row row-cols-2 row-cols-lg-4 g-3 mb-4">
          {kpis.map((s, i) => {
            const Icon = KPI_ICONS[i] || Award
            return (
              <div className="col" key={s.label}>
                <Card className="h-100">
                  <Icon size={18} className="text-brand" />
                  <p className="fs-3 fw-bold text-ink mb-0 mt-2">{s.value}</p>
                  <p className="fs-xs text-muted mb-0">{s.label}</p>
                </Card>
              </div>
            )
          })}
        </div>
      )}

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

      <Card className="mt-4">
        <h2 className="mb-1 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Clock size={18} className="text-brand" /> {t('adminDefinicoes.sla.titulo')}
        </h2>
        <p className="fs-xs text-muted mb-2">{t('adminDefinicoes.sla.subtitulo')}</p>
        <label className="d-block py-3">
          <span className="mb-2 d-block small fw-medium text-ink">{t('adminDefinicoes.sla.dias')}</span>
          <input type="number" min={1} value={sla.dias} onChange={(e) => setSla({ ...sla, dias: Number(e.target.value) })} className="form-control" style={{ width: '8rem' }} />
        </label>
        <ToggleRow
          label={t('adminDefinicoes.sla.alertasLabel')}
          desc={t('adminDefinicoes.sla.alertasDesc')}
          checked={sla.alertas}
          onChange={(v) => setSla({ ...sla, alertas: v })}
        />
      </Card>

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
    </div>
  )
}
