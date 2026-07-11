import { useState } from 'react'
import { Award, CheckCircle2, ClipboardList, Coins, Sparkles, UserCheck, Users, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'

const EMPTY_REPORT = {
  totals: {}, candidaturas: [], consultants: [], awards: [], approvals: [], rejections: [],
  specialAchievements: [], statusBreakdown: [], areaBreakdown: [], learningPathBreakdown: [],
  levelBreakdown: [], badgeBreakdown: [], monthlyBreakdown: [], filterOptions: {},
}

function BreakdownTable({ title, rows, labelKey, emptyLabel, extra }) {
  return (
    <Card className="h-100">
      <h2 className="h6 fw-bold mb-3">{title}</h2>
      {rows.length === 0 ? <p className="small text-muted mb-0">{emptyLabel}</p> : (
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <tbody>{rows.map((row) => (
              <tr key={`${row[labelKey]}-${row.badgeId || ''}`}>
                <td>{row[labelKey]}</td>
                {extra && <td className="text-end small text-muted">{extra(row)}</td>}
                <td className="text-end fw-bold">{row.value}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function TalentReportsPage() {
  const { t, i18n } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const [filters, setFilters] = useState({
    status: 'ALL', area: '', serviceLine: '', learningPath: '', level: '', badgeId: '', from: '', to: '',
  })
  const [dataset, setDataset] = useState('candidaturas')
  const { data, loading, error, reload } = useAsync(
    () => api.getTalentReports(filters),
    [filters.status, filters.area, filters.serviceLine, filters.learningPath, filters.level, filters.badgeId, filters.from, filters.to],
  )
  useAutoRefresh(reload)

  if (loading && !data) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const report = data || EMPTY_REPORT
  const options = report.filterOptions || {}
  const locale = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES' }[i18n.language?.slice(0, 2)] || 'pt-PT'
  const formatDate = (value) => value ? new Date(value).toLocaleDateString(locale) : '—'
  const statuses = [
    ['ALL', labels.status.all], ['OPEN', labels.status.open], ['SUBMITTED', labels.status.submitted],
    ['IN_VALIDATION', labels.status.validation], ['VALIDATED', labels.status.validated], ['IN_APPROVAL', labels.status.approval],
    ['APPROVED', labels.status.approved], ['REJECTED', labels.status.rejected],
  ]
  const cards = [
    { label: labels.reports.applications, value: report.totals.candidaturas || 0, icon: ClipboardList, color: 'text-primary' },
    { label: labels.reports.consultants, value: report.totals.consultants || 0, icon: Users, color: 'text-info' },
    { label: labels.reports.registeredUsers, value: report.totals.registeredUsers || 0, icon: UserCheck, color: 'text-primary' },
    { label: labels.reports.awards, value: report.totals.awards || 0, icon: Award, color: 'text-warning' },
    { label: labels.reports.approvals, value: report.totals.approvals || 0, icon: CheckCircle2, color: 'text-success' },
    { label: labels.reports.rejections, value: report.totals.rejections || 0, icon: XCircle, color: 'text-danger' },
    { label: labels.reports.specialAchievements, value: report.totals.specialAchievements || 0, icon: Sparkles, color: 'text-warning-emphasis' },
  ]
  const applicationColumns = [
    { key: 'trackingId', label: 'Tracking ID' }, { key: 'consultor', label: labels.common.consultor },
    { key: 'badge', label: labels.common.badge }, { key: 'learningPath', label: labels.reports.learningPath },
    { key: 'area', label: labels.common.area }, { key: 'data', label: labels.common.data },
    { key: 'estado', label: labels.common.estado },
  ]
  const datasets = {
    candidaturas: report.candidaturas.map((row) => ({ ...row, estado: row.status?.name })),
    badges: report.awards.map((row) => ({
      nome: row.nome, consultor: row.consultor, learningPath: row.learningPath, nivel: row.nivel,
      area: row.area, pontos: row.pontos, obtida: formatDate(row.obtainedDate),
      expira: row.expirationDate ? formatDate(row.expirationDate) : labels.common.semExpiracao,
    })),
    consultores: report.consultants.map((row) => ({
      nome: row.name, email: row.email, learningPath: row.learningPath, area: row.area,
      serviceLine: row.serviceLine, pontos: row.points, badges: row.badges, progresso: `${row.progress}%`,
    })),
    aprovacoes: report.approvals.map((row) => ({ ...row, estado: row.status?.name })),
    rejeicoes: report.rejections.map((row) => ({ ...row, estado: row.status?.name })),
    conquistas: report.specialAchievements.map((row) => ({
      nome: row.name, consultor: row.consultor, area: row.area, serviceLine: row.serviceLine,
      criterio: row.criteriaDescription || row.description || '', data: formatDate(row.achievementDate),
    })),
  }
  const columns = dataset === 'badges'
    ? [
        { key: 'nome', label: labels.common.badge }, { key: 'consultor', label: labels.common.consultor },
        { key: 'learningPath', label: labels.reports.learningPath }, { key: 'nivel', label: labels.common.nivel },
        { key: 'area', label: labels.common.area }, { key: 'pontos', label: labels.common.pontos },
        { key: 'obtida', label: labels.reports.obtained }, { key: 'expira', label: labels.reports.expires },
      ]
    : dataset === 'consultores'
      ? [
          { key: 'nome', label: labels.common.nome }, { key: 'email', label: labels.common.email },
          { key: 'learningPath', label: labels.reports.learningPath }, { key: 'area', label: labels.common.area },
          { key: 'serviceLine', label: labels.common.serviceLine }, { key: 'pontos', label: labels.common.pontos },
          { key: 'badges', label: labels.common.badges }, { key: 'progresso', label: labels.reports.progress },
        ]
      : dataset === 'conquistas'
        ? [
            { key: 'nome', label: labels.reports.achievement }, { key: 'consultor', label: labels.common.consultor },
            { key: 'area', label: labels.common.area }, { key: 'serviceLine', label: labels.common.serviceLine },
            { key: 'criterio', label: labels.reports.criteria }, { key: 'data', label: labels.common.data },
          ]
        : applicationColumns
  const tabs = [
    ['candidaturas', labels.reports.applications], ['badges', labels.common.badges],
    ['consultores', labels.reports.consultants], ['aprovacoes', labels.reports.approvals],
    ['rejeicoes', labels.reports.rejections], ['conquistas', labels.reports.specialAchievements],
  ]
  const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
  const reset = () => setFilters({ status: 'ALL', area: '', serviceLine: '', learningPath: '', level: '', badgeId: '', from: '', to: '' })
  const maxStatus = Math.max(1, ...report.statusBreakdown.map((item) => item.value))
  const maxMonth = Math.max(1, ...report.monthlyBreakdown.map((item) => item.value))

  return (
    <div>
      <PageHeader title={labels.reports.title} subtitle={labels.reports.subtitle} />

      <Card className="mb-4">
        <div className="row g-3">
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.common.estado}</label><select className="form-select" value={filters.status} onChange={set('status')}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.reports.learningPath}</label><select className="form-select" value={filters.learningPath} onChange={set('learningPath')}><option value="">{labels.reports.allLearningPaths}</option>{(options.learningPaths || []).map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.common.serviceLine}</label><select className="form-select" value={filters.serviceLine} onChange={set('serviceLine')}><option value="">{labels.common.todasServiceLines}</option>{(options.serviceLines || []).map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.common.area}</label><select className="form-select" value={filters.area} onChange={set('area')}><option value="">{labels.common.todasAreas}</option>{(options.areas || []).map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.common.nivel}</label><select className="form-select" value={filters.level} onChange={set('level')}><option value="">{labels.common.todosNiveis}</option>{(options.levels || []).map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="col-sm-6 col-xl-3"><label className="form-label small fw-semibold">{labels.common.badge}</label><select className="form-select" value={filters.badgeId} onChange={set('badgeId')}><option value="">{labels.reports.allBadges}</option>{(options.badges || []).map((badge) => <option key={badge.id} value={badge.id}>{badge.nome}</option>)}</select></div>
          <div className="col-sm-6 col-xl-2"><label className="form-label small fw-semibold">{labels.reports.from}</label><input type="date" className="form-control" value={filters.from} onChange={set('from')} /></div>
          <div className="col-sm-6 col-xl-2"><label className="form-label small fw-semibold">{labels.reports.to}</label><input type="date" className="form-control" value={filters.to} onChange={set('to')} /></div>
          <div className="col-xl-2 d-flex align-items-end"><button type="button" className="btn btn-outline-secondary w-100" onClick={reset}>{labels.common.limparFiltros}</button></div>
        </div>
      </Card>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">{cards.map(({ label, value, icon: Icon, color }) => <div className="col" key={label}><Card className="h-100"><Icon size={20} className={color} /><p className="fs-3 fw-bold mb-0 mt-3">{value}</p><p className="small text-muted mb-0">{label}</p></Card></div>)}</div>

      <Card className="mb-4">
        <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
          <h2 className="h6 fw-bold mb-0">{labels.reports.monthlyPercentage}</h2>
          <span className="small text-muted"><Coins size={14} className="me-1" />{report.totals.awardedPoints || 0} {labels.reports.awardedPoints.toLowerCase()}</span>
        </div>
        {report.monthlyBreakdown.length === 0 ? <p className="small text-muted mb-0">{labels.common.semDados}</p> : (
          <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ minHeight: 190 }}>
            {report.monthlyBreakdown.map((item) => {
              const [year, month] = item.month.split('-').map(Number)
              const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'short', year: '2-digit' })
              return <div key={item.month} className="d-flex flex-column align-items-center justify-content-end flex-shrink-0" style={{ width: 72 }}>
                <strong className="small">{item.percentage}%</strong>
                <span className="fs-xs text-muted">{item.value}</span>
                <div className="w-100 d-flex align-items-end mt-1" style={{ height: 105 }}><div className="w-100 bg-brand rounded-top" style={{ height: `${Math.max(4, (item.value / maxMonth) * 100)}%` }} /></div>
                <span className="mt-1 fs-xs text-muted text-nowrap">{monthLabel}</span>
              </div>
            })}
          </div>
        )}
      </Card>

      <div className="row g-4 mb-4">
        <div className="col-lg-6"><Card className="h-100"><h2 className="h6 fw-bold mb-3">{labels.reports.statusDistribution}</h2>{report.statusBreakdown.length === 0 ? <p className="small text-muted mb-0">{labels.common.semDados}</p> : report.statusBreakdown.map((item) => <div className="mb-3" key={item.code}><div className="d-flex justify-content-between small mb-1"><span>{item.label}</span><strong>{item.value}</strong></div><div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${(item.value / maxStatus) * 100}%` }} /></div></div>)}</Card></div>
        <div className="col-lg-6"><BreakdownTable title={labels.reports.areaDistribution} rows={report.areaBreakdown} labelKey="area" emptyLabel={labels.common.semDados} /></div>
        <div className="col-lg-4"><BreakdownTable title={labels.reports.learningPathDistribution} rows={report.learningPathBreakdown} labelKey="learningPath" emptyLabel={labels.common.semDados} /></div>
        <div className="col-lg-4"><BreakdownTable title={labels.reports.levelDistribution} rows={report.levelBreakdown} labelKey="level" emptyLabel={labels.common.semDados} /></div>
        <div className="col-lg-4"><BreakdownTable title={labels.reports.badgeDistribution} rows={report.badgeBreakdown.slice(0, 10)} labelKey="badge" emptyLabel={labels.common.semDados} extra={(row) => `${row.points} ${labels.common.pontos.toLowerCase()}`} /></div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-1" role="tablist">{tabs.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={dataset === key} className={`btn btn-sm ${dataset === key ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={() => setDataset(key)}>{label}</button>)}</div>
          <ExportButtons data={datasets[dataset]} columns={columns} filename={`talent-manager-${dataset}`} />
        </div>
        {datasets[dataset].length === 0 ? <p className="p-4 small text-muted mb-0">{labels.common.semDados}</p> : (
          <div className="table-responsive"><table className="table table-hover align-middle mb-0 small"><thead className="table-light"><tr>{columns.map((column) => <th className="px-3 py-2" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{datasets[dataset].map((row, index) => <tr key={row.id || `${dataset}-${index}`}>{columns.map((column) => <td className="px-3 py-2" key={column.key}>{row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}
