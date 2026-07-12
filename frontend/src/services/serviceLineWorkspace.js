import { http } from './http.js'

const CACHE_MS = 30_000
const array = (value) => (Array.isArray(value) ? value : [])
const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const dateValue = (value) => toDate(value)?.getTime() || 0
const dateLabel = (value, locale = 'pt-PT') => toDate(value)?.toLocaleDateString(locale) || '—'
const byId = (rows) => new Map(array(rows).map((row) => [Number(row.id), row]))
const experienceInMonths = (value, now) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{4})$/)
  if (!match) return 0
  const month = Number(match[1]) - 1
  const year = Number(match[2])
  return Math.max(0, (now.getFullYear() - year) * 12 + now.getMonth() - month)
}
const experienceBand = (months) => {
  if (months < 12) return '0-11'
  if (months < 36) return '12-35'
  return '36+'
}

let cache = null
let cacheAt = 0
let pendingRequest = null

export function normalizeServiceLineWorkspace(raw, now = new Date()) {
  const levels = array(raw.levels)
  const areas = array(raw.areas)
  const serviceLines = array(raw.serviceLines)
  const learningPaths = array(raw.learningPaths)
  const requirements = array(raw.requirements)
  const levelMap = byId(levels)
  const areaMap = byId(areas)
  const serviceLineMap = byId(serviceLines)
  const learningPathMap = byId(learningPaths)

  const catalog = array(raw.badges).map((badge) => {
    const level = levelMap.get(Number(badge.nivelId)) || {}
    const area = areaMap.get(Number(level.areaId)) || {}
    const serviceLine = serviceLineMap.get(Number(area.serviceLineId)) || {}
    const learningPath = learningPathMap.get(Number(serviceLine.learningPathId)) || {}
    return {
      ...badge,
      nivel: level.nome || level.ordem || badge.nivelId || '—',
      areaId: area.id,
      area: area.nome || '—',
      serviceLineId: serviceLine.id,
      serviceLine: serviceLine.nome || '—',
      learningPath: learningPath.nome || '—',
      requisitos: requirements.filter((item) => Number(item.nivelId) === Number(badge.nivelId)),
    }
  })
  const badgeMap = byId(catalog)

  const consultants = array(raw.consultants?.data || raw.consultants).map((consultant) => {
    const awards = array(consultant.badgesConquistados).map((award) => {
      const badge = badgeMap.get(Number(award.id ?? award.badgeId)) || {}
      return {
        ...award,
        badgeId: Number(award.id ?? award.badgeId),
        nome: award.nome || badge.nome || 'Badge',
        area: badge.area || consultant.area || '—',
        serviceLine: badge.serviceLine || consultant.serviceLine || '—',
        nivel: badge.nivel || award.nivelId || '—',
        pontos: Number(award.pontos ?? award.pointsObtained ?? badge.ponto ?? 0),
        obtainedAt: award.obtidoEm ?? award.obtainedDate,
        expirationDate: award.expiraEm ?? award.expirationDate,
      }
    })
    const available = catalog.filter((badge) => Number(badge.areaId) === Number(consultant.areaId) && badge.ativo !== false)
    const acquiredIds = new Set(awards.map((award) => Number(award.badgeId)))
    const completed = available.filter((badge) => acquiredIds.has(Number(badge.id))).length
    const progress = available.length ? Math.round((completed / available.length) * 100) : 0
    const experienceMonths = experienceInMonths(consultant.startDate, now)
    const thisMonth = awards.filter((award) => {
      const date = toDate(award.obtainedAt)
      return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    })
    return {
      ...consultant,
      awards,
      badgesConquistados: awards,
      specialAchievements: array(consultant.specialAchievements),
      progress,
      pathCompleted: completed,
      pathTotal: available.length,
      monthlyBadges: thisMonth.length,
      monthlyPoints: thisMonth.reduce((sum, award) => sum + award.pontos, 0),
      experienceMonths,
      experienceBand: experienceBand(experienceMonths),
    }
  })

  const applications = array(raw.applications).map((application) => {
    const badge = badgeMap.get(Number(application.badgeId)) || application.Badge || {}
    const status = application.status || {}
    return {
      ...application,
      trackingId: `#${String(application.id).padStart(5, '0')}`,
      badge: badge.nome || application.Badge?.nome || `Badge ${application.badgeId}`,
      consultor: application.Consultant?.User?.nome || `Consultor ${application.consultorId}`,
      area: badge.area || '—',
      areaId: badge.areaId,
      serviceLine: badge.serviceLine || '—',
      nivel: badge.nivel || application.Badge?.nivelId || '—',
      pontos: Number(badge.ponto ?? application.Badge?.ponto ?? 0),
      submittedAt: application.dataSubmicao || application.createdAt,
      data: dateLabel(application.dataSubmicao || application.createdAt),
      decisionAt: application.dataAprovacao || application.updatedAt,
      decisionDate: dateLabel(application.dataAprovacao || application.updatedAt),
      status: { code: status.code || 'OPEN', name: status.name || status.code || '—' },
      evidenceCount: array(application.evidencias).length,
    }
  }).sort((a, b) => dateValue(b.submittedAt) - dateValue(a.submittedAt))

  const awards = consultants.flatMap((consultant) => consultant.awards.map((award) => ({
    ...award,
    consultantId: consultant.id,
    consultor: consultant.name,
  })))

  return {
    consultants,
    catalog,
    applications,
    awards,
    areas,
    serviceLines,
    learningPaths,
    badgesWeek: array(raw.badgesWeek).length === 7 ? raw.badgesWeek : [0, 0, 0, 0, 0, 0, 0],
    generatedAt: new Date(),
  }
}

