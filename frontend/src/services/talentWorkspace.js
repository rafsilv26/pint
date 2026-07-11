import { http } from './http.js'

const CACHE_MS = 30_000
const DAY_MS = 86_400_000

const STATUS_META = {
  OPEN: { name: 'Aberta', cor: 'gray', progress: 10 },
  SUBMITTED: { name: 'Submetida', cor: 'blue', progress: 30 },
  IN_VALIDATION: { name: 'Em validacao', cor: 'amber', progress: 50 },
  VALIDATED: { name: 'Validada pelo Talent Manager', cor: 'indigo', progress: 70 },
  IN_APPROVAL: { name: 'Em aprovacao', cor: 'amber', progress: 85 },
  APPROVED: { name: 'Aprovada', cor: 'green', progress: 100 },
  REJECTED: { name: 'Rejeitada', cor: 'red', progress: 0 },
}

let cache = null
let cacheAt = 0
let pendingRequest = null

const array = (value) => (Array.isArray(value) ? value : [])
const byId = (rows, key = 'id') => new Map(array(rows).map((row) => [Number(row[key]), row]))
const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const dateValue = (value) => toDate(value)?.getTime() || 0
const dateLabel = (value, locale = 'pt-PT') => toDate(value)?.toLocaleDateString(locale) || '—'

export function getExpirationState(expirationDate, valid = true, now = new Date()) {
  const expiration = toDate(expirationDate)
  if (!expiration) return { code: valid === false ? 'expired' : 'permanent', days: null }
  const days = Math.ceil((expiration.getTime() - now.getTime()) / DAY_MS)
  if (valid === false || days < 0) return { code: 'expired', days }
  if (days <= 90) return { code: 'soon', days }
  return { code: 'valid', days }
}

export function getEvidenceCoverage(requirements, evidences) {
  const required = array(requirements).filter((requirement) => requirement.obrigatorio !== false)
  const coveredIds = new Set(array(evidences).filter((evidence) => evidence.validado === true).map((evidence) => Number(evidence.requisitoId)))
  const missing = required.filter((requirement) => !coveredIds.has(Number(requirement.id)))
  return {
    required,
    missing,
    covered: required.length - missing.length,
    complete: array(evidences).length > 0 && array(evidences).every((evidence) => evidence.validado === true) && missing.length === 0,
  }
}

