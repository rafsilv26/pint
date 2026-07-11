import { useMemo, useState } from 'react'
import { Award, Boxes, Network, Route, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'

export default function TalentLearningPathsPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const [search, setSearch] = useState('')
  const { data, loading, error, reload } = useAsync(async () => {
    const [catalog, consultants] = await Promise.all([api.getTalentCatalog(), api.getTalentConsultants()])
    return { catalog, consultants }
  })
  useAutoRefresh(reload)

  const paths = useMemo(() => {
    const activeCatalog = (data?.catalog || []).filter((badge) => badge.ativo !== false)
    const groups = new Map()
    activeCatalog.forEach((badge) => {
      const pathName = badge.learningPath || labels.learningPaths.unassigned
      if (!groups.has(pathName)) groups.set(pathName, { name: pathName, serviceLines: new Map() })
      const path = groups.get(pathName)
      const serviceLineName = badge.serviceLine || '—'
      if (!path.serviceLines.has(serviceLineName)) path.serviceLines.set(serviceLineName, { name: serviceLineName, areas: new Map() })
      const serviceLine = path.serviceLines.get(serviceLineName)
      const areaName = badge.area || '—'
      if (!serviceLine.areas.has(areaName)) serviceLine.areas.set(areaName, { name: areaName, badges: [] })
      serviceLine.areas.get(areaName).badges.push(badge)
    })
    return [...groups.values()].map((path) => ({
      ...path,
      serviceLines: [...path.serviceLines.values()].map((serviceLine) => ({
        ...serviceLine,
        areas: [...serviceLine.areas.values()].map((area) => {
          const consultants = (data?.consultants || []).filter((consultant) => consultant.area === area.name)
          return {
            ...area,
            badges: area.badges.sort((a, b) => String(a.nivel).localeCompare(String(b.nivel))),
            consultants: consultants.length,
            averageProgress: consultants.length ? Math.round(consultants.reduce((sum, consultant) => sum + consultant.progress, 0) / consultants.length) : 0,
          }
        }),
      })),
    })).filter((path) => `${path.name} ${path.serviceLines.map((line) => `${line.name} ${line.areas.map((area) => area.name).join(' ')}`).join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  }, [data, labels.learningPaths.unassigned, search])

  const exportRows = paths.flatMap((path) => path.serviceLines.flatMap((serviceLine) => serviceLine.areas.flatMap((area) => area.badges.map((badge) => ({
    learningPath: path.name, serviceLine: serviceLine.name, area: area.name, nivel: badge.nivel,
    badge: badge.nome, pontos: badge.ponto || 0, requisitos: badge.requisitos?.length || 0,
    consultores: area.consultants, progresso: `${area.averageProgress}%`,
  })))))

  return (
    <div>
      <PageHeader title={labels.learningPaths.title} subtitle={labels.learningPaths.subtitle} action={<ExportButtons data={exportRows} filename="talent-manager-learning-paths" columns={[{ key: 'learningPath', label: labels.reports.learningPath }, { key: 'serviceLine', label: labels.common.serviceLine }, { key: 'area', label: labels.common.area }, { key: 'nivel', label: labels.common.nivel }, { key: 'badge', label: labels.common.badge }, { key: 'pontos', label: labels.common.pontos }, { key: 'requisitos', label: labels.common.requisitos }, { key: 'consultores', label: labels.reports.consultants }, { key: 'progresso', label: labels.reports.progress }]} />} />
      <div className="position-relative mb-4" style={{ maxWidth: 440 }}><Search size={17} className="position-absolute text-muted" style={{ left: 13, top: 11 }} /><input className="form-control ps-5" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.learningPaths.search} /></div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : paths.length === 0 ? <EmptyState icon={Route} title={labels.learningPaths.empty} description={labels.common.semDados} /> : <div className="d-flex flex-column gap-4">{paths.map((path) => <Card key={path.name} className="p-0 overflow-hidden"><div className="d-flex align-items-center gap-3 bg-brand-light px-4 py-3"><Route size={20} className="text-brand" /><h2 className="h5 fw-bold mb-0">{path.name}</h2><span className="badge text-bg-light ms-auto">{t('tmWorkspace.learningPaths.serviceLineCount', { count: path.serviceLines.length })}</span></div>{path.serviceLines.map((serviceLine) => <section key={serviceLine.name} className="px-4 py-3 border-top"><h3 className="h6 d-flex align-items-center gap-2 fw-bold mb-3"><Network size={17} className="text-primary" />{serviceLine.name}</h3><div className="row g-4">{serviceLine.areas.map((area) => <div className="col-xl-6" key={area.name}><div className="d-flex align-items-start justify-content-between gap-3 mb-2"><div><h4 className="small d-flex align-items-center gap-2 fw-bold mb-1"><Boxes size={15} className="text-secondary" />{area.name}</h4><p className="fs-xs text-muted mb-0"><Users size={12} className="me-1" />{t('tmWorkspace.learningPaths.consultantCount', { count: area.consultants })} · {labels.learningPaths.averageProgress}: {area.averageProgress}%</p></div><span className="badge text-bg-light border">{t('tmWorkspace.learningPaths.badgeCount', { count: area.badges.length })}</span></div><div className="progress mb-3" style={{ height: 7 }}><div className="progress-bar" style={{ width: `${area.averageProgress}%` }} /></div><div className="d-flex flex-column gap-2">{area.badges.map((badge) => <div className="d-flex align-items-center gap-2 rounded-2 border px-3 py-2" key={badge.id}><Award size={15} className="text-warning flex-shrink-0" /><span className="small fw-semibold flex-grow-1">{badge.nome}</span><span className="fs-xs text-muted">{badge.nivel}</span><strong className="fs-xs text-brand">{badge.ponto || 0} pt</strong></div>)}</div></div>)}</div></section>)}</Card>)}</div>}
    </div>
  )
}