export function filterServiceLineApplications(rows, filters = {}) {
  const query = String(filters.search || '').trim().toLowerCase()
  return array(rows).filter((row) => {
    if (filters.status && filters.status !== 'ALL' && row.status?.code !== filters.status) return false
    if (filters.area && String(row.area) !== String(filters.area)) return false
    const date = toDate(row.submittedAt)
    if (filters.from && date && date < new Date(`${filters.from}T00:00:00`)) return false
    if (filters.to && date && date > new Date(`${filters.to}T23:59:59`)) return false
    if (query && !`${row.trackingId} ${row.consultor} ${row.badge} ${row.area}`.toLowerCase().includes(query)) return false
    return true
  })
}

export function buildServiceLineDecisionHistory(rows) {
  const decisionCodes = new Set(['APPROVED', 'REJECTED', 'OPEN'])

  return array(rows).flatMap((application) => {
    const decisions = array(application.history).filter((event) =>
      event.oldStatus?.code === 'VALIDATED' && decisionCodes.has(event.newStatus?.code)
    )

    if (decisions.length > 0) {
      return decisions.map((event, index) => ({
        id: event.id ?? `${application.id}-${index}`,
        requestId: application.id,
        trackingId: application.trackingId || `#${String(application.id).padStart(5, '0')}`,
        badge: application.badge,
        consultor: application.consultor,
        code: event.newStatus.code,
        statusName: event.newStatus.name || event.newStatus.code,
        decidedAt: event.createdAt,
        author: event.responsavel?.nome || '',
        comment: event.motivo || event.reason || '',
      }))
    }

    const code = application.status?.code
    const isFinalDecision = ['APPROVED', 'REJECTED'].includes(code)
    const isReturned = code === 'OPEN' && (application.serviceLineLeaderId != null || application.comentario)
    if (!isFinalDecision && !isReturned) return []

    return [{
      id: `${application.id}-current`,
      requestId: application.id,
      trackingId: application.trackingId || `#${String(application.id).padStart(5, '0')}`,
      badge: application.badge,
      consultor: application.consultor,
      code,
      statusName: application.status?.name || code,
      decidedAt: application.decisionAt || application.updatedAt,
      author: '',
      comment: application.comentario || '',
    }]
  }).sort((a, b) => dateValue(b.decidedAt) - dateValue(a.decidedAt))
}

export function buildServiceLineProfile(workspace) {
  const serviceLine = array(workspace?.serviceLines)[0] || null
  const learningPath = array(workspace?.learningPaths).find(
    (row) => Number(row.id) === Number(serviceLine?.learningPathId),
  ) || null
  const applications = array(workspace?.applications)

  return {
    serviceLine: serviceLine ? {
      id: serviceLine.id,
      nome: serviceLine.nome,
      descricao: serviceLine.descricao || '',
    } : null,
    learningPath: learningPath ? {
      id: learningPath.id,
      nome: learningPath.nome,
    } : null,
    areas: array(workspace?.areas).map((area) => ({ id: area.id, nome: area.nome })),
    stats: {
      consultants: array(workspace?.consultants).length,
      availableBadges: array(workspace?.catalog).filter((badge) => badge.ativo !== false).length,
      pendingApprovals: applications.filter((row) => row.status?.code === 'VALIDATED').length,
      awardedBadges: array(workspace?.awards).length,
    },
    generatedAt: workspace?.generatedAt || null,
  }
}