export function normalizeTalentWorkspace(raw, now = new Date()) {
  const consultants = array(raw.consultants?.data || raw.consultants)
  const users = array(raw.users)
  const badges = array(raw.badges)
  const levels = array(raw.levels)
  const areas = array(raw.areas)
  const serviceLines = array(raw.serviceLines)
  const learningPaths = array(raw.learningPaths)
  const requirements = array(raw.requirements)
  const statuses = array(raw.statuses)
  const premiumBadges = array(raw.premiumBadges)
  const premiumAwards = array(raw.premiumAwards)
  const timelines = array(raw.timelines)

  const levelMap = byId(levels)
  const areaMap = byId(areas)
  const serviceLineMap = byId(serviceLines)
  const learningPathMap = byId(learningPaths)
  const statusById = byId(statuses, 'statusId')
  const userMap = byId(users)
  const premiumMap = byId(premiumBadges, 'badgePremiumId')

  const catalog = badges.map((badge) => {
    const level = levelMap.get(Number(badge.nivelId)) || {}
    const area = areaMap.get(Number(level.areaId)) || {}
    const serviceLine = serviceLineMap.get(Number(area.serviceLineId)) || {}
    const learningPath = learningPathMap.get(Number(serviceLine.learningPathId)) || {}
    return {
      ...badge,
      nivel: level.nome || level.ordem || String(badge.nivelId ?? '—'),
      level,
      areaId: area.id,
      area: area.nome || '—',
      serviceLineId: serviceLine.id,
      serviceLine: serviceLine.nome || '—',
      learningPathId: learningPath.id,
      learningPath: learningPath.nome || '—',
      requisitos: requirements
        .filter((requirement) => Number(requirement.nivelId) === Number(badge.nivelId))
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)),
    }
  })
  const badgeMap = byId(catalog)

  const candidateRows = array(raw.candidaturas).flat()
  const uniqueCandidates = [...new Map(candidateRows.map((row) => [Number(row.id), row])).values()]
  const candidateMap = new Map()

  const talentConsultants = consultants.map((consultant) => {
    const consultantId = Number(consultant.id ?? consultant.consultorId)
    const consultantArea = areas.find((area) => area.nome === consultant.area) || {}
    const consultantServiceLine = serviceLineMap.get(Number(consultantArea.serviceLineId)) || serviceLines.find((serviceLine) => serviceLine.nome === consultant.serviceLine) || {}
    const consultantLearningPath = learningPathMap.get(Number(consultantServiceLine.learningPathId)) || {}
    const awards = array(consultant.badgesConquistados).map((award) => {
      const badge = badgeMap.get(Number(award.id ?? award.badgeId)) || {}
      const expirationDate = award.expiraEm ?? award.expirationDate
      return {
        ...award,
        badgeId: Number(award.id ?? award.badgeId),
        nome: award.nome || badge.nome || 'Badge',
        nivel: badge.nivel || award.nivelId || '—',
        area: badge.area || consultant.area || '—',
        serviceLine: badge.serviceLine || consultant.serviceLine || '—',
        learningPath: badge.learningPath || '—',
        pontos: award.pontos ?? award.pointsObtained ?? badge.ponto ?? 0,
        obtainedDate: award.obtidoEm ?? award.obtainedDate,
        expirationDate,
        expiration: getExpirationState(expirationDate, award.valido ?? award.valid, now),
        publicToken: badge.publicToken || award.publicToken || '',
      }
    })
    const specials = premiumAwards
      .filter((award) => Number(award.consultorId) === consultantId)
      .map((award) => ({ ...award, ...(premiumMap.get(Number(award.badgePremiumId)) || {}) }))
    const consultantTimeline = timelines
      .filter((item) => Number(item.consultorId) === consultantId)
      .sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate))
    const consultantCandidates = uniqueCandidates.filter((row) => Number(row.consultorId) === consultantId)
    const areaCatalog = catalog.filter((badge) => badge.area === consultant.area && badge.ativo !== false)
    const completedIds = new Set(awards.map((award) => Number(award.badgeId)))
    const totalPath = areaCatalog.length
    const completedPath = areaCatalog.filter((badge) => completedIds.has(Number(badge.id))).length
    const progress = totalPath ? Math.round((completedPath / totalPath) * 100) : 0
    return {
      ...consultant,
      id: consultantId,
      learningPath: consultantLearningPath.nome || '—',
      awards,
      badgesConquistados: awards,
      specialAchievements: specials,
      timeline: consultantTimeline,
      progress,
      pathCompleted: completedPath,
      pathTotal: totalPath,
      expiringCount: awards.filter((award) => award.expiration.code === 'soon').length,
      expiredCount: awards.filter((award) => award.expiration.code === 'expired').length,
      activeApplications: consultantCandidates.filter((row) => !['APPROVED', 'REJECTED'].includes(row.status?.code)).length,
    }
  })
  const consultantMap = byId(talentConsultants)

  uniqueCandidates.forEach((candidate) => {
    const rawStatus = candidate.status || statusById.get(Number(candidate.estadoId)) || {}
    const code = rawStatus.code || 'OPEN'
    const meta = STATUS_META[code] || STATUS_META.OPEN
    const consultant = consultantMap.get(Number(candidate.consultorId)) || {}
    const badge = badgeMap.get(Number(candidate.badgeId)) || candidate.Badge || {}
    const history = array(candidate.history).map((item) => {
      const status = statusById.get(Number(item.estadoNovo)) || {}
      return {
        ...item,
        estado: STATUS_META[status.code]?.name || status.name || 'Atualizacao de estado',
        code: status.code,
        data: item.createdAt,
        motivo: item.motivo || '',
        autor: userMap.get(Number(item.userId))?.nome || '',
      }
    }).sort((a, b) => dateValue(a.data) - dateValue(b.data))
    candidateMap.set(Number(candidate.id), {
      ...candidate,
      trackingId: `#${String(candidate.id).padStart(5, '0')}`,
      consultantId: Number(candidate.consultorId),
      consultor: candidate.Consultant?.User?.nome || consultant.name || `Consultor ${candidate.consultorId}`,
      email: candidate.Consultant?.User?.email || consultant.email || '',
      area: badge.area || consultant.area || '—',
      serviceLine: badge.serviceLine || consultant.serviceLine || '—',
      learningPath: badge.learningPath || '—',
      badgeId: Number(candidate.badgeId),
      badge: badge.nome || candidate.Badge?.nome || `Badge ${candidate.badgeId}`,
      nivel: badge.nivel || '—',
      pontos: badge.ponto ?? candidate.Badge?.ponto ?? 0,
      requirements: array(badge.requisitos),
      submittedAt: candidate.dataSubmicao || candidate.createdAt,
      data: dateLabel(candidate.dataSubmicao || candidate.createdAt),
      status: { code, name: meta.name, cor: meta.cor },
      progress: meta.progress,
      evidencias: array(candidate.evidencias),
      historico: history,
    })
  })

  const candidaturas = [...candidateMap.values()].sort((a, b) => dateValue(b.submittedAt) - dateValue(a.submittedAt))
  const awards = talentConsultants.flatMap((consultant) => consultant.awards.map((award) => ({ ...award, consultantId: consultant.id, consultor: consultant.name })))
  const expiring = awards.filter((award) => ['soon', 'expired'].includes(award.expiration.code)).sort((a, b) => dateValue(a.expirationDate) - dateValue(b.expirationDate))

  return {
    consultants: talentConsultants,
    users,
    catalog,
    candidaturas,
    awards,
    expiring,
    serviceLines,
    areas,
    learningPaths,
    statuses,
    premiumBadges,
    generatedAt: new Date(),
  }
}

