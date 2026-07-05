import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Importa o hook

const TECH_TINTS = {
  salmon: 'from-red-100 to-orange-50',
  sky: 'from-sky-100 to-blue-50',
  emerald: 'from-emerald-100 to-green-50',
  violet: 'from-violet-100 to-purple-50',
}

const POR_PAGINA = 12

export default function CatalogPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data: badges, loading, error, reload } = useAsync(() => api.getBadges())
  const [pesquisa, setPesquisa] = useState('')
  const [pagina, setPagina] = useState(1)

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !badges) return <Spinner />

  const filtrados = badges.filter((b) =>
    `${b.nome} ${b.nivel} ${b.fornecedor}`.toLowerCase().includes(pesquisa.toLowerCase())
  )
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value)
              setPagina(1)
            }}
            placeholder={t('catalogo.procurar')} // <-- Tradução aqui
            className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        {totalPaginas > 1 && <Paginacao pagina={paginaAtual} total={totalPaginas} onChange={setPagina} />}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState 
          icon={Award} 
          title={t('catalogo.vazioTitulo')} // <-- Tradução aqui
          description={t('catalogo.vazioDesc')} // <-- Tradução aqui
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((b) => (
            <Link
              key={b.id}
              to={`/catalogo/${b.id}`}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-28 items-center justify-center bg-gradient-to-br ${TECH_TINTS[b.tint] || TECH_TINTS.sky}`}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl font-bold text-ink shadow-sm">
                  {b.nome[0]}
                </div>
              </div>
              <div className="p-4 text-center">
                <p className="font-semibold text-ink">
                  {b.nome} - {t('catalogo.nivel')} {b.nivel} {/* <-- Tradução aqui */}
                </p>
                <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-amber-600">
                  <Coins size={14} /> {b.ponto} {t('catalogo.pontos')} {/* <-- Tradução aqui */}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Paginacao({ pagina, total, onChange }) {
  const paginas = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className="flex items-center gap-1.5">
      <PagBtn onClick={() => onChange(pagina - 1)} disabled={pagina === 1}>
        <ChevronLeft size={16} />
      </PagBtn>
      {paginas.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-medium transition ${
            p === pagina ? 'bg-brand text-white' : 'bg-white text-muted hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}
      <PagBtn onClick={() => onChange(pagina + 1)} disabled={pagina === total}>
        <ChevronRight size={16} />
      </PagBtn>
    </div>
  )
}

function PagBtn({ children, ...props }) {
  return (
    <button
      {...props}
      className="grid h-8 w-8 place-items-center rounded-full bg-white text-muted transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}