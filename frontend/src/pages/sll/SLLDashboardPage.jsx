import { Users, Award, ClipboardCheck, Flag, ArrowUpRight } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const STAT_ICONS = [Users, Award, ClipboardCheck, Flag]
const TINTS = {
  sky: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  violet: { backgroundColor: '#ede9fe', color: '#7c3aed' },
  amber: { backgroundColor: '#fef3c7', color: '#d97706' },
  emerald: { backgroundColor: '#d1fae5', color: '#059669' },
}
const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function SLLDashboardPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data, loading, error, reload } = useAsync(() => api.getServiceLineDashboard())

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const maxBar = Math.max(1, ...(data.badgesAtribuidos.length ? data.badgesAtribuidos : [1]))
  const temDados = data.badgesAtribuidos.some((v) => v > 0)
  const totalSemana = data.badgesAtribuidos.reduce((soma, v) => soma + v, 0)

  // Recupera o array de dias da semana a partir do ficheiro de idioma
  const diasSemana = t('sllDashboard.diasSemana', { returnObjects: true })
  // O gráfico é rolante (últimos 7 dias): a barra i corresponde à data
  // (hoje - (total-1-i)), tal como no dashboard do Talent Manager.
  const rotularDia = (i, total) => {
    const d = new Date()
    d.setDate(d.getDate() - (total - 1 - i))
    return diasSemana[(d.getDay() + 6) % 7] || ''
  }

  return (
    <div className="d-flex flex-column gap-4">
      <h1 className="fs-2 fw-bold text-ink">{t('sllDashboard.titulo')}</h1>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
        {data.stats.map((s, i) => {
          const Icon = STAT_ICONS[i] || Award
          return (
            <div className="col" key={s.label}>
              <Card>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center justify-content-center rounded-3" style={{ height: '2.75rem', width: '2.75rem', ...(TINTS[s.tint] || TINTS.sky) }}>
                    <Icon size={20} />
                  </div>
                  {s.delta && (
                    <span className="d-flex align-items-center gap-1 fs-xs fw-semibold text-success">
                      <ArrowUpRight size={12} /> {s.delta}
                    </span>
                  )}
                </div>
                {/* O s.label vem da API, se os labels forem dinâmicos, a tradução ideal deve ser tratada no backend ou mapeada aqui */}
                <p className="mt-3 mb-0 fs-3 fw-bold text-ink">{s.value}</p>
                <p className="mb-0 small text-muted">{s.label}</p>
              </Card>
            </div>
          )
        })}
      </div>

      <div className="row g-4 align-items-stretch">
        <div className="col-lg-6">
          <Card className="d-flex h-100 flex-column">
            <h2 className="mb-3 fw-semibold text-ink">{t('sllDashboard.pontuacaoMensal')}</h2>
            <div className="d-grid gap-3 px-2 pb-2 fs-xs fw-medium text-muted" style={{ gridTemplateColumns: '2rem 1fr auto auto' }}>
              <span>{t('sllDashboard.tabela.posicao')}</span>
              <span>{t('sllDashboard.tabela.nome')}</span>
              <span>{t('sllDashboard.tabela.badges')}</span>
              <span>{t('sllDashboard.tabela.pontos')}</span>
            </div>
            <div className="flex-grow-1 d-flex flex-column gap-1">
              {data.pontuacaoMensal.map((r) => (
                <div key={r.rank} className="d-grid align-items-center gap-3 rounded-3 px-2 py-2" style={{ gridTemplateColumns: '2rem 1fr auto auto' }}>
                  <span className="small fw-bold text-muted">{r.rank}</span>
                  <span className="d-flex align-items-center gap-2 small text-ink">
                    <span className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-semibold text-brand" style={{ height: '1.75rem', width: '1.75rem', fontSize: '0.625rem' }}>
                      {iniciais(r.nome)}
                    </span>
                    {r.nome}
                  </span>
                  <span className="text-center small text-muted">{r.badges}</span>
                  <span className="small fw-semibold text-ink">{r.pontos}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-lg-6 d-flex flex-column gap-4">
          <Card>
            <div className="mb-3 d-flex align-items-baseline justify-content-between">
              <h2 className="fw-semibold text-ink mb-0">{t('sllDashboard.badgesAtribuidos')}</h2>
              <span className="fs-xs text-muted">{t('sllDashboard.badgesAtribuidosTotal', { count: totalSemana })}</span>
            </div>
            {!temDados ? (
              <p className="small text-muted mb-0">{t('sllDashboard.semDados')}</p>
            ) : (
              <div className="d-flex gap-2" style={{ height: '10rem' }}>
                {data.badgesAtribuidos.map((v, i) => (
                  <div key={i} className="d-flex flex-grow-1 flex-column align-items-center gap-1">
                    <span className="fw-semibold text-ink" style={{ fontSize: '0.6875rem' }}>{v}</span>
                    <div className="d-flex w-100 flex-grow-1 align-items-end">
                      <div
                        className="w-100 rounded-top bg-brand"
                        style={{ height: `${(v / maxBar) * 100}%`, minHeight: '2px' }}
                        title={String(v)}
                      />
                    </div>
                    <span className="text-secondary" style={{ fontSize: '0.625rem' }}>
                      {rotularDia(i, data.badgesAtribuidos.length)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('sllDashboard.atividadeRecente')}</h2>
            <div className="d-flex flex-column gap-3">
              {data.atividadeRecente.slice(0, 5).map((a, i) => (
                <div key={i} className="d-flex align-items-center gap-3">
                  <span className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-brand-light fs-xs fw-semibold text-brand" style={{ height: '2.25rem', width: '2.25rem' }}>
                    {iniciais(a.nome)}
                  </span>
                  <div>
                    <p className="small fw-medium text-ink mb-0">{a.nome}</p>
                    <p className="fs-xs text-muted mb-0">{a.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