async function fetchWorkspace() {
  const [consultants, users, badges, levels, areas, serviceLines, learningPaths, requirements, statuses, premiumBadges, premiumAwards, timelines, globalApplications] = await Promise.all([
    http('/consultants'),
    http('/users').catch(() => []),
    http('/catalog/badges'),
    http('/catalog/levels'),
    http('/catalog/areas'),
    http('/catalog/service-lines'),
    http('/catalog/learning-paths'),
    http('/catalog/requirements'),
    http('/catalog/badge-statuses'),
    http('/catalog/badge-premium').catch(() => []),
    http('/catalog/consultor-badge-premium').catch(() => []),
    http('/catalog/timeline').catch(() => []),
    http('/candidaturas/serviceline/todas').catch(() => null),
  ])
  const rows = array(consultants?.data || consultants)
  let applications = array(globalApplications)
  if (globalApplications == null) {
    const histories = await Promise.allSettled(rows.map((consultant) => http(`/candidaturas/consultor/${consultant.id}`)))
    applications = histories.filter((result) => result.status === 'fulfilled').flatMap((result) => array(result.value))
  }
  return normalizeTalentWorkspace({
    consultants,
    users,
    badges,
    levels,
    areas,
    serviceLines,
    learningPaths,
    requirements,
    statuses,
    premiumBadges,
    premiumAwards,
    timelines,
    candidaturas: applications,
  })
}

export async function getTalentWorkspace(force = false) {
  if (!force && cache && Date.now() - cacheAt < CACHE_MS) return cache
  if (pendingRequest) return pendingRequest
  pendingRequest = fetchWorkspace()
    .then((workspace) => {
      cache = workspace
      cacheAt = Date.now()
      return workspace
    })
    .finally(() => { pendingRequest = null })
  return pendingRequest
}

export function invalidateTalentWorkspace() {
  cacheAt = 0
}

export function filterTalentCandidaturas(rows, filters = {}) {
  const search = String(filters.search || '').trim().toLowerCase()
  return array(rows).filter((row) => {
    if (filters.status && filters.status !== 'ALL' && row.status?.code !== filters.status) return false
    if (filters.area && String(row.area) !== String(filters.area)) return false
    if (filters.serviceLine && String(row.serviceLine) !== String(filters.serviceLine)) return false
    if (filters.learningPath && String(row.learningPath) !== String(filters.learningPath)) return false
    if (filters.level && String(row.nivel) !== String(filters.level)) return false
    if (filters.badgeId && Number(row.badgeId) !== Number(filters.badgeId)) return false
    const date = toDate(row.submittedAt)
    if (filters.from && date && date < new Date(`${filters.from}T00:00:00`)) return false
    if (filters.to && date && date > new Date(`${filters.to}T23:59:59`)) return false
    if (search && !`${row.trackingId} ${row.consultor} ${row.badge} ${row.area} ${row.serviceLine}`.toLowerCase().includes(search)) return false
    return true
  })
}

