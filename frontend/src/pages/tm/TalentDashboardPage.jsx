import { Users, Award, ClipboardCheck, Layers, ArrowUpRight } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const STAT_ICONS = [Users, Award, ClipboardCheck, Layers]
const TINTS = {
  sky: 'bg-sky-100 text-sky-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
}
const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// Quando usada em /admin (usarDadosAdmin), busca a mesma estrutura de dados mas
// com a "Atividade Recente" a vir do feed real e transversal da app (utilizadores,
// badges, candidaturas, avisos, políticas...) em vez de só candidaturas pendentes.
export default function TalentDashboardPage({ usarDadosAdmin = false }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data, loading, error, reload } = useAsync(
    () => (usarDadosAdmin ? api.getAdminDashboard() : api.getTalentDashboard()),
    [usarDadosAdmin]
  )
  
  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const maxBar = Math.max(1, ...(data.pedidosFechados.length ? data.pedidosFechados : [1]))
  const temDados = data.pedidosFechados.some((v) => v > 0)
  const totalSemana = data.pedidosFechados.reduce((soma, v) => soma + v, 0)

  // Rótulos dos dias a partir do ficheiro de idioma (Segunda-first).
  const diasSemana = t('talentDashboard.diasSemana', { returnObjects: true })
  // O gráfico é rolante (últimos 7 dias): a barra i corresponde à data
  // (hoje - (total-1-i)). Converte para o índice Segunda-first do array acima.
  const rotularDia = (i, total) => {
    const d = new Date()
    d.setDate(d.getDate() - (total - 1 - i))
    return diasSemana[(d.getDay() + 6) % 7] || ''
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">{t('talentDashboard.titulo')}</h1>

      {/* Estatísticas */}
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
              <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Pontuação Global */}
        <Card className="flex h-full flex-col">
          <h2 className="mb-4 font-semibold text-ink">{t('talentDashboard.pontuacaoGlobal')}</h2>
          <div className="grid grid-cols-[2rem_1fr_auto] gap-2 px-2 pb-2 text-xs font-medium text-muted">
            <span>{t('talentDashboard.tabela.posicao')}</span>
            <span>{t('talentDashboard.tabela.nome')}</span>
            <span>{t('talentDashboard.tabela.pontos')}</span>
          </div>
          <div className="flex-1 space-y-0.5">
            {data.pontuacaoGlobal.map((r) => (
              <div key={r.rank} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50">
                <span className="text-sm font-bold text-muted">{r.rank}</span>
                <span className="flex items-center gap-2 text-sm text-ink">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-light text-[10px] font-semibold text-brand">
                    {iniciais(r.nome)}
                  </span>
                  {r.nome}
                </span>
                <span className="text-sm font-semibold text-ink">{r.pontos}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Pedidos fechados + Atividade */}
        <div className="flex h-full flex-col space-y-6">
          <Card>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold text-ink">{t('talentDashboard.pedidosFechados')}</h2>
              <span className="text-xs text-muted">{t('talentDashboard.pedidosFechadosTotal', { count: totalSemana })}</span>
            </div>
            {!temDados ? (
              <p className="text-sm text-muted">{t('talentDashboard.semDados')}</p>
            ) : (
              <div className="flex h-40 gap-2">
                {data.pedidosFechados.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold text-ink">{v}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full min-h-[2px] rounded-t bg-brand transition-all"
                        style={{ height: `${(v / maxBar) * 100}%` }}
                        title={String(v)}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {rotularDia(i, data.pedidosFechados.length)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">{t('talentDashboard.atividadeRecente')}</h2>
            <div className="space-y-3">
              {data.atividadeRecente.slice(0, 5).map((a, i) => (
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