import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Award, ChevronRight, ClipboardList, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState, ErrorState, PageHeader, Spinner, StatusPill } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import * as api from '../services/api'

async function loadTalent() {
  const [consultants, badges, applications] = await Promise.all([
    api.getTalentConsultants(),
    api.getTalentCatalog(),
    api.getTalentCandidaturas('todas'),
  ])
  return { consultants, badges, applications }
}

async function loadServiceLine() {
  const report = await api.getServiceLineReports()
  return {
    consultants: report.consultants || [],
    badges: report.catalog || [],
    applications: report.applications || [],
  }
}

const SEARCH_CONFIG = {
  '/tm': {
    load: loadTalent,
    consultorHref: (id) => `/tm/consultores/${id}`,
    badgeHref: (id) => `/tm/catalogo/${id}`,
    candidaturaHref: (id) => `/tm/candidaturas/${id}`,
  },
  '/admin': {
    load: loadTalent,
    consultorHref: (id) => `/admin/consultor/${id}`,
    badgeHref: () => '/admin/badges',
    candidaturaHref: (id) => `/admin/pedidos/${id}`,
  },
  '/sll': {
    load: loadServiceLine,
    consultorHref: (id) => `/sll/consultores/${id}`,
    badgeHref: (id) => `/sll/badges/${id}`,
    candidaturaHref: (id) => `/sll/pedidos/${id}`,
  },
}

export default function GlobalSearchPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''

  const base = `/${location.pathname.split('/')[1] || ''}`
  const config = SEARCH_CONFIG[base] || SEARCH_CONFIG['/tm']

  const { data, loading, error, reload } = useAsync(() => config.load(), [base])
  useAutoRefresh(reload)

  const normalized = query.trim().toLowerCase()
  const includes = (...values) => values.join(' ').toLowerCase().includes(normalized)
  const consultants = normalized ? (data?.consultants || []).filter((row) => includes(row.name, row.email, row.area, row.serviceLine)) : []
  const badges = normalized ? (data?.badges || []).filter((row) => includes(row.nome, row.fornecedor, row.area, row.serviceLine, row.learningPath)) : []
  const applications = normalized ? (data?.applications || []).filter((row) => includes(row.trackingId, row.consultor, row.badge, row.area, row.status?.name)) : []
  const total = consultants.length + badges.length + applications.length

  return (
    <div>
      <PageHeader title={labels.search.title} subtitle={labels.search.subtitle} />
      <div className="position-relative mb-4" style={{ maxWidth: 620 }}>
        <Search size={18} className="position-absolute text-muted" style={{ left: 14, top: 12 }} />
        <input autoFocus className="form-control ps-5" value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })} placeholder={labels.search.placeholder} />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !normalized ? <EmptyState icon={Search} title={labels.search.startTitle} description={labels.search.startDescription} /> : total === 0 ? <EmptyState icon={Search} title={labels.search.emptyTitle} description={labels.search.emptyDescription} /> : (
        <div className="row g-4">
          <div className="col-xl-4"><Card className="h-100 p-0 overflow-hidden"><div className="d-flex align-items-center gap-2 border-bottom p-3"><Users size={18} className="text-primary" /><h2 className="h6 fw-bold mb-0">{labels.reports.consultants}</h2><span className="badge text-bg-light ms-auto">{consultants.length}</span></div><div className="list-group list-group-flush">{consultants.map((row) => <Link key={row.id} to={config.consultorHref(row.id)} className="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 py-3"><div className="min-w-0"><p className="small fw-bold text-truncate mb-0">{row.name}</p><p className="fs-xs text-muted text-truncate mb-0">{row.area || row.serviceLine || '—'}</p></div><ChevronRight size={16} className="text-muted flex-shrink-0" /></Link>)}</div></Card></div>
          <div className="col-xl-4"><Card className="h-100 p-0 overflow-hidden"><div className="d-flex align-items-center gap-2 border-bottom p-3"><Award size={18} className="text-warning" /><h2 className="h6 fw-bold mb-0">{labels.common.badges}</h2><span className="badge text-bg-light ms-auto">{badges.length}</span></div><div className="list-group list-group-flush">{badges.map((row) => <Link key={row.id} to={config.badgeHref(row.id)} className="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 py-3"><div className="min-w-0"><p className="small fw-bold text-truncate mb-0">{row.nome}</p><p className="fs-xs text-muted text-truncate mb-0">{row.area} · {row.nivel}</p></div><ChevronRight size={16} className="text-muted flex-shrink-0" /></Link>)}</div></Card></div>
          <div className="col-xl-4"><Card className="h-100 p-0 overflow-hidden"><div className="d-flex align-items-center gap-2 border-bottom p-3"><ClipboardList size={18} className="text-success" /><h2 className="h6 fw-bold mb-0">{labels.reports.applications}</h2><span className="badge text-bg-light ms-auto">{applications.length}</span></div><div className="list-group list-group-flush">{applications.slice(0, 12).map((row) => <Link key={row.id} to={config.candidaturaHref(row.id)} className="list-group-item list-group-item-action py-3 overflow-hidden"><div className="d-flex align-items-center gap-2"><p className="small fw-bold text-truncate flex-grow-1 min-w-0 mb-0">{row.trackingId} · {row.badge}</p><ChevronRight size={15} className="text-muted flex-shrink-0" /></div><div className="mt-1 d-flex align-items-center gap-2"><p className="fs-xs text-muted text-truncate flex-grow-1 min-w-0 mb-0">{row.consultor}</p><span className="flex-shrink-0"><StatusPill status={row.status} /></span></div></Link>)}{applications.length > 12 && <span className="list-group-item py-3 small fw-semibold text-muted text-center">+{applications.length - 12}</span>}</div></Card></div>
        </div>
      )}
    </div>
  )
}
