import { Link } from 'react-router-dom'
import {
  TrendingUp, Award, Clock, Trophy, Bell, UserCircle, Compass,
  ChevronRight, Calendar,
} from 'lucide-react'
import { Card, Spinner, StatusPill, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const STAT_ICONS = [TrendingUp, Award, Clock, Trophy]
const TINTS = {
  violet: 'bg-violet-100 text-violet-600',
  orange: 'bg-orange-100 text-orange-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  sky: 'bg-sky-100 text-sky-600',
}
const DELTA_TINTS = {
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
}
const EVENTO_CORES = {
  violet: 'border-violet-400',
  blue: 'border-blue-400',
  green: 'border-green-400',
}

function StatCard({ icon: Icon, label, value, delta, tint, deltaTint }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${TINTS[tint]}`}>
          <Icon size={20} />
        </div>
        {delta && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DELTA_TINTS[deltaTint]}`}>
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => api.getDashboard())
  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          {data.greeting}, {data.userName}! <span className="align-middle">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Continua a tua jornada de aprendizagem e desenvolvimento profissional
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s, i) => (
          <StatCard key={s.label} icon={STAT_ICONS[i]} {...s} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== Coluna principal ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Badges Recentes */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Badges Recentes</h2>
              <Link to="/candidaturas" className="text-sm font-medium text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {data.badgesRecentes.map((b) => (
                <div key={b.id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                    <Award size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-ink">{b.nome}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="text-xs text-muted">{b.nivel}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${b.progresso}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted">{b.progresso}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recomendados para Si */}
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Recomendados para Si</h2>
              <Link to="/catalogo" className="text-sm font-medium text-brand hover:underline">
                Explorar
              </Link>
            </div>
            <p className="mb-4 text-sm text-muted">Baseado no seu perfil e interesses</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.recomendados.map((r) => (
                <Link
                  key={r.id}
                  to={`/catalogo/${r.id}`}
                  className="rounded-xl border border-gray-100 p-4 text-center transition hover:border-brand hover:shadow-sm"
                >
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${TINTS[r.tint]}`}>
                    <Award size={22} />
                  </div>
                  <p className="mt-3 font-semibold text-ink">{r.nome}</p>
                  <p className="text-xs text-muted">{r.nivel}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* ===== Coluna lateral ===== */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="rounded-xl bg-gradient-to-br from-brand to-brand-accent p-5 text-white shadow-sm">
            <h2 className="mb-4 font-semibold">Ações Rápidas</h2>
            <div className="space-y-2">
              {[
                { to: '/notificacoes', icon: Bell, label: 'Ver Notificações' },
                { to: '/perfil/publico', icon: UserCircle, label: 'Ver o seu Perfil Público' },
                { to: '/catalogo', icon: Compass, label: 'Ver Diretório' },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/20"
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mini perfil */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-light font-semibold text-brand">
                US
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{data.perfil.nome}</p>
                <p className="truncate text-xs text-muted">{data.perfil.cargo}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Nível</dt>
                <dd className="font-semibold text-ink">{data.perfil.nivel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Pontos Conquistados</dt>
                <dd className="font-semibold text-ink">{data.perfil.pontos} pts</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Posição</dt>
                <dd className="font-semibold text-brand">#{data.perfil.posicao}</dd>
              </div>
            </dl>
            <Link
              to="/perfil"
              className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Ver Perfil Completo <ChevronRight size={16} />
            </Link>
          </Card>

          {/* Próximos Eventos */}
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Próximos Eventos</h2>
            <div className="space-y-2">
              {data.eventos.map((e) => (
                <div key={e.id} className={`rounded-r-lg border-l-4 bg-gray-50 px-3 py-2 ${EVENTO_CORES[e.cor]}`}>
                  <p className="text-sm font-medium text-ink">{e.titulo}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Calendar size={12} /> {e.data}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
