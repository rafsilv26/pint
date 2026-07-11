import { useState } from 'react'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function TalentExpirationsPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const stateLabel = { soon: labels.expirations.expiring, expired: labels.expirations.expired, valid: labels.expirations.valid, permanent: labels.expirations.permanent }
  const [filter, setFilter] = useState('attention')
  const { data, loading, error, reload } = useAsync(() => api.getTalentReports())
  useAutoRefresh(reload)
  const rows = (data?.awards || []).filter((row) => filter === 'all' || (filter === 'attention' && ['soon', 'expired'].includes(row.expiration?.code)) || row.expiration?.code === filter)
  const exported = rows.map((row) => ({ badge: row.nome, consultor: row.consultor, area: row.area, obtida: row.obtainedDate ? new Date(row.obtainedDate).toLocaleDateString() : '—', expira: row.expirationDate ? new Date(row.expirationDate).toLocaleDateString() : labels.common.semExpiracao, estado: stateLabel[row.expiration?.code] || '—', dias: row.expiration?.days ?? '—' }))
  return <div>
    <PageHeader title={labels.expirations.title} subtitle={labels.expirations.subtitle} action={<ExportButtons data={exported} filename="talent-manager-validades" columns={[{ key: 'badge', label: labels.common.badge }, { key: 'consultor', label: labels.common.consultor }, { key: 'area', label: labels.common.area }, { key: 'obtida', label: labels.expirations.obtained }, { key: 'expira', label: labels.expirations.expires }, { key: 'estado', label: labels.common.estado }, { key: 'dias', label: labels.expirations.days }]} />} />
    <div className="btn-group mb-4">{[['attention', labels.expirations.attention], ['soon', labels.expirations.expiring], ['expired', labels.expirations.expired], ['all', labels.expirations.all]].map(([value, text]) => <button className={`btn btn-sm ${filter === value ? 'btn-brand' : 'btn-outline-secondary'}`} key={value} onClick={() => setFilter(value)}>{text}</button>)}</div>
    {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? <EmptyState icon={CalendarClock} title={labels.expirations.empty} description={labels.expirations.emptyDescription} /> : <Card className="p-0 overflow-hidden"><div className="table-responsive"><table className="table table-hover align-middle mb-0 small"><thead className="table-light"><tr><th className="px-3 py-2">{labels.common.consultor}</th><th className="px-3 py-2">{labels.common.badge}</th><th className="px-3 py-2">{labels.common.area}</th><th className="px-3 py-2">{labels.expirations.expires}</th><th className="px-3 py-2">{labels.common.estado}</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.consultantId}-${row.badgeId}-${index}`}><td className="px-3 py-2 fw-semibold">{row.consultor}</td><td className="px-3 py-2">{row.nome}</td><td className="px-3 py-2 text-muted">{row.area}</td><td className="px-3 py-2">{row.expirationDate ? new Date(row.expirationDate).toLocaleDateString() : labels.common.semExpiracao}</td><td className="px-3 py-2"><span className={`badge ${row.expiration.code === 'expired' ? 'text-bg-danger' : row.expiration.code === 'soon' ? 'text-bg-warning' : 'text-bg-secondary'}`}>{row.expiration.code !== 'permanent' && <AlertTriangle size={12} className="me-1" />}{stateLabel[row.expiration.code]}</span></td></tr>)}</tbody></table></div></Card>}
  </div>
}
