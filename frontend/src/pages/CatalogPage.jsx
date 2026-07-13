import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const TECH_TINTS = {
  salmon: 'tint-salmon-soft',
  sky: 'tint-sky-soft',
  emerald: 'tint-emerald-soft',
  violet: 'tint-violet-soft',
}

const POR_PAGINA = 12

export default function CatalogPage() {
  const { t } = useTranslation()
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
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-ink mb-1">{t('catalogo.titulo')}</h1>
        <p className="small text-muted mb-0">{t('catalogo.subtitulo')}</p>
      </div>

      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <div className="position-relative w-100" style={{ maxWidth: '24rem' }}>
            <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={pesquisa}
              onChange={(e) => { setPesquisa(e.target.value); setPagina(1) }}
              placeholder={t('catalogo.procurar')}
              className="form-control rounded-pill ps-5"
            />
          </div>
          <span className="small text-muted text-nowrap d-none d-sm-inline">
            {t('catalogo.resultados', { count: filtrados.length })}
          </span>
        </div>
        {totalPaginas > 1 && <Paginacao pagina={paginaAtual} total={totalPaginas} onChange={setPagina} />}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState icon={Award} title={t('catalogo.vazioTitulo')} description={t('catalogo.vazioDesc')} />
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {visiveis.map((b) => (
            <div className="col" key={b.id}>
              <Link
                to={`/catalogo/${b.id}`}
                className="badge-tile d-flex flex-column h-100 overflow-hidden rounded-4 border bg-white text-decoration-none"
              >
                <div className={`position-relative ${TECH_TINTS[b.tint] || TECH_TINTS.sky}`} style={{ height: '5.5rem' }}>
                  {b.fornecedor && (
                    <span className="position-absolute top-0 start-0 m-2 rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">
                      {b.fornecedor}
                    </span>
                  )}
                  <div className="badge-seal position-absolute start-50 translate-middle-x" style={{ height: '3.75rem', width: '3.75rem', bottom: '-1.5rem' }}>
                    {b.imagem
                      ? <img src={b.imagem} alt="" className="w-100 h-100 rounded-circle object-fit-cover" />
                      : <Award size={26} />}
                  </div>
                </div>

                <div className="d-flex flex-column flex-grow-1 px-3 pb-3 text-center" style={{ paddingTop: '2rem' }}>
                  <p className="fw-semibold text-ink mb-1" style={{ lineHeight: 1.3 }}>{b.nome}</p>
                  {b.nivel && <p className="fs-xs text-muted mb-3">{t('catalogo.nivel')} {b.nivel}</p>}
                  <div className="mt-auto d-flex align-items-center justify-content-center gap-2">
                    <span className="d-inline-flex align-items-center gap-1 rounded-pill bg-warning-subtle text-warning-emphasis px-2 py-1 fs-xs fw-semibold">
                      <Coins size={12} /> {b.ponto} {t('catalogo.pontos')}
                    </span>
                  </div>
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
