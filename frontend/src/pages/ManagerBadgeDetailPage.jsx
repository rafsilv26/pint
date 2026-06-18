import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Coins } from 'lucide-react'
import { Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const HERO_TINTS = {
  salmon: 'from-orange-200 to-red-200',
  sky: 'from-sky-200 to-blue-200',
  emerald: 'from-emerald-200 to-green-200',
  violet: 'from-violet-200 to-purple-200',
}

// Página de um badge vista por um perfil de gestão (só-leitura, sem candidatar).
export default function ManagerBadgeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: badge, loading, error, reload } = useAsync(() => api.getBadge(id), [id])
  const [aberto, setAberto] = useState(0)

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!badge) return <p className="text-muted">Badge não encontrado.</p>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${HERO_TINTS[badge.tint] || HERO_TINTS.sky} p-6 sm:p-8`}>
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink">{badge.nivel}</span>
              <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink"><Coins size={12} /> {badge.ponto} pontos</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Badge de {badge.nome}</h1>
          </div>
          <div className="hidden shrink-0 text-center sm:block">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-4xl font-bold text-ink shadow">{badge.nome[0]}</div>
            <p className="mt-2 text-sm font-medium text-ink/70">{badge.fornecedor}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-ink">Descrição</h2>
          <p className="text-sm leading-relaxed text-muted">{badge.descricao}</p>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-ink">Requisitos</h2>
          {badge.requisitos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-muted">Sem requisitos específicos.</p>
          ) : (
            <div className="space-y-2">
              {badge.requisitos.map((req, i) => (
                <div key={req.id ?? i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button onClick={() => setAberto(aberto === i ? -1 : i)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink">
                    {i + 1}. {req.titulo}
                    <ChevronDown size={18} className={`shrink-0 text-muted transition ${aberto === i ? 'rotate-180' : ''}`} />
                  </button>
                  {aberto === i && (
                    <p className="border-t border-gray-100 px-4 py-3 text-sm text-muted">
                      Requisito necessário para conquistar este badge.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
