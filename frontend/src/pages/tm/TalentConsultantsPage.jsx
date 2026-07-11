import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Award, Search, Users } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export default function TalentConsultantsPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useAsync(() => api.getTalentConsultants())
  useAutoRefresh(reload)
  const [search, setSearch] = useState(params.get('search') || '')
  const [area, setArea] = useState('')
  const [expiration, setExpiration] = useState('')
  const rows = useMemo(() => data || [], [data])
  const areas = useMemo(() => [...new Set(rows.map((row) => row.area).filter(Boolean))].sort(), [rows])
  const filtered = rows.filter((row) => {
    if (area && row.area !== area) return false
    if (expiration === 'soon' && !row.expiringCount) return false
    if (expiration === 'expired' && !row.expiredCount) return false
    return `${row.name} ${row.email} ${row.area} ${row.serviceLine}`.toLowerCase().includes(search.toLowerCase())
  })
  const exportRows = filtered.map((row) => ({ nome: row.name, email: row.email, area: row.area, serviceLine: row.serviceLine, pontos: row.points, badges: row.badges, progresso: `${row.progress}%`, aExpirar: row.expiringCount, expirados: row.expiredCount }))

  return <div>
    <PageHeader title={labels.consultants.title} subtitle={labels.consultants.subtitle} action={<ExportButtons data={exportRows} filename="talent-manager-consultores" columns={[{ key: 'nome', label: 'Nome' }, { key: 'email', label: 'Email' }, { key: 'area', label: labels.common.area }, { key: 'serviceLine', label: labels.common.serviceLine }, { key: 'pontos', label: labels.common.pontos }, { key: 'badges', label: labels.common.badges }, { key: 'progresso', label: labels.reports.progress }, { key: 'aExpirar', label: labels.consultants.expiring }, { key: 'expirados', label: labels.consultants.expired }]} />} />
    <div className="d-flex flex-wrap gap-3 mb-4">
      <div className="position-relative flex-grow-1" style={{ maxWidth: 420 }}><Search size={17} className="position-absolute text-muted" style={{ left: 13, top: 11 }} /><input className="form-control ps-5" value={search} onChange={(event) => { setSearch(event.target.value); setParams(event.target.value ? { search: event.target.value } : {}, { replace: true }) }} placeholder={labels.consultants.search} /></div>
      <select className="form-select" style={{ maxWidth: 240 }} value={area} onChange={(event) => setArea(event.target.value)}><option value="">{labels.common.todasAreas}</option>{areas.map((value) => <option key={value}>{value}</option>)}</select>
      <select className="form-select" style={{ maxWidth: 220 }} value={expiration} onChange={(event) => setExpiration(event.target.value)}><option value="">{labels.consultants.allValidity}</option><option value="soon">{labels.consultants.expiring}</option><option value="expired">{labels.consultants.expired}</option></select>
    </div>
    {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : filtered.length === 0 ? <EmptyState icon={Users} title={labels.consultants.empty} description={labels.consultants.emptyDescription} /> : <div className="row row-cols-1 row-cols-lg-2 g-3">{filtered.map((row) => <div className="col" key={row.id}><Link to={`/tm/consultores/${row.id}`} className="text-decoration-none"><Card className="h-100"><div className="d-flex gap-3"><div className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-bold text-brand flex-shrink-0" style={{ width: 48, height: 48 }}>{initials(row.name)}</div><div className="flex-grow-1 min-w-0"><div className="d-flex align-items-start justify-content-between gap-2"><div><p className="fw-bold text-ink mb-0 text-truncate">{row.name}</p><p className="small text-muted mb-0">{row.area} · {row.serviceLine}</p></div><strong className="text-brand">#{row.rank || '—'}</strong></div><div className="d-flex gap-3 mt-3 small text-muted"><span><Award size={14} className="me-1" />{row.badges || 0} {labels.common.badges.toLowerCase()}</span><span>{row.points || 0} {labels.common.pontos.toLowerCase()}</span><span>{row.activeApplications || 0} {labels.consultants.inProgress}</span></div><div className="d-flex justify-content-between mt-3 mb-1 fs-xs"><span>{labels.consultants.areaProgress}</span><strong>{row.progress}%</strong></div><div className="progress" style={{ height: 7 }}><div className="progress-bar" style={{ width: `${row.progress}%` }} /></div>{(row.expiringCount > 0 || row.expiredCount > 0) && <p className="mt-3 mb-0 fs-xs text-warning-emphasis"><AlertTriangle size={13} className="me-1" />{row.expiringCount} {labels.consultants.expiring.toLowerCase()} · {row.expiredCount} {labels.consultants.expired.toLowerCase()}</p>}</div></div></Card></Link></div>)}</div>}
  </div>
}
