import { Link } from 'react-router-dom'
import {
  TrendingUp, Award, Clock, Trophy, Bell, UserCircle, Compass,
  ChevronRight, Route,
} from 'lucide-react'
import { Card, Spinner, StatusPill, ErrorState } from '../components/ui'
import DashboardAlerts from '../components/DashboardAlerts'
import { useAsync } from '../hooks/useAsync'
import { useTranslation } from 'react-i18next'
import * as api from '../services/api'

const STAT_ICONS = [TrendingUp, Award, Clock, Trophy]
const TINTS = {
  violet: { backgroundColor: '#ede9fe', color: '#7c3aed' },
  orange: { backgroundColor: '#ffedd5', color: '#ea580c' },
  emerald: { backgroundColor: '#d1fae5', color: '#059669' },
  sky: { backgroundColor: '#e0f2fe', color: '#0284c7' },
}
const DELTA_TINTS = {
  green: { backgroundColor: '#dcfce7', color: '#15803d' },
  orange: { backgroundColor: '#ffedd5', color: '#c2410c' },
}

function StatCard({ icon: Icon, label, value, delta, tint, deltaTint }) {
  return (
    <Card>
      <div className="d-flex align-items-start justify-content-between">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ height: '2.75rem', width: '2.75rem', ...TINTS[tint] }}
        >
          <Icon size={20} />
        </div>
        {delta && (
          <span className="rounded-pill px-2 py-1 fs-xs fw-semibold" style={DELTA_TINTS[deltaTint]}>
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3 mb-0 fs-3 fw-bold text-ink">{value}</p>
      <p className="mb-0 small text-muted">{label}</p>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getDashboard())

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="fs-2 fw-bold text-ink">
          {data.greeting}, {data.userName}! <span className="align-middle">👋</span>
        </h1>
        <p className="mt-1 small text-muted">
          {t('dashboard.jornada')}
        </p>
      </div>

      <DashboardAlerts conquistas={data.conquistasEspeciais} />

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
        {data.stats.map((s, i) => (
          <div className="col" key={s.label}>
            <StatCard icon={STAT_ICONS[i]} {...s} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">

          {(data.learningPaths?.length > 0 || data.learningPath) && (
            <Card>
              <h2 className="fw-semibold text-ink mb-3 d-flex align-items-center gap-2">
                <Route size={18} className="text-brand" /> {t('dashboard.learningPathsTitulo')}
              </h2>
              {data.learningPaths?.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {data.learningPaths.map((p) => (
                    <div key={p.id}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <p className="small fw-medium text-ink mb-0 text-truncate">{p.nome}</p>
                        <span className="small fw-bold text-brand flex-shrink-0 ms-2">{p.progresso}%</span>
                      </div>
                      <div className="rounded-pill bg-light overflow-hidden" style={{ height: '0.625rem' }}>
                        <div
                          className="h-100 rounded-pill"
                          style={{ width: `${p.progresso}%`, background: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}
                        />
                      </div>
                      <p className="mt-1 mb-0 fs-xs text-muted">
                        {t('dashboard.learningPathDetalhe', { obtidos: p.obtidos, total: p.total })}
                        {p.emCurso > 0 && ` · ${t('dashboard.learningPathEmCurso', { n: p.emCurso })}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <p className="small fw-medium text-ink mb-0">{data.learningPath.titulo}</p>
                    <span className="small fw-bold text-brand">{data.learningPath.progresso}%</span>
                  </div>
                  <div className="rounded-pill bg-light overflow-hidden" style={{ height: '0.625rem' }}>
                    <div
                      className="h-100 rounded-pill"
                      style={{ width: `${data.learningPath.progresso}%`, background: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}
                    />
                  </div>
                  <p className="mt-2 mb-0 fs-xs text-muted">{t('dashboard.progressoLearningPath')}</p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="mb-3 d-flex align-items-center justify-content-between">
              <h2 className="fw-semibold text-ink mb-0">{t('dashboard.badgesRecentes')}</h2>
              <Link to="/candidaturas" className="small fw-medium text-brand text-decoration-none">
                {t('dashboard.verTodos')}
              </Link>
            </div>
            <div className="d-flex flex-column gap-3">
              {data.badgesRecentes.map((b) => (
                <div key={b.id} className="d-flex align-items-center gap-3 rounded-3 border p-3">
                  <div
                    className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 text-white"
                    style={{ height: '3rem', width: '3rem', background: 'linear-gradient(135deg,#374151,#111827)' }}
                  >
                    <Award size={22} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <p className="text-truncate fw-semibold text-ink mb-0">{b.nome}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="fs-xs text-muted mb-0">{b.nivel}</p>
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <div className="flex-grow-1 rounded-pill bg-light overflow-hidden" style={{ height: '0.375rem' }}>
                        <div
                          className="h-100 rounded-pill"
                          style={{ width: `${b.progresso}%`, background: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}
                        />
                      </div>
                      <span className="fs-xs fw-medium text-muted">{b.progresso}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-1 d-flex align-items-center justify-content-between">
              <h2 className="fw-semibold text-ink mb-0">{t('dashboard.recomendados')}</h2>
              <Link to="/catalogo" className="small fw-medium text-brand text-decoration-none">
                {t('dashboard.explorar')}
              </Link>
            </div>
            <p className="mb-3 small text-muted">
              {data.areaNome ? t('dashboard.baseadoArea', { area: data.areaNome }) : t('dashboard.baseadoPerfil')}
            </p>
            {data.recomendados.length === 0 ? (
              <p className="rounded-3 border border-dashed p-3 small text-muted mb-0">{t('dashboard.semRecomendados')}</p>
            ) : (
            <div className="row row-cols-1 row-cols-sm-3 g-3">
              {data.recomendados.map((r) => (
                <div className="col" key={r.id}>
                  <Link
                    to={`/catalogo/${r.id}`}
                    className="d-block rounded-3 border p-3 text-center text-decoration-none hover-shadow"
                  >
                    <div
                      className="mx-auto d-flex align-items-center justify-content-center rounded-3"
                      style={{ height: '3rem', width: '3rem', ...TINTS[r.tint] }}
                    >
                      <Award size={22} />
                    </div>
                    <p className="mt-3 mb-0 fw-semibold text-ink">{r.nome}</p>
                    <p className="fs-xs text-muted mb-0">{r.nivel}</p>
                    {r.motivo && <p className="mt-2 mb-0 fs-xs text-brand">{r.motivo}</p>}
                  </Link>
                </div>
              ))}
            </div>
            )}
          </Card>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-4">

          <div className="rounded-3 bg-gradient-brand p-4 text-white shadow-sm">
            <h2 className="mb-3 fw-semibold">{t('dashboard.acoesRapidas')}</h2>
            <div className="d-flex flex-column gap-2">
              {[
                { to: '/notificacoes', icon: Bell, label: t('dashboard.verNotificacoes') },
                { to: '/perfil/publico', icon: UserCircle, label: t('dashboard.verPerfilPublico') },
                { to: '/catalogo', icon: Compass, label: t('dashboard.verDiretorio') },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={label}
                  to={to}
                  className="d-flex align-items-center gap-2 rounded-3 bg-white bg-opacity-10 px-3 py-2 small fw-medium text-white text-decoration-none"
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <Card>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-semibold text-brand"
                style={{ height: '3rem', width: '3rem' }}
              >
                US
              </div>
              <div className="min-w-0">
                <p className="text-truncate fw-semibold text-ink mb-0">{data.perfil.nome}</p>
                <p className="text-truncate fs-xs text-muted mb-0">{data.perfil.cargo}</p>
              </div>
            </div>
            <dl className="mt-3 d-flex flex-column gap-2 border-top pt-3 small mb-0">
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('dashboard.nivel')}</dt>
                <dd className="fw-semibold text-ink mb-0">{data.perfil.nivel}</dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('dashboard.pontosConquistados')}</dt>
                <dd className="fw-semibold text-ink mb-0">{data.perfil.pontos} pts</dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('dashboard.posicao')}</dt>
                <dd className="fw-semibold text-brand mb-0">#{data.perfil.posicao}</dd>
              </div>
            </dl>
            <Link
              to="/perfil"
              className="mt-3 d-flex align-items-center justify-content-center gap-1 small fw-medium text-brand text-decoration-none"
            >
              {t('dashboard.verPerfilCompleto')} <ChevronRight size={16} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
