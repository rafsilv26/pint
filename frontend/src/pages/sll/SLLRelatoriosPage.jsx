import { useState } from 'react'
import { FileBarChart, Users, Award, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next'

const EMPTY_FILTERS = { area: '', experience: '', status: 'ALL', from: '', to: '' }

export default function SLLRelatoriosPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const { data, loading, error, reload } = useAsync(() => api.getServiceLineReports(filters), [filters.area, filters.experience, filters.status, filters.from, filters.to])
  useAutoRefresh(reload)

  if (loading && !data) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />

  const report = data
  const maxStatus = Math.max(1, ...report.statusBreakdown.map((row) => row.value))
  const maxArea = Math.max(1, ...report.areaBreakdown.map((row) => Math.max(row.awards, row.value)))
  const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))

  const applicationColumns = [
    { key: 'trackingId', label: t('sllRelatorios.tabela.trackingId') },
    { key: 'badge', label: t('sllRelatorios.tabela.badge') },
    { key: 'consultor', label: t('sllRelatorios.tabela.consultor') },
    { key: 'area', label: t('sllRelatorios.tabela.area') },
    { key: 'data', label: t('sllRelatorios.tabela.data') },
    { key: 'estadoTexto', label: t('sllRelatorios.tabela.estado') },
  ]
  const applicationRows = report.applications.map((row) => ({ ...row, estadoTexto: row.status?.name }))
  const badgeColumns = [
    { key: 'nome', label: t('sllRelatorios.tabela.nome') },
    { key: 'area', label: t('sllRelatorios.tabela.area') },
    { key: 'nivel', label: t('sllRelatorios.tabela.nivel') },
    { key: 'fornecedor', label: t('sllRelatorios.tabela.fornecedor') },
    { key: 'ponto', label: t('sllRelatorios.tabela.pontos') },
  ]
  const consultantColumns = [
    { key: 'name', label: t('sllRelatorios.tabela.nome') },
    { key: 'email', label: t('sllRelatorios.tabela.email') },
    { key: 'area', label: t('sllRelatorios.tabela.area') },
    { key: 'badges', label: t('sllRelatorios.tabela.badges') },
    { key: 'points', label: t('sllRelatorios.tabela.pontos') },
    { key: 'progress', label: t('sllRelatorios.tabela.progresso') },
    { key: 'experienceMonths', label: t('sllRelatorios.tabela.experiencia') },
  ]
  const approvalRows = report.approvals.map((row) => ({ ...row, estadoTexto: row.status?.name }))
  const sections = [
    { key: 'pedidos', data: applicationRows, columns: applicationColumns },
    { key: 'badges', data: report.catalog, columns: badgeColumns },
    { key: 'consultores', data: report.consultants, columns: consultantColumns },
    { key: 'aprovacoes', data: approvalRows, columns: applicationColumns },
  ]
  const summary = [
    { label: t('sllRelatorios.resumo.badgesAtribuidos'), value: report.totals.awards, icon: Award, color: '#7c3aed', background: '#ede9fe' },
    { label: t('sllRelatorios.resumo.totalPedidos'), value: report.totals.applications, icon: FileBarChart, color: '#d97706', background: '#fef3c7' },
    { label: t('sllRelatorios.resumo.aprovacoes'), value: report.totals.approvals, icon: CheckCircle2, color: '#16a34a', background: '#dcfce7' },
    { label: t('sllRelatorios.resumo.consultores'), value: report.totals.consultants, icon: Users, color: '#0284c7', background: '#e0f2fe' },
  ]

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="fs-2 fw-bold text-ink">{t('sllRelatorios.titulo')}</h1>
        <p className="small text-muted mb-0">{t('sllRelatorios.subtitulo')}</p>
      </div>

      <div className="row g-3 align-items-end">
        <div className="col-sm-6 col-xl-2"><label className="form-label small fw-medium">{t('sllRelatorios.filtros.area')}</label><select className="form-select" value={filters.area} onChange={setFilter('area')}><option value="">{t('sllRelatorios.filtros.todasAreas')}</option>{report.filterOptions.areas.map((area) => <option key={area} value={area}>{area}</option>)}</select></div>
        <div className="col-sm-6 col-xl-2"><label className="form-label small fw-medium">{t('sllRelatorios.filtros.experiencia')}</label><select className="form-select" value={filters.experience} onChange={setFilter('experience')}><option value="">{t('sllRelatorios.filtros.todasExperiencias')}</option>{report.filterOptions.experienceBands.map((band) => <option key={band} value={band}>{t(`sllRelatorios.experiencia.${band}`)}</option>)}</select></div>
        <div className="col-sm-6 col-xl-2"><label className="form-label small fw-medium">{t('sllRelatorios.filtros.estado')}</label><select className="form-select" value={filters.status} onChange={setFilter('status')}><option value="ALL">{t('sllRelatorios.filtros.todosEstados')}</option>{['OPEN', 'SUBMITTED', 'IN_VALIDATION', 'VALIDATED', 'IN_APPROVAL', 'APPROVED', 'REJECTED'].map((code) => <option key={code} value={code}>{t(`api.statusCodes.${code}`)}</option>)}</select></div>
        <div className="col-sm-6 col-xl-2"><label className="form-label small fw-medium">{t('sllRelatorios.filtros.desde')}</label><input type="date" className="form-control" value={filters.from} onChange={setFilter('from')} /></div>
        <div className="col-sm-6 col-xl-2"><label className="form-label small fw-medium">{t('sllRelatorios.filtros.ate')}</label><input type="date" className="form-control" value={filters.to} onChange={setFilter('to')} /></div>
        <div className="col-xl-2"><button type="button" className="btn btn-outline-secondary bg-white w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={() => setFilters(EMPTY_FILTERS)}><RotateCcw size={16} />{t('sllRelatorios.filtros.limpar')}</button></div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
        {summary.map((item) => <div className="col" key={item.label}><Card className="d-flex align-items-center gap-3"><div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, color: item.color, backgroundColor: item.background }}><item.icon size={22} /></div><div><p className="fs-3 fw-bold text-ink mb-0">{item.value}</p><p className="small text-muted mb-0">{item.label}</p></div></Card></div>)}
      </div>

      <div className="row g-4">
        <div className="col-lg-6"><Card className="h-100"><h2 className="h6 fw-bold mb-3">{t('sllRelatorios.distribuicaoEstados')}</h2>{report.statusBreakdown.length === 0 ? <p className="small text-muted mb-0">{t('sllRelatorios.semDados')}</p> : <div className="d-flex flex-column gap-3">{report.statusBreakdown.map((row) => <div key={row.code}><div className="mb-1 d-flex justify-content-between small"><span>{row.label}</span><strong>{row.value}</strong></div><div className="progress" style={{ height: 8 }}><div className="progress-bar bg-brand" style={{ width: `${(row.value / maxStatus) * 100}%` }} /></div></div>)}</div>}</Card></div>
        <div className="col-lg-6"><Card className="h-100"><h2 className="h6 fw-bold mb-3">{t('sllRelatorios.distribuicaoAreas')}</h2>{report.areaBreakdown.length === 0 ? <p className="small text-muted mb-0">{t('sllRelatorios.semDados')}</p> : <div className="d-flex flex-column gap-3">{report.areaBreakdown.map((row) => <div key={row.area}><div className="mb-1 d-flex justify-content-between small"><span>{row.area}</span><span>{t('sllRelatorios.areaResumo', { applications: row.value, awards: row.awards })}</span></div><div className="progress" style={{ height: 8 }}><div className="progress-bar bg-success" style={{ width: `${(row.awards / maxArea) * 100}%` }} /></div></div>)}</div>}</Card></div>
      </div>

      <section>
        <h2 className="h5 fw-bold text-ink mb-3">{t('sllRelatorios.comparacaoTitulo')}</h2>
        {report.comparison.length === 0 ? <EmptyState icon={Users} title={t('sllRelatorios.semDados')} description={t('sllRelatorios.semDadosDescricao')} /> : <div className="table-responsive rounded-3 border bg-white"><table className="table table-hover align-middle small mb-0"><thead className="table-light"><tr><th className="px-3">#</th><th>{t('sllRelatorios.tabela.consultor')}</th><th>{t('sllRelatorios.tabela.area')}</th><th>{t('sllRelatorios.tabela.experiencia')}</th><th>{t('sllRelatorios.tabela.badges')}</th><th>{t('sllRelatorios.tabela.pontos')}</th><th>{t('sllRelatorios.tabela.progresso')}</th><th>{t('sllRelatorios.tabela.premium')}</th></tr></thead><tbody>{report.comparison.map((row, index) => <tr key={row.id}><td className="px-3 fw-bold text-muted">{index + 1}</td><td className="fw-semibold">{row.name}</td><td>{row.area || '—'}</td><td>{t('sllRelatorios.mesesExperiencia', { count: row.experienceMonths })}</td><td>{row.badges}</td><td>{row.points}</td><td style={{ minWidth: 140 }}><div className="d-flex align-items-center gap-2"><div className="progress flex-grow-1" style={{ height: 7 }}><div className="progress-bar bg-brand" style={{ width: `${row.progress}%` }} /></div><span>{row.progress}%</span></div></td><td>{row.specials || 0}</td></tr>)}</tbody></table></div>}
      </section>

      {report.specialAchievements.length > 0 && <section><h2 className="h5 fw-bold text-ink mb-3"><Sparkles size={19} className="me-2 text-warning" />{t('sllRelatorios.premiumTitulo')}</h2><div className="row row-cols-1 row-cols-md-2 g-3">{report.specialAchievements.map((item) => <div className="col" key={`${item.consultantId}-${item.badgePremiumId}`}><Card><p className="small fw-bold mb-1">{item.name}</p><p className="fs-xs text-muted mb-1">{item.consultor} · {item.area}</p><p className="small text-muted mb-0">{item.description || item.criteriaDescription}</p></Card></div>)}</div></section>}

      <section><h2 className="h5 fw-bold text-ink mb-3">{t('sllRelatorios.exportacoesTitulo')}</h2><div className="row row-cols-1 row-cols-md-2 g-3">{sections.map((section) => <div className="col" key={section.key}><Card className="d-flex flex-wrap align-items-center justify-content-between gap-3"><div><h3 className="h6 fw-bold mb-1">{t(`sllRelatorios.seccoes.${section.key}.titulo`)}</h3><p className="small text-muted mb-0">{t(`sllRelatorios.seccoes.${section.key}.descricao`)}</p></div><ExportButtons data={section.data} columns={section.columns} filename={`${section.key}-service-line`} /></Card></div>)}</div></section>
    </div>
  )
}
