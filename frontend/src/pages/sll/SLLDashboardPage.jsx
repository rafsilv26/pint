import { Users, Award, ClipboardCheck, Flag, ArrowUpRight } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const STAT_ICONS = [Users, Award, ClipboardCheck, Flag]
const TINTS = {
  sky: 'bg-sky-100 text-sky-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
}
const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function SLLDashboardPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data, loading, error, reload } = useAsync(() => api.getServiceLineDashboard())
  
  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const maxBar = Math.max(1, ...(data.badgesAtribuidos.length ? data.badgesAtribuidos : [1]))
  
  // Recupera o array de dias da semana a partir do ficheiro de idioma
  const diasSemana = t('sllDashboard.diasSemana', { returnObjects: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">{t('sllDashboard.titulo')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s, i) => {
          const Icon = STAT_ICONS[i] || Award
          return (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${TINTS[s.tint] || TINTS.sky}`}>
                  <Icon size={20} />
                </div>
                {s.delta && (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                    <ArrowUpRight size={12} /> {s.delta}
                  </span>
                )}
              </div>
              {/* O s.label vem da API, se os labels forem dinâmicos, a tradução ideal deve ser tratada no backend ou mapeada aqui */}
              <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink">{t('sllDashboard.pontuacaoMensal')}</h2>
          <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-2 pb-2 text-xs font-medium text-muted">
            <span>{t('sllDashboard.tabela.posicao')}</span>
            <span>{t('sllDashboard.tabela.nome')}</span>
            <span>{t('sllDashboard.tabela.badges')}</span>
            <span>{t('sllDashboard.tabela.pontos')}</span>
          </div>
          <div className="space-y-0.5">
            {data.pontuacaoMensal.map((r) => (
              <div key={r.rank} className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                <span className="text-sm font-bold text-muted">{r.rank}</span>
                <span className="flex items-center gap-2 text-sm text-ink">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-light text-[10px] font-semibold text-brand">
                    {iniciais(r.nome)}
                  </span>
                  {r.nome}
                </span>
                <span className="text-center text-sm text-muted">{r.badges}</span>
                <span className="text-sm font-semibold text-ink">{r.pontos}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-ink">{t('sllDashboard.badgesAtribuidos')}</h2>
            {data.badgesAtribuidos.length === 0 ? (
              <p className="text-sm text-muted">{t('sllDashboard.semDados')}</p>
            ) : (
              <div className="flex h-40 items-end gap-2">
                {data.badgesAtribuidos.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-brand transition-all" style={{ height: `${(v / maxBar) * 100}%` }} />
                    <span className="text-[10px] text-gray-400">
                      {diasSemana[i] || ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold text-ink">{t('sllDashboard.atividadeRecente')}</h2>
            <div className="space-y-3">
              {data.atividadeRecente.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-light text-xs font-semibold text-brand">
                    {iniciais(a.nome)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.nome}</p>
                    <p className="text-xs text-muted">{a.texto}</p>
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