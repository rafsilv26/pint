import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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

export default function BadgeDetailPage() {
  const { id } = useParams()
  const { data: badge, loading, error, reload } = useAsync(() => api.getBadge(id), [id])
  const [aberto, setAberto] = useState(0)

  const voltar = (
    <Link to="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
      <ArrowLeft size={16} /> Voltar ao catálogo
    </Link>
  )

  if (loading) return <Spinner />
  if (error) return <div>{voltar}<ErrorState onRetry={reload} /></div>
  if (!badge) {
    return <div>{voltar}<p className="mt-4 text-muted">Badge não encontrado.</p></div>
  }

  return (
    <div>
      {voltar}

      {/* Hero */}
      <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${HERO_TINTS[badge.tint] || HERO_TINTS.sky} p-6 sm:p-8`}>
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink">{badge.nivel}</span>
              <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink">
                <Coins size={12} /> {badge.ponto} pontos
              </span>
              {badge.duracaoMeses && (
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink">
                  Frequência: {Math.round(badge.duracaoMeses / 12)} ano(s)
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Badge de {badge.nome}</h1>
            <Link
              to={`/candidaturas/nova?badge=${badge.id}`}
              className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Candidatar ao Badge
            </Link>
          </div>
          <div className="hidden shrink-0 text-center sm:block">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-4xl font-bold text-ink shadow">
              {badge.nome[0]}
            </div>
            <p className="mt-2 text-sm font-medium text-ink/70">{badge.fornecedor}</p>
          </div>
        </div>
      </div>

      {/* Descrição + Requisitos */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-ink">Descrição</h2>
          <p className="text-sm leading-relaxed text-muted">{badge.descricao}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Este badge reconhece competências práticas e é validado com base nas evidências submetidas,
            de acordo com os requisitos de certificação da Softinsa.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-ink">Requisitos</h2>
          {badge.requisitos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-muted">
              Sem requisitos específicos definidos para este badge.
            </p>
          ) : (
            <div className="space-y-2">
              {badge.requisitos.map((req, i) => (
                <div key={req.id ?? i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    onClick={() => setAberto(aberto === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
                  >
                    {i + 1}. {req.titulo}
                    <ChevronDown size={18} className={`shrink-0 text-muted transition ${aberto === i ? 'rotate-180' : ''}`} />
                  </button>
                  {aberto === i && (
                    <p className="border-t border-gray-100 px-4 py-3 text-sm text-muted">
                      Para cumprir este requisito deves submeter evidências que demonstrem,
                      de forma clara, a competência indicada.
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
