import { describe, expect, it } from 'vitest'
import { buildTalentReport, filterTalentApplicationsByTab, filterTalentCandidaturas, getEvidenceCoverage, getExpirationState, getTalentApplicationTabCounts, normalizeTalentWorkspace } from './talentWorkspace'

const raw = {
  consultants: { data: [{ id: 7, name: 'Rafael Teste', area: 'Mobile', serviceLine: 'Technology', points: 200, badgesConquistados: [{ id: 10, nome: 'Flutter', obtidoEm: '2026-01-01', expiraEm: '2026-08-01', valido: true }] }] },
  users: [{ id: 7, nome: 'Rafael Teste' }, { id: 8, nome: 'Talent Manager' }],
  learningPaths: [{ id: 1, nome: 'Engineering' }],
  serviceLines: [{ id: 2, learningPathId: 1, nome: 'Technology' }],
  areas: [{ id: 3, serviceLineId: 2, nome: 'Mobile' }],
  levels: [{ id: 4, areaId: 3, nome: 'Junior', ordem: 'A' }],
  badges: [{ id: 10, nivelId: 4, nome: 'Flutter', ponto: 100 }, { id: 11, nivelId: 4, nome: 'Dart', ponto: 100 }],
  requirements: [{ id: 20, nivelId: 4, titulo: 'Certificado', ordem: 1 }],
  statuses: [{ statusId: 2, code: 'SUBMITTED', name: 'Submetida' }],
  premiumBadges: [{ badgePremiumId: 30, name: 'Especialista Mobile' }],
  premiumAwards: [{ badgePremiumId: 30, consultorId: 7, achievementDate: '2026-01-02' }],
  timelines: [{ timelineId: 40, consultorId: 7, title: 'Concluir Dart', startDate: '2026-01-03', status: 'Em Progresso' }],
  candidaturas: [[{ id: 50, consultorId: 7, badgeId: 11, estadoId: 2, dataSubmicao: '2026-07-01', evidencias: [], history: [{ id: 1, userId: 8, estadoNovo: 2, motivo: 'Submetida', createdAt: '2026-07-01' }] }]],
}

describe('talent workspace', () => {
  it('enriches hierarchy, progress, achievements and applications', () => {
    const workspace = normalizeTalentWorkspace(raw, new Date('2026-07-11'))
    expect(workspace.catalog[0]).toMatchObject({ area: 'Mobile', serviceLine: 'Technology', learningPath: 'Engineering' })
    expect(workspace.consultants[0]).toMatchObject({ progress: 50, pathCompleted: 1, pathTotal: 2, activeApplications: 1 })
    expect(workspace.consultants[0].specialAchievements[0].name).toBe('Especialista Mobile')
    expect(workspace.candidaturas[0]).toMatchObject({ consultor: 'Rafael Teste', badge: 'Dart', area: 'Mobile', learningPath: 'Engineering' })
    expect(workspace.candidaturas[0].historico[0]).toMatchObject({ autor: 'Talent Manager', code: 'SUBMITTED' })
  })

  it('classifies expiration dates', () => {
    expect(getExpirationState('2026-07-01', true, new Date('2026-07-11')).code).toBe('expired')
    expect(getExpirationState('2026-08-01', true, new Date('2026-07-11')).code).toBe('soon')
    expect(getExpirationState(null, true, new Date('2026-07-11')).code).toBe('permanent')
  })

  it('filters and summarizes report data', () => {
    const workspace = normalizeTalentWorkspace(raw, new Date('2026-07-11'))
    expect(filterTalentCandidaturas(workspace.candidaturas, { status: 'SUBMITTED', search: 'dart' })).toHaveLength(1)
    const report = buildTalentReport(workspace, { area: 'Mobile', learningPath: 'Engineering', level: 'Junior' })
    expect(report.totals).toMatchObject({ candidaturas: 1, consultants: 1, registeredUsers: 2, awards: 1 })
    expect(report.monthlyBreakdown).toEqual([{ month: '2026-01', value: 1, percentage: 100 }])
    expect(report.learningPathBreakdown).toEqual([{ learningPath: 'Engineering', value: 1 }])
    expect(report.levelBreakdown).toEqual([{ level: 'Junior', value: 1 }])
    expect(report.badgeBreakdown[0]).toMatchObject({ badge: 'Flutter', value: 1, points: 100 })
  })

  it('filters applications by badge and date range', () => {
    const workspace = normalizeTalentWorkspace(raw, new Date('2026-07-11'))
    expect(filterTalentCandidaturas(workspace.candidaturas, { badgeId: 11, from: '2026-07-01', to: '2026-07-01' })).toHaveLength(1)
    expect(filterTalentCandidaturas(workspace.candidaturas, { from: '2026-07-02' })).toHaveLength(0)
  })

  it('requires validated evidence for every mandatory requirement', () => {
    const requirements = [{ id: 1, obrigatorio: true }, { id: 2, obrigatorio: true }, { id: 3, obrigatorio: false }]
    expect(getEvidenceCoverage(requirements, [{ requisitoId: 1, validado: true }])).toMatchObject({ covered: 1, complete: false })
    expect(getEvidenceCoverage(requirements, [{ requisitoId: 1, validado: true }, { requisitoId: 2, validado: true }])).toMatchObject({ covered: 2, complete: true, missing: [] })
    expect(getEvidenceCoverage(requirements, [{ requisitoId: 1, validado: false }, { requisitoId: 2, validado: true }]).complete).toBe(false)
  })

  it('keeps a Talent Manager decision visible after final approval', () => {
    const rows = [
      { id: 1, talentManagerId: 8, status: { code: 'VALIDATED' } },
      { id: 2, talentManagerId: 8, status: { code: 'APPROVED' } },
      { id: 3, talentManagerId: 9, status: { code: 'APPROVED' } },
      { id: 4, talentManagerId: 8, status: { code: 'REJECTED' } },
    ]

    expect(filterTalentApplicationsByTab(rows, 'validadas', 8).map((row) => row.id)).toEqual([1, 2])
    expect(filterTalentApplicationsByTab(rows, 'rejeitadas', 8).map((row) => row.id)).toEqual([4])
    expect(getTalentApplicationTabCounts(rows, 8)).toMatchObject({ validadas: 2, rejeitadas: 1, aprovadas: 2, todas: 4 })
  })
})
