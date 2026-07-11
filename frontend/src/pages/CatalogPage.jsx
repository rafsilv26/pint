import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Importa o hook

const TECH_TINTS = {
  salmon: 'tint-salmon-soft',
  sky: 'tint-sky-soft',
  emerald: 'tint-emerald-soft',
  violet: 'tint-violet-soft',
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
      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="position-relative w-100" style={{ maxWidth: '24rem' }}>
          <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value)
              setPagina(1)
            }}
            placeholder={t('catalogo.procurar')} // <-- Tradução aqui
            className="form-control rounded-pill ps-5"
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
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {visiveis.map((b) => (
            <div className="col" key={b.id}>
              <Link
                to={`/catalogo/${b.id}`}
                className="d-block overflow-hidden rounded-4 border bg-white shadow-sm text-decoration-none hover-shadow"
              >
                <div className={`d-flex align-items-center justify-content-center ${TECH_TINTS[b.tint] || TECH_TINTS.sky}`} style={{ height: '7rem' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-white fs-2 fw-bold text-ink shadow-sm" style={{ height: '4rem', width: '4rem' }}>
                    {b.nome[0]}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <p className="fw-semibold text-ink mb-0">
                    {b.nome} - {t('catalogo.nivel')} {b.nivel} {/* <-- Tradução aqui */}
                  </p>
                  <p className="mt-1 mb-0 d-flex align-items-center justify-content-center gap-1 small fw-medium text-warning-emphasis">
                    <Coins size={14} /> {b.ponto} {t('catalogo.pontos')} {/* <-- Tradução aqui */}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Paginacao({ pagina, total, onChange }) {
  const paginas = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className="d-flex align-items-center gap-2">
      <PagBtn onClick={() => onChange(pagina - 1)} disabled={pagina === 1}>
        <ChevronLeft size={16} />
      </PagBtn>
      {paginas.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`d-flex align-items-center justify-content-center rounded-circle small fw-medium border-0 ${
            p === pagina ? 'bg-brand text-white' : 'bg-white text-muted'
          }`}
          style={{ height: '2rem', width: '2rem' }}
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
      className="d-flex align-items-center justify-content-center rounded-circle bg-white text-muted border-0"
      style={{ height: '2rem', width: '2rem' }}
    >
      {children}
    </button>
  )
}
