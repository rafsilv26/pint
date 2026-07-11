import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star, Medal, Users } from 'lucide-react'
import { PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function ConsultoresPage({ linkBase }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, loading, error, reload } = useAsync(() => api.getConsultants())
  useAutoRefresh(reload)
  const [pesquisa, setPesquisa] = useState(searchParams.get('search') || '')

  const updateSearch = (value) => {
    setPesquisa(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
  }

  const lista = (data || []).filter((c) =>
    `${c.name} ${c.area || ''} ${c.serviceLine || ''}`.toLowerCase().includes(pesquisa.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title={t('diretorio.titulo')}
        subtitle={t('diretorio.subtitulo')}
      />

      <div className="position-relative mb-4" style={{ maxWidth: '28rem' }}>
        <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={pesquisa}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder={t('diretorio.pesquisar')}
          className="form-control ps-5"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('diretorio.vazioTitulo')}
          description={t('diretorio.vazioDesc')}
        />
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
          {lista.map((c) => {
            const conteudo = (
              <Card
                className={`d-flex align-items-center gap-3 ${linkBase ? 'hover-shadow' : ''}`}
                style={c.isCurrentUser ? { boxShadow: '0 0 0 3px rgba(30,108,171,0.25)' } : undefined}
              >
                <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-brand-light fs-xs fw-semibold text-brand" style={{ height: '3rem', width: '3rem' }}>
                  {iniciais(c.name)}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <p className="text-truncate fw-semibold text-ink mb-0">
                    {c.name}
                    {c.isCurrentUser && <span className="ms-1 fs-xs fw-normal text-brand">{t('diretorio.tu')}</span>}
                  </p>
                  <p className="text-truncate fs-xs text-muted mb-0">{c.area || c.serviceLine || t('diretorio.consultorDefault')}</p>
                  <div className="mt-1 d-flex gap-3 fs-xs text-muted">
                    <span className="d-flex align-items-center gap-1"><Star size={12} className="text-warning" /> {c.points}</span>
                    <span className="d-flex align-items-center gap-1"><Medal size={12} style={{ color: '#fb923c' }} /> {c.badges}</span>
                  </div>
                </div>
                {c.rank ? <span className="small fw-bold text-muted">#{c.rank}</span> : null}
              </Card>
            )
            return linkBase
              ? <Link key={c.id} to={`${linkBase}/${c.id}`} className="d-block text-decoration-none">{conteudo}</Link>
              : <div key={c.id}>{conteudo}</div>
          })}
        </div>
      )}
    </div>
  )
}
