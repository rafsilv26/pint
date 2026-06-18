import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award } from 'lucide-react'
import { PageHeader, Spinner, ErrorState, EmptyState } from './ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const TECH_TINTS = {
  salmon: 'from-red-100 to-orange-50',
  sky: 'from-sky-100 to-blue-50',
  emerald: 'from-emerald-100 to-green-50',
  violet: 'from-violet-100 to-purple-50',
}

// Grelha de badges só-leitura (para Talent Manager / Service Line Leader).
export default function BadgesGridView({ titulo = 'Catálogo de Badges', linkBase }) {
  const { data, loading, error, reload } = useAsync(() => api.getBadges())
  const [q, setQ] = useState('')

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const lista = data.filter((b) => `${b.nome} ${b.nivel} ${b.fornecedor}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title={titulo} />
      <div className="relative mb-6 max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar badges…"
          className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      {lista.length === 0 ? (
        <EmptyState icon={Award} title="Nenhum badge encontrado" description="Tenta outra pesquisa." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((b) => {
            const conteudo = (
              <>
                <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${TECH_TINTS[b.tint] || TECH_TINTS.sky}`}>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-xl font-bold text-ink shadow-sm">{b.nome[0]}</div>
                </div>
                <div className="p-4 text-center">
                  <p className="font-semibold text-ink">{b.nome} - Nível {b.nivel}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-amber-600">
                    <Coins size={14} /> {b.ponto} pontos
                  </p>
                </div>
              </>
            )
            const cls = `block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${linkBase ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''}`
            return linkBase
              ? <Link key={b.id} to={`${linkBase}/${b.id}`} className={cls}>{conteudo}</Link>
              : <div key={b.id} className={cls}>{conteudo}</div>
          })}
        </div>
      )}
    </div>
  )
}
