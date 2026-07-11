import { describe, expect, it } from 'vitest'
import { buildServiceLineReport, filterServiceLineApplications, normalizeServiceLineWorkspace } from './serviceLineWorkspace'

const raw = {
  consultants: { data: [
    { id: 1, name: 'Ana', areaId: 3, area: 'Mobile', serviceLine: 'Technology', points: 100, badgesConquistados: [{ id: 10, pontos: 100, obtidoEm: '2026-07-02' }], specialAchievements: [] },
    { id: 2, name: 'Bruno', areaId: 3, area: 'Mobile', serviceLine: 'Technology', points: 0, badgesConquistados: [], specialAchievements: [] },
  ] },
  badges: [{ id: 10, nome: 'Flutter', nivelId: 7, ponto: 100, ativo: true }, { id: 11, nome: 'API', nivelId: 7, ponto: 80, ativo: true }],
  levels: [{ id: 7, nome: 'Junior', areaId: 3 }],
  areas: [{ id: 3, nome: 'Mobile', serviceLineId: 4 }],
  serviceLines: [{ id: 4, nome: 'Technology', learningPathId: 2 }],
  learningPaths: [{ id: 2, nome: 'Engineering' }],
  requirements: [],
  applications: [
    { id: 20, badgeId: 10, consultorId: 1, dataSubmicao: '2026-07-01', Badge: { nome: 'Flutter' }, Consultant: { User: { nome: 'Ana' } }, status: { code: 'APPROVED', name: 'Aprovada' } },
    { id: 21, badgeId: 11, consultorId: 2, dataSubmicao: '2026-06-01', Badge: { nome: 'API' }, Consultant: { User: { nome: 'Bruno' } }, status: { code: 'VALIDATED', name: 'Validada' } },
  ],
  badgesWeek: [0, 0, 0, 0, 0, 1, 0],
}

describe('service line workspace', () => {
  it('calcula progresso apenas com o catálogo da área', () => {
    const workspace = normalizeServiceLineWorkspace(raw, new Date('2026-07-11'))
    expect(workspace.consultants[0]).toMatchObject({ progress: 50, pathCompleted: 1, pathTotal: 2, monthlyPoints: 100, experienceBand: '0-11' })
    expect(workspace.consultants[1]).toMatchObject({ progress: 0, pathCompleted: 0, pathTotal: 2 })
  })

  it('filtra pedidos por estado, pesquisa e período', () => {
    const workspace = normalizeServiceLineWorkspace(raw)
    expect(filterServiceLineApplications(workspace.applications, { status: 'VALIDATED' }).map((row) => row.id)).toEqual([21])
    expect(filterServiceLineApplications(workspace.applications, { search: 'ana', from: '2026-07-01' }).map((row) => row.id)).toEqual([20])
  })

  it('gera relatório coerente com os filtros', () => {
    const report = buildServiceLineReport(normalizeServiceLineWorkspace(raw), { from: '2026-07-01' })
    expect(report.totals).toMatchObject({ applications: 1, approvals: 1, awards: 1, points: 100 })
    expect(report.comparison.map((row) => row.name)).toEqual(['Ana', 'Bruno'])
  })
})
