import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, Medal, Users } from 'lucide-react'
import { PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function ConsultoresPage({ linkBase }) {
  const { data, loading, error, reload } = useAsync(() => api.getConsultants())
  const [pesquisa, setPesquisa] = useState('')

  const lista = (data || []).filter((c) =>
    `${c.name} ${c.area || ''} ${c.serviceLine || ''}`.toLowerCase().includes(pesquisa.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Diretório de Consultores" subtitle="Explora os perfis dos teus colegas." />

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar consultores…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : lista.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum consultor encontrado" description="Tenta outra pesquisa." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => {
            const conteudo = (
              <Card className={`flex items-center gap-3 ${linkBase ? 'transition hover:border-brand hover:shadow-md' : ''} ${c.isCurrentUser ? 'ring-2 ring-brand/30' : ''}`}>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-light text-sm font-semibold text-brand">
                  {iniciais(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {c.name}
                    {c.isCurrentUser && <span className="ml-1 text-xs font-normal text-brand">(tu)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{c.area || c.serviceLine || 'Consultor'}</p>
                  <div className="mt-1 flex gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {c.points}</span>
                    <span className="flex items-center gap-1"><Medal size={12} className="text-orange-500" /> {c.badges}</span>
                  </div>
                </div>
                {c.rank ? <span className="text-sm font-bold text-muted">#{c.rank}</span> : null}
              </Card>
            )
            return linkBase
              ? <Link key={c.id} to={`${linkBase}/${c.id}`} className="block">{conteudo}</Link>
              : <div key={c.id}>{conteudo}</div>
          })}
        </div>
      )}
    </div>
  )
}
