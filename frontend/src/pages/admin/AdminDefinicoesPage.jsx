import { useState } from 'react'
import { Clock, Bell, Megaphone, Users, Award, ClipboardCheck, Layers, Send, Plus, Trash2, PlayCircle } from 'lucide-react'
import { PageHeader, Card, Toggle, Spinner, ErrorState } from '../../components/ui'
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

const SLA_TEAMS = ['talent', 'serviceline', 'global']

// Gestão dos SLAs por equipa (guião — bónus Gestor 10). O SLA ativo de cada
// equipa define o prazo usado pela verificação de atrasos (emails + push).
function SlaManagerCard() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getSlaConfigs())

  const [form, setForm] = useState({ name: '', team: 'talent', responseDays: 5, alertDaysBeforeExpiration: '' })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [resumo, setResumo] = useState(null)

  const configs = data?.configs || []
  const efetivo = data?.efetivo

  const teamLabel = (team) =>
    team === 'talent' ? t('adminDefinicoes.sla.equipaTalent')
      : team === 'serviceline' ? t('adminDefinicoes.sla.equipaServiceLine')
        : t('adminDefinicoes.sla.equipaGlobal')

  async function adicionar(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setGuardando(true)
    setErro('')
    try {
      await api.criarSlaConfig({
        name: form.name.trim(),
        team: form.team === 'global' ? null : form.team,
        responseDays: Number(form.responseDays),
        alertDaysBeforeExpiration: form.alertDaysBeforeExpiration === '' ? null : Number(form.alertDaysBeforeExpiration),
      })
      setForm({ name: '', team: 'talent', responseDays: 5, alertDaysBeforeExpiration: '' })
      reload()
    } catch (err) {
      setErro(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function alternarAtiva(c) {
    setErro('')
    try { await api.atualizarSlaConfig(c.id, { active: !c.active }); reload() } catch (err) { setErro(err.message) }
  }

  async function remover(id) {
    setErro('')
    try { await api.apagarSlaConfig(id); reload() } catch (err) { setErro(err.message) }
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
        <Clock size={18} className="text-brand" /> {t('adminDefinicoes.sla.titulo')}
      </h2>
      <p className="fs-xs text-muted mb-3">{t('adminDefinicoes.sla.subtitulo')}</p>

      {loading ? <Spinner /> : error ? <ErrorState onRetry={reload} /> : (
        <>
          {efetivo && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="rounded-pill bg-brand-light text-brand px-3 py-1 fs-xs fw-semibold">
                {t('adminDefinicoes.sla.equipaTalent')}: {t('adminDefinicoes.sla.dias', { count: efetivo.talent.responseDays })}
              </span>
              <span className="rounded-pill bg-brand-light text-brand px-3 py-1 fs-xs fw-semibold">
                {t('adminDefinicoes.sla.equipaServiceLine')}: {t('adminDefinicoes.sla.dias', { count: efetivo.serviceline.responseDays })}
              </span>
            </div>
          )}

          {configs.length === 0 ? (
            <p className="small text-muted">{t('adminDefinicoes.sla.vazio')}</p>
          ) : (
            <div className="d-flex flex-column gap-2 mb-3">
              {configs.map((c) => (
                <div key={c.id} className={`d-flex align-items-center gap-3 rounded-3 border p-3 ${c.active ? 'bg-white' : 'bg-light'}`}>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <p className={`small fw-semibold mb-0 ${c.active ? 'text-ink' : 'text-muted'}`}>{c.name}</p>
                      <span className="badge rounded-pill text-bg-secondary">{teamLabel(c.team)}</span>
                      {c.active && <span className="badge rounded-pill text-bg-success">{t('adminDefinicoes.sla.ativa')}</span>}
                    </div>
                    <p className="fs-xs text-muted mb-0 mt-1">
                      {t('adminDefinicoes.sla.dias', { count: c.responseDays })}
                      {c.alertDaysBeforeExpiration != null && ` · ${t('adminDefinicoes.sla.alertaResumo', { count: c.alertDaysBeforeExpiration })}`}
                    </p>
                  </div>
                  <Toggle checked={c.active} onChange={() => alternarAtiva(c)} />
                  <button onClick={() => remover(c.id)} className="btn btn-link btn-sm p-0 text-danger flex-shrink-0" title={t('adminDefinicoes.sla.remover')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={adicionar} className="row g-2 align-items-end border-top pt-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-medium mb-1">{t('adminDefinicoes.sla.nomeLabel')}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('adminDefinicoes.sla.nomePlaceholder')} className="form-control form-control-sm" />
            </div>
            <div className="col-4 col-md-3">
              <label className="form-label small fw-medium mb-1">{t('adminDefinicoes.sla.equipaLabel')}</label>
              <select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="form-select form-select-sm">
                {SLA_TEAMS.map((team) => <option key={team} value={team}>{teamLabel(team === 'global' ? null : team)}</option>)}
              </select>
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small fw-medium mb-1">{t('adminDefinicoes.sla.diasLabel')}</label>
              <input type="number" min={1} value={form.responseDays} onChange={(e) => setForm({ ...form, responseDays: e.target.value })} className="form-control form-control-sm" />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small fw-medium mb-1">{t('adminDefinicoes.sla.alertaLabel')}</label>
              <input type="number" min={0} value={form.alertDaysBeforeExpiration} onChange={(e) => setForm({ ...form, alertDaysBeforeExpiration: e.target.value })} className="form-control form-control-sm" />
            </div>
            <div className="col-12 col-md-1">
              <button type="submit" disabled={guardando || !form.name.trim()} className="btn btn-brand btn-sm w-100 d-flex align-items-center justify-content-center" title={t('adminDefinicoes.sla.adicionar')}>
                <Plus size={16} />
              </button>
            </div>
          </form>

          <div className="mt-3 border-top pt-3">
            <button type="button" onClick={verificar} disabled={verificando} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-2">
              <PlayCircle size={15} /> {verificando ? t('adminDefinicoes.sla.aVerificar') : t('adminDefinicoes.sla.verificar')}
            </button>
            {resumo && (
              <p className="mt-2 mb-0 rounded-3 bg-success-subtle text-success-emphasis px-3 py-2 small">
                {t('adminDefinicoes.sla.resumo', {
                  tm: resumo.pendentesTalentManager,
                  sll: resumo.pendentesServiceLine,
                  emails: resumo.emailsEnviados,
                })}
              </p>
            )}
          </div>

          {erro && <p className="mt-2 mb-0 fs-xs text-danger">{erro}</p>}
        </>
      )}
    </Card>
  )
}

export default function AdminDefinicoesPage() {
  const { t } = useTranslation()
  const { data, loading } = useAsync(() => api.getDefinicoes())
  const { data: painel } = useAsync(() => api.getAdminDashboard().catch(() => null))

  const [notif, setNotif] = useState({ email: true, push: false, diasExpiracao: 5 })
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [aviso, setAviso] = useState({ title: '', message: '', type: 'info' })
  const [difundindo, setDifundindo] = useState(false)
  const [difResultado, setDifResultado] = useState(null)

  // Sincroniza o formulário quando as definições chegam do servidor
  // (ajuste de estado durante o render, em vez de useEffect).
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
