import { describe, expect, it } from 'vitest'
import { buildServiceLineDecisionHistory, buildServiceLineProfile, buildServiceLineReport, filterServiceLineApplications, normalizeServiceLineWorkspace } from './serviceLineWorkspace'

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

  it('constrói o perfil da Service Line com dados do workspace', () => {
    const profile = buildServiceLineProfile(normalizeServiceLineWorkspace(raw))

    expect(profile).toMatchObject({
      serviceLine: { id: 4, nome: 'Technology' },
      learningPath: { id: 2, nome: 'Engineering' },
      areas: [{ id: 3, nome: 'Mobile' }],
      stats: { consultants: 2, availableBadges: 2, pendingApprovals: 1, awardedBadges: 1 },
    })
  })

  it('ordena o histórico de decisões do SLL da mais recente para a mais antiga', () => {
    const decisions = buildServiceLineDecisionHistory([
      {
        id: 20,
        trackingId: '#00020',
        badge: 'Flutter',
        consultor: 'Ana',
        status: { code: 'APPROVED' },
        history: [
          { id: 1, createdAt: '2026-07-01T10:00:00Z', oldStatus: { code: 'VALIDATED' }, newStatus: { code: 'OPEN', name: 'Devolvida' }, motivo: 'Corrigir certificado' },
          { id: 2, createdAt: '2026-07-03T10:00:00Z', oldStatus: { code: 'VALIDATED' }, newStatus: { code: 'APPROVED', name: 'Aprovada' } },
        ],
      },
      {
        id: 22,
        trackingId: '#00022',
        badge: 'API',
        consultor: 'Bruno',
        status: { code: 'REJECTED' },
        history: [
          { id: 3, createdAt: '2026-07-04T10:00:00Z', oldStatus: { code: 'VALIDATED' }, newStatus: { code: 'REJECTED', name: 'Rejeitada' }, motivo: 'Documento inválido' },
        ],
      },
      { id: 23, status: { code: 'OPEN' }, history: [] },
    ])

    expect(decisions.map((row) => [row.requestId, row.code])).toEqual([
      [22, 'REJECTED'],
      [20, 'APPROVED'],
      [20, 'OPEN'],
    ])
    expect(decisions[0]).toMatchObject({ trackingId: '#00022', comment: 'Documento inválido' })
  })
})