export function buildTalentReport(workspace, filters = {}) {
  const candidaturas = filterTalentCandidaturas(workspace.candidaturas, filters)
  const consultants = workspace.consultants.filter((consultant) =>
    (!filters.area || consultant.area === filters.area) &&
    (!filters.serviceLine || consultant.serviceLine === filters.serviceLine) &&
    (!filters.learningPath || consultant.learningPath === filters.learningPath)
  )
  const awards = workspace.awards.filter((award) => {
    if (filters.area && award.area !== filters.area) return false
    if (filters.serviceLine && award.serviceLine !== filters.serviceLine) return false
    if (filters.learningPath && award.learningPath !== filters.learningPath) return false
    if (filters.level && String(award.nivel) !== String(filters.level)) return false
    if (filters.badgeId && Number(award.badgeId) !== Number(filters.badgeId)) return false
    const date = toDate(award.obtainedDate)
    if (filters.from && date && date < new Date(`${filters.from}T00:00:00`)) return false
    if (filters.to && date && date > new Date(`${filters.to}T23:59:59`)) return false
    return true
  })
  const statusBreakdown = Object.entries(STATUS_META).map(([code, meta]) => ({
    code,
    label: meta.name,
    value: candidaturas.filter((row) => row.status.code === code).length,
  })).filter((item) => item.value > 0)
  const areaBreakdown = [...new Set(candidaturas.map((row) => row.area))].map((area) => ({
    area,
    value: candidaturas.filter((row) => row.area === area).length,
  })).sort((a, b) => b.value - a.value)
  const groupAwards = (key, labelKey = key) => [...new Set(awards.map((award) => award[key] || '—'))].map((value) => ({
    [labelKey]: value,
    value: awards.filter((award) => (award[key] || '—') === value).length,
  })).sort((a, b) => b.value - a.value)
  const learningPathBreakdown = groupAwards('learningPath')
  const levelBreakdown = groupAwards('nivel', 'level')
  const badgeBreakdown = [...new Set(awards.map((award) => award.badgeId))].map((badgeId) => {
    const matching = awards.filter((award) => Number(award.badgeId) === Number(badgeId))
    return {
      badgeId,
      badge: matching[0]?.nome || `Badge ${badgeId}`,
      value: matching.length,
      points: matching.reduce((sum, award) => sum + Number(award.pontos || 0), 0),
    }
  }).sort((a, b) => b.value - a.value)
  const months = new Map()
  awards.forEach((award) => {
    const date = toDate(award.obtainedDate)
    if (!date) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.set(key, (months.get(key) || 0) + 1)
  })
  const monthlyBreakdown = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({
    month,
    value,
    percentage: awards.length ? Math.round((value / awards.length) * 100) : 0,
  }))
  const specialAchievements = workspace.consultants.flatMap((consultant) => consultant.specialAchievements.map((achievement) => ({
    ...achievement,
    consultantId: consultant.id,
    consultor: consultant.name,
    area: consultant.area || '—',
    serviceLine: consultant.serviceLine || '—',
    learningPath: consultant.learningPath || '—',
  }))).filter((achievement) =>
    (!filters.area || achievement.area === filters.area) &&
    (!filters.serviceLine || achievement.serviceLine === filters.serviceLine) &&
    (!filters.learningPath || achievement.learningPath === filters.learningPath)
  )
  return {
    candidaturas,
    consultants,
    awards,
    approvals: candidaturas.filter((row) => row.status.code === 'APPROVED'),
    rejections: candidaturas.filter((row) => row.status.code === 'REJECTED'),
    statusBreakdown,
    areaBreakdown,
    learningPathBreakdown,
    levelBreakdown,
    badgeBreakdown,
    monthlyBreakdown,
    specialAchievements,
    filterOptions: {
      areas: [...new Set(workspace.areas.map((area) => area.nome).filter(Boolean))].sort(),
      serviceLines: [...new Set(workspace.serviceLines.map((serviceLine) => serviceLine.nome).filter(Boolean))].sort(),
      learningPaths: [...new Set(workspace.learningPaths.map((path) => path.nome).filter(Boolean))].sort(),
      levels: [...new Set(workspace.catalog.map((badge) => badge.nivel).filter(Boolean))].sort(),
      badges: workspace.catalog.filter((badge) => badge.ativo !== false).map((badge) => ({ id: badge.id, nome: badge.nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    },
    totals: {
      candidaturas: candidaturas.length,
      consultants: consultants.length,
      registeredUsers: workspace.users.length,
      awards: awards.length,
      approvals: candidaturas.filter((row) => row.status.code === 'APPROVED').length,
      rejections: candidaturas.filter((row) => row.status.code === 'REJECTED').length,
      specialAchievements: specialAchievements.length,
      awardedPoints: awards.reduce((sum, award) => sum + Number(award.pontos || 0), 0),
    },
  }
}

export { STATUS_META }
