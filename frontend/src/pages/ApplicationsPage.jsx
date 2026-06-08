import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, FileText, Award, Plus, RefreshCw, Share2 } from 'lucide-react'
import { Spinner, EmptyState, StatusPill } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const CARD_TINT = {
  blue: 'bg-blue-50/60',
  amber: 'bg-amber-50/60',
  green: 'bg-green-50/60',
  red: 'bg-red-50/60',
  indigo: 'bg-indigo-50/60',
  gray: 'bg-gray-50',
}
const BAR = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  red: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  gray: 'bg-gray-400',
}

function Acoes({ c }) {
  const detalhes = (
    <Link
      to={`/catalogo/${c.badge.id}`}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:bg-gray-50"
    >
      Ver Detalhes do Badge
    </Link>
  )

  if (c.status.code === 'APPROVED') {
    return (
      <>
        {detalhes}
        <button className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">
          <Share2 size={14} /> Partilhar no LinkedIn
        </button>
      </>
    )
  }
  if (c.status.code === 'REJECTED') {
    return (
      <>
        {detalhes}
        <Link
          to={`/candidaturas/nova?badge=${c.badge.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw size={14} /> Reenviar Candidatura
        </Link>
      </>
    )
  }
  return (
    <>
      {detalhes}
      <Link
        to={`/candidaturas/nova?badge=${c.badge.id}`}
        className="flex items-center gap-1.5 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand-light"
      >
        <Plus size={14} /> Adicionar Evidências
      </Link>
    </>
  )
}

export default function ApplicationsPage() {
  const { data: candidaturas, loading } = useAsync(() => api.getMinhasCandidaturas())
  const [pesquisa, setPesquisa] = useState('')

  const filtradas = (candidaturas || []).filter((c) =>
    c.badge.nome.toLowerCase().includes(pesquisa.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Meus Badges</h1>
        <Link
          to="/candidaturas/nova"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} /> Nova Candidatura
        </Link>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar Candidaturas..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Sem candidaturas"
          description="Explora o catálogo e candidata-te ao teu primeiro badge."
        />
      ) : (
        <div className="space-y-4">
          {filtradas.map((c) => (
            <div key={c.id} className={`rounded-2xl border border-gray-100 p-5 shadow-sm ${CARD_TINT[c.status.cor]}`}>
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                  <Award size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{c.badge.nome}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.tags.map((t) => (
                          <span key={t} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-gray-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                </div>
              </div>

              {/* Progresso de avaliação */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Progresso de Avaliação</span>
                  <span className="font-semibold">{c.progresso}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${BAR[c.status.cor]}`} style={{ width: `${c.progresso}%` }} />
                </div>
              </div>

              {/* Meta */}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1"><Calendar size={13} /> Submetido: {c.submittedDate}</span>
                <span className="flex items-center gap-1"><Clock size={13} /> {c.diasAnalise} dias em análise</span>
                <span className="flex items-center gap-1"><FileText size={13} /> {c.evidencias} evidências</span>
              </div>

              {/* Feedback (rejeitada) */}
              {c.feedback && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 ring-1 ring-red-100">
                  <p className="text-xs font-semibold text-red-700">Feedback de {c.feedback.papel}</p>
                  <p className="mt-1 text-xs text-red-800/80">{c.feedback.texto}</p>
                  <p className="mt-1 text-xs text-muted">— {c.feedback.autor}</p>
                </div>
              )}

              {/* Ações */}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Acoes c={c} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
