import { useState } from 'react'
import { Target, Plus, Trash2, Calendar, CheckCircle2, Clock3 } from 'lucide-react'
import { Card, Spinner, EmptyState, ErrorState } from './ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const PRIORIDADES = [
  { value: 1, key: 'alta', cls: 'text-bg-danger' },
  { value: 3, key: 'media', cls: 'text-bg-warning' },
  { value: 5, key: 'baixa', cls: 'text-bg-secondary' },
]
const TIPOS = ['Meta', 'Milestone', 'Evento']

// Zona de gestão da timeline de um consultor específico (Talent Manager / Admin).
// Os objetivos criados aqui aparecem na página de Objetivos (timeline) do consultor.
export default function ConsultorTimelineManager({ consultorId, className = '' }) {
  const { t, i18n } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getObjetivosConsultor(consultorId), [consultorId])

  const [title, setTitle] = useState('')
  const [type, setType] = useState('Meta')
  const [expectedDate, setExpectedDate] = useState('')
  const [priority, setPriority] = useState(3)
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState('')

  const locale = { pt: 'pt-PT', en: 'en-US', es: 'es-ES' }[i18n.language?.substring(0, 2)] || 'pt-PT'
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale) : '—')

  async function adicionar(e) {
    e.preventDefault()
    if (!title.trim()) return
    setGuardando(true)
    setErro('')
    try {
      await api.criarObjetivoConsultor(consultorId, { title: title.trim(), type, expectedDate: expectedDate || null, priority: Number(priority) })
      setTitle(''); setType('Meta'); setExpectedDate(''); setPriority(3)
      reload()
    } catch (err) {
      setErro(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function remover(id) {
    try { await api.apagarObjetivoConsultor(consultorId, id); reload() } catch (err) { setErro(err.message) }
  }

  const objetivos = data || []
  const prioridade = (v) => PRIORIDADES.find((p) => p.value === v) || PRIORIDADES[1]

  return (
    <Card className={className}>
      <h2 className="mb-1 h6 fw-bold"><Target size={17} className="me-2 text-primary" />{t('timelineManager.titulo')}</h2>
      <p className="fs-xs text-muted mb-3">{t('timelineManager.subtitulo')}</p>

      <form onSubmit={adicionar} className="row g-2 align-items-end mb-3">
        <div className="col-12">
          <label className="form-label small fw-medium mb-1">{t('timelineManager.tituloLabel')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('timelineManager.tituloPlaceholder')} className="form-control form-control-sm" />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-medium mb-1">{t('timelineManager.tipoLabel')}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="form-select form-select-sm">
            {TIPOS.map((tp) => <option key={tp} value={tp}>{t(`timelineManager.tipos.${tp.toLowerCase()}`)}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-medium mb-1">{t('timelineManager.prazoLabel')}</label>
          <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="form-control form-control-sm" />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-medium mb-1">{t('timelineManager.prioridadeLabel')}</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select form-select-sm">
            {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{t(`objetivos.prioridades.${p.key}`)}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <button type="submit" disabled={guardando || !title.trim()} className="btn btn-brand btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
            <Plus size={15} /> {t('timelineManager.adicionar')}
          </button>
        </div>
      </form>
      {erro && <p className="mb-3 fs-xs text-danger">{erro}</p>}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : objetivos.length === 0 ? (
        <EmptyState icon={Target} title={t('timelineManager.vazioTitulo')} description={t('timelineManager.vazioDesc')} />
      ) : (
        <div className="d-flex flex-column gap-2">
          {objetivos.map((o) => {
            const p = prioridade(o.priority)
            return (
              <div key={o.id} className={`d-flex align-items-start gap-3 rounded-3 border p-3 ${o.concluido ? 'bg-light' : 'bg-white'}`}>
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light text-brand flex-shrink-0" style={{ width: 32, height: 32 }}>
                  {o.concluido ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <p className={`small fw-semibold mb-0 ${o.concluido ? 'text-muted text-decoration-line-through' : 'text-ink'}`}>{o.title}</p>
                    {!o.concluido && <span className={`badge rounded-pill ${p.cls}`}>{t(`objetivos.prioridades.${p.key}`)}</span>}
                  </div>
                  <p className="mt-1 mb-0 d-flex align-items-center gap-1 fs-xs text-muted">
                    <Calendar size={12} />
                    {o.type ? `${t(`timelineManager.tipos.${o.type.toLowerCase()}`, { defaultValue: o.type })} · ` : ''}
                    {o.concluido
                      ? `${t('timelineManager.concluidoEm')} ${fmt(o.completionDate)}`
                      : o.expectedDate ? `${t('timelineManager.prazo')} ${fmt(o.expectedDate)}` : t('timelineManager.semPrazo')}
                  </p>
                </div>
                <button onClick={() => remover(o.id)} className="btn btn-link btn-sm p-0 text-danger flex-shrink-0" title={t('timelineManager.remover')}>
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
