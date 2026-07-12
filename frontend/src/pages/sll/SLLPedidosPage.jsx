import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, FileText, ChevronRight, History, Search, Undo2, X } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function SLLPedidosPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState(location.state?.tab || 'ALL')
  const [search, setSearch] = useState('')
  const [historyStatus, setHistoryStatus] = useState('ALL')
  const [feedback, setFeedback] = useState(location.state?.feedback || null)
  const { data, loading, error, reload } = useAsync(() => api.getServiceLinePedidos())
  const { data: decisionHistory, loading: historyLoading, error: historyError, reload: reloadHistory } = useAsync(() => api.getServiceLineDecisionHistory())
  useAutoRefresh(() => { reload(); reloadHistory() })
  const allRows = data || []
  const lista = allRows
    .filter((row) => status === 'ALL' || row.status.code === status)
    .filter((row) => `${row.trackingId} ${row.consultor} ${row.badge} ${row.area}`.toLowerCase().includes(search.toLowerCase()))
  const cont = (code) => allRows.filter((c) => c.status.code === code).length
  const historyRows = (decisionHistory || []).filter((row) => historyStatus === 'ALL' || row.code === historyStatus)
  const formatDecisionDate = (value) => {
    const date = new Date(value)
    if (!value || Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(date)
  }

  useEffect(() => {
    if (!location.state?.feedback) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.feedback, navigate])

  // Agora que o resumo está dentro do componente, podemos usar o t() para traduzir as labels
  const resumo = [
    { label: t('sllPedidos.resumo.pendentes'), value: cont('VALIDATED'), icon: Clock, tint: { backgroundColor: '#fef3c7', color: '#d97706' } },
    { label: t('sllPedidos.resumo.aprovados'), value: cont('APPROVED'), icon: CheckCircle2, tint: { backgroundColor: '#dcfce7', color: '#16a34a' } },
    { label: t('sllPedidos.resumo.rejeitados'), value: cont('REJECTED'), icon: XCircle, tint: { backgroundColor: '#fee2e2', color: '#dc2626' } },
    { label: t('sllPedidos.resumo.devolvidos'), value: cont('OPEN'), icon: Undo2, tint: { backgroundColor: '#e0f2fe', color: '#0284c7' } },
  ]

  const tabs = [
    ['ALL', t('sllPedidos.tabs.todos')],
    ['VALIDATED', t('sllPedidos.tabs.pendentes')],
    ['APPROVED', t('sllPedidos.tabs.aprovados')],
    ['REJECTED', t('sllPedidos.tabs.rejeitados')],
    ['OPEN', t('sllPedidos.tabs.devolvidos')],
  ]
  const historyTabs = [
    ['ALL', t('sllPedidos.historico.tabs.todas')],
    ['APPROVED', t('sllPedidos.historico.tabs.aprovacoes')],
    ['REJECTED', t('sllPedidos.historico.tabs.rejeicoes')],
    ['OPEN', t('sllPedidos.historico.tabs.devolucoes')],
  ]

  const exportColumns = [
    { key: 'trackingId', label: t('sllPedidos.tabela.trackingId') },
    { key: 'badge', label: t('sllPedidos.tabela.badge') },
    { key: 'consultor', label: t('sllPedidos.tabela.consultor') },
    { key: 'data', label: t('sllPedidos.tabela.data') },
    { key: 'nivel', label: t('sllPedidos.tabela.nivel') },
    { key: 'pontos', label: t('sllPedidos.tabela.pontos') },
    { key: 'estadoTexto', label: t('sllPedidos.tabela.estado') },
  ]
  const exportData = lista.map((c) => ({ ...c, estadoTexto: c.status?.name || c.status?.code || '' }))

  return (
    <div>
      {feedback && <div className={`alert alert-${feedback.type} d-flex align-items-start gap-3`} role="status"><div className="flex-grow-1"><p className="fw-semibold mb-1">{feedback.title}</p><p className="small mb-0">{feedback.message}</p></div><button type="button" className="btn btn-sm p-1" onClick={() => setFeedback(null)} aria-label={t('sllPedidos.fecharAviso')} title={t('sllPedidos.fecharAviso')}><X size={18} /></button></div>}
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <h1 className="fs-2 fw-bold text-ink mb-0">{t('sllPedidos.titulo')}</h1>
        <ExportButtons data={exportData} columns={exportColumns} filename="pedidos-service-line" />
      </div>
      <div className="mb-4 row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
        {resumo.map((r) => (
          <div className="col" key={r.label}>
            <Card className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ height: '3rem', width: '3rem', ...r.tint }}><r.icon size={22} /></div>
              <div>
                <p className="fs-3 fw-bold text-ink mb-0">{r.value}</p>
                <p className="small text-muted mb-0">{r.label}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap rounded-3 border bg-white p-1">
          {tabs.map(([code, label]) => <button key={code} type="button" onClick={() => setStatus(code)} className={`btn btn-sm ${status === code ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}>{label}<span className={`ms-2 badge rounded-pill ${status === code ? 'text-bg-light text-dark' : 'text-bg-secondary'}`}>{code === 'ALL' ? allRows.length : cont(code)}</span></button>)}
        </div>
        <div className="position-relative" style={{ width: 'min(100%, 22rem)' }}><Search size={16} className="position-absolute text-muted" style={{ left: 13, top: 11 }} /><input className="form-control ps-5" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('sllPedidos.pesquisar')} /></div>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title={t('sllPedidos.empty.titulo')}
              description={t('sllPedidos.empty.descricao')}
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-3 py-2">{t('sllPedidos.tabela.trackingId')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.badge')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.consultor')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.data')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.nivel')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.pontos')}</th>
                  <th className="px-3 py-2">{t('sllPedidos.tabela.estado')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/sll/pedidos/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <td className="px-3 py-2 fw-medium text-ink">{c.trackingId}</td>
                    <td className="px-3 py-2 text-ink">{c.badge}</td>
                    <td className="px-3 py-2 text-ink">{c.consultor}</td>
                    <td className="px-3 py-2 text-muted">{c.data}</td>
                    <td className="px-3 py-2 text-muted">{c.nivel}</td>
                    <td className="px-3 py-2 text-muted">{c.pontos}</td>
                    <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                    <td className="px-3 py-2 text-end text-brand"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <section className="mt-4" aria-labelledby="sll-decision-history-title">
        <div className="mb-3 d-flex flex-wrap align-items-end justify-content-between gap-3">
          <div>
            <h2 id="sll-decision-history-title" className="h4 fw-bold text-ink mb-0 d-flex align-items-center gap-2">
              <History size={21} className="text-brand" aria-hidden="true" />
              {t('sllPedidos.historico.titulo')}
            </h2>
            <p className="small text-muted mt-1 mb-0">{t('sllPedidos.historico.subtitulo')}</p>
          </div>
          <div className="d-flex flex-wrap rounded-3 border bg-white p-1" role="group" aria-label={t('sllPedidos.historico.filtro')}>
            {historyTabs.map(([code, label]) => (
              <button key={code} type="button" onClick={() => setHistoryStatus(code)} className={`btn btn-sm ${historyStatus === code ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {historyLoading ? (
            <div className="p-4"><Spinner /></div>
          ) : historyError ? (
            <div className="p-4"><ErrorState message={historyError} onRetry={reloadHistory} /></div>
          ) : historyRows.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={History} title={t('sllPedidos.historico.vazioTitulo')} description={t('sllPedidos.historico.vazioDescricao')} />
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {historyRows.map((row) => (
                <button key={row.id} type="button" onClick={() => navigate(`/sll/pedidos/${row.requestId}`)} className="list-group-item list-group-item-action border-start-0 border-end-0 px-3 py-3 text-start">
                  <div className="row g-2 align-items-center">
                    <div className="col-6 col-lg-2">
                      <p className="fw-semibold text-brand mb-0">{row.trackingId}</p>
                      <p className="fs-xs text-muted mb-0">{formatDecisionDate(row.decidedAt)}</p>
                    </div>
                    <div className="col-6 col-lg-2"><StatusPill status={{ ...row.status, name: t(`sllPedidos.historico.estados.${row.code}`, { defaultValue: row.status?.name }) }} /></div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <p className="small fw-semibold text-ink mb-0">{row.badge}</p>
                      <p className="fs-xs text-muted mb-0">{row.consultor}</p>
                    </div>
                    <div className="col-11 col-md-5 col-lg-4">
                      <p className="small text-muted mb-0 text-break">{row.comment || t('sllPedidos.historico.semComentario')}</p>
                      {row.author && <p className="fs-xs text-muted mb-0">{t('sllPedidos.historico.por', { nome: row.author })}</p>}
                    </div>
                    <div className="col-1 text-end text-brand"><ChevronRight size={17} aria-hidden="true" /></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
