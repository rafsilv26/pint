import { useState } from 'react'
import { Target, Plus, Trash2, Calendar, CheckCircle2, RotateCcw } from 'lucide-react'
import { PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const PRIORIDADES = [
  { value: 1, key: 'alta', cls: 'text-bg-danger' },
  { value: 3, key: 'media', cls: 'text-bg-warning' },
  { value: 5, key: 'baixa', cls: 'text-bg-secondary' },
]

export default function ObjetivosPage() {
  const { t, i18n } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getMeusObjetivos())

  const [title, setTitle] = useState('')
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
      await api.criarObjetivo({ title: title.trim(), expectedDate: expectedDate || null, priority: Number(priority) })
      setTitle(''); setExpectedDate(''); setPriority(3)
      reload()
    } catch (err) {
      setErro(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function alternar(o) {
    try { await api.concluirObjetivo(o.id, !o.concluido); reload() } catch (err) { setErro(err.message) }
  }
  async function remover(id) {
    try { await api.apagarObjetivo(id); reload() } catch (err) { setErro(err.message) }
  }

  const objetivos = data || []
  const prioridade = (v) => PRIORIDADES.find((p) => p.value === v) || PRIORIDADES[1]

  return (
    <div>
      <PageHeader title={t('objetivos.titulo')} subtitle={t('objetivos.subtitulo')} />

      <Card className="mb-4">
        <form onSubmit={adicionar} className="row g-3 align-items-end">
          <div className="col-12 col-lg-5">
            <label className="form-label small fw-medium mb-1">{t('objetivos.tituloLabel')}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('objetivos.tituloPlaceholder')} className="form-control" />
          </div>
          <div className="col-6 col-lg-3">
            <label className="form-label small fw-medium mb-1">{t('objetivos.prazoLabel')}</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="form-control" />
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label small fw-medium mb-1">{t('objetivos.prioridadeLabel')}</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select">
              {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{t(`objetivos.prioridades.${p.key}`)}</option>)}
            </select>
          </div>
          <div className="col-12 col-lg-2">
            <button type="submit" disabled={guardando || !title.trim()} className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-1">
              <Plus size={16} /> {t('objetivos.adicionar')}
            </button>
          </div>
        </form>
        {erro && <p className="mt-2 mb-0 fs-xs text-danger">{erro}</p>}
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : objetivos.length === 0 ? (
        <EmptyState icon={Target} title={t('objetivos.vazioTitulo')} description={t('objetivos.vazioDesc')} />
      ) : (
        <div className="d-flex flex-column gap-2">
          {objetivos.map((o) => {
            const p = prioridade(o.priority)
            return (
              <Card key={o.id} className={o.concluido ? 'bg-light' : ''}>
                <div className="d-flex align-items-start gap-3">
                  <button
                    onClick={() => alternar(o)}
                    className={`btn btn-sm p-0 flex-shrink-0 ${o.concluido ? 'text-success' : 'text-muted'}`}
                    title={o.concluido ? t('objetivos.reabrir') : t('objetivos.marcarConcluido')}
                  >
                    <CheckCircle2 size={22} />
                  </button>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <p className={`fw-semibold mb-0 ${o.concluido ? 'text-muted text-decoration-line-through' : 'text-ink'}`}>{o.title}</p>
                      {!o.concluido && <span className={`badge rounded-pill ${p.cls}`}>{t(`objetivos.prioridades.${p.key}`)}</span>}
                    </div>
                    <p className="mt-1 mb-0 d-flex align-items-center gap-1 fs-xs text-muted">
                      <Calendar size={12} />
                      {o.concluido
                        ? `${t('objetivos.concluidoEm')} ${fmt(o.completionDate)}`
                        : o.expectedDate ? `${t('objetivos.prazo')} ${fmt(o.expectedDate)}` : t('objetivos.semPrazo')}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <button onClick={() => alternar(o)} className="btn btn-link btn-sm p-0 text-muted" title={o.concluido ? t('objetivos.reabrir') : t('objetivos.marcarConcluido')}>
                      {o.concluido ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button onClick={() => remover(o.id)} className="btn btn-link btn-sm p-0 text-danger" title={t('objetivos.remover')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