export function buildServiceLineReport(workspace, filters = {}) {
  const applications = filterServiceLineApplications(workspace.applications, filters)
  const consultants = workspace.consultants.filter((row) =>
    (!filters.area || row.area === filters.area) &&
    (!filters.experience || row.experienceBand === filters.experience)
  )
  const catalog = workspace.catalog.filter((row) => !filters.area || row.area === filters.area)
  const awards = workspace.awards.filter((award) => {
    if (filters.area && award.area !== filters.area) return false
    const date = toDate(award.obtainedAt)
    if (filters.from && date && date < new Date(`${filters.from}T00:00:00`)) return false
    if (filters.to && date && date > new Date(`${filters.to}T23:59:59`)) return false
    return true
  })
  const approvals = applications.filter((row) => row.status.code === 'APPROVED')
  const rejections = applications.filter((row) => row.status.code === 'REJECTED')
  const specialAchievements = consultants.flatMap((consultant) => consultant.specialAchievements.map((achievement) => ({
    ...achievement,
    consultantId: consultant.id,
    consultor: consultant.name,
    area: consultant.area,
  })))

  const statusBreakdown = [...new Set(applications.map((row) => row.status.code))].map((code) => ({
    code,
    label: applications.find((row) => row.status.code === code)?.status.name || code,
    value: applications.filter((row) => row.status.code === code).length,
  })).sort((a, b) => b.value - a.value)
  const areaBreakdown = [...new Set(workspace.applications.map((row) => row.area))].map((area) => ({
    area,
    value: applications.filter((row) => row.area === area).length,
    awards: awards.filter((award) => award.area === area).length,
  })).filter((row) => row.value || row.awards).sort((a, b) => b.awards - a.awards || b.value - a.value)
  const monthly = new Map()
  awards.forEach((award) => {
    const date = toDate(award.obtainedAt)
    if (!date) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthly.set(key, (monthly.get(key) || 0) + 1)
  })

  return {
    applications,
    consultants,
    catalog,
    awards,
    approvals,
    rejections,
    specialAchievements,
    statusBreakdown,
    areaBreakdown,
    monthlyBreakdown: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value })),
    comparison: consultants.slice().sort((a, b) => b.progress - a.progress || b.points - a.points),
    filterOptions: {
      areas: [...new Set(workspace.areas.map((area) => area.nome).filter(Boolean))].sort(),
      experienceBands: [...new Set(workspace.consultants.map((row) => row.experienceBand).filter(Boolean))],
    },
    totals: {
      applications: applications.length,
      consultants: consultants.length,
      catalog: catalog.length,
      awards: awards.length,
      approvals: approvals.length,
      rejections: rejections.length,
      specialAchievements: specialAchievements.length,
      points: awards.reduce((sum, award) => sum + award.pontos, 0),
    },
  }
}

async function fetchServiceLineWorkspace() {
  const [consultants, applications, badges, levels, areas, serviceLines, learningPaths, requirements, badgesWeek] = await Promise.all([
    http('/consultants'),
    http('/candidaturas/serviceline/todas'),
    http('/catalog/badges'),
    http('/catalog/levels'),
    http('/catalog/areas'),
    http('/catalog/service-lines'),
    http('/catalog/learning-paths'),
    http('/catalog/requirements'),
    http('/candidaturas/badges-semana'),
  ])
  return normalizeServiceLineWorkspace({ consultants, applications, badges, levels, areas, serviceLines, learningPaths, requirements, badgesWeek })
}

export async function getServiceLineWorkspace(force = false) {
  if (!force && cache && Date.now() - cacheAt < CACHE_MS) return cache
  if (pendingRequest) return pendingRequest
  pendingRequest = fetchServiceLineWorkspace()
    .then((workspace) => {
      cache = workspace
      cacheAt = Date.now()
      return workspace
    })
    .finally(() => { pendingRequest = null })
  return pendingRequest
}

export function invalidateServiceLineWorkspace() {
  cacheAt = 0
}
