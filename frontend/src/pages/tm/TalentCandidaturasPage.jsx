import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, ChevronRight, Search, FileBarChart, CheckCircle2, XCircle, X } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/useAuth'
import { filterTalentApplicationsByTab, getTalentApplicationTabCounts } from '../../services/talentWorkspace'

export default function TalentCandidaturasPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(location.state?.tab || 'pendentes')
  const [feedback, setFeedback] = useState(location.state?.feedback || null)
  const [pesquisa, setPesquisa] = useState('')
  const { data, loading, error, reload } = useAsync(() => api.getTalentCandidaturas('todas'), [])
  useAutoRefresh(reload)

  useEffect(() => {
    if (!location.state?.feedback) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.feedback, navigate])

  const rows = data || []
  const counts = getTalentApplicationTabCounts(rows, user?.id)
  const lista = filterTalentApplicationsByTab(rows, tab, user?.id)
    .filter((row) => `${row.trackingId} ${row.consultor} ${row.badge} ${row.area || ''}`.toLowerCase().includes(pesquisa.toLowerCase()))
  const mostraDataDecisao = ['validadas', 'rejeitadas'].includes(tab)

  const TABS = [
    { key: 'pendentes', label: t('talentCandidaturas.tabs.pendentes') },
    { key: 'validadas', label: t('talentCandidaturas.tabs.validadasPorMim') },
    { key: 'rejeitadas', label: t('talentCandidaturas.tabs.rejeitadasPorMim') },
    { key: 'processo', label: t('tmWorkspace.applications.inProgress') },
    { key: 'aprovadas', label: t('tmWorkspace.applications.approved') },
    { key: 'todas', label: t('tmWorkspace.applications.all') },
  ]
  const exportRows = lista.map((row) => ({ trackingId: row.trackingId, consultor: row.consultor, badge: row.badge, nivel: row.nivel, area: row.area, data: mostraDataDecisao ? row.decisionDate || row.data : row.data, estado: row.status?.name }))

  return (
    <div>
      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex align-items-start gap-3 mb-4`} role="status">
          {feedback.type === 'success'
            ? <CheckCircle2 size={22} className="flex-shrink-0 mt-1" />
            : <XCircle size={22} className="flex-shrink-0 mt-1" />}
          <div className="flex-grow-1">
            <p className="fw-semibold mb-1">{feedback.title}</p>
            <p className="small mb-0">{feedback.message}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm p-1 lh-1"
            onClick={() => setFeedback(null)}
            aria-label={t('talentCandidaturas.feedback.fechar')}
            title={t('talentCandidaturas.feedback.fechar')}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap rounded-3 bg-white p-1 border">
          {TABS.map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key)}
              className={`btn btn-sm rounded-2 fw-medium ${
                tab === tItem.key ? 'btn-brand' : 'btn-link text-muted text-decoration-none'
              }`}
            >
              {tItem.label}
              <span className={`ms-2 badge rounded-pill ${tab === tItem.key ? 'text-bg-light text-dark' : 'text-bg-secondary'}`}>
                {counts[tItem.key] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="d-flex flex-wrap gap-2"><Link to="/tm/relatorios" className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2"><FileBarChart size={16} /> {t('tmWorkspace.applications.reports')}</Link><ExportButtons data={exportRows} filename={`talent-manager-candidaturas-${tab}`} columns={[{ key: 'trackingId', label: 'Tracking ID' }, { key: 'consultor', label: t('tmWorkspace.common.consultor') }, { key: 'badge', label: t('tmWorkspace.common.badge') }, { key: 'nivel', label: t('tmWorkspace.common.nivel') }, { key: 'area', label: t('tmWorkspace.common.area') }, { key: 'data', label: t('tmWorkspace.common.data') }, { key: 'estado', label: t('tmWorkspace.common.estado') }]} /></div>
      </div>
      <div className="position-relative mb-3" style={{ maxWidth: 420 }}><Search size={17} className="position-absolute text-muted" style={{ left: 13, top: 11 }} /><input className="form-control ps-5" value={pesquisa} onChange={(event) => setPesquisa(event.target.value)} placeholder={t('tmWorkspace.applications.search')} /></div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title={t('talentCandidaturas.empty.titulo')}
              description={t('talentCandidaturas.empty.descricao')}
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.trackingId')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.consultor')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.badge')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.nivel')}</th>
                  <th className="px-3 py-2">{t('tmWorkspace.common.area')}</th>
                  <th className="px-3 py-2">{t(mostraDataDecisao ? 'talentCandidaturas.tabela.dataDecisao' : 'talentCandidaturas.tabela.data')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.estado')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 fw-medium text-ink">{c.trackingId}</td>
                    <td className="px-3 py-2 text-ink">{c.consultor}</td>
                    <td className="px-3 py-2 text-ink">{c.badge}</td>
                    <td className="px-3 py-2 text-muted">{c.nivel}</td>
                    <td className="px-3 py-2 text-muted">{c.area || '—'}</td>
                    <td className="px-3 py-2 text-muted">{mostraDataDecisao ? c.decisionDate || c.data : c.data}</td>
                    <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                    <td className="px-3 py-2 text-end">
                      <Link
                        to={`/tm/candidaturas/${c.id}`}
                        className="btn btn-brand btn-sm d-inline-flex align-items-center gap-1"
                      >
                        {t('talentCandidaturas.tabela.verCandidatura')} <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
