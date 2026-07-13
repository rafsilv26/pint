import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award } from 'lucide-react'
import { PageHeader, Spinner, ErrorState, EmptyState } from './ui'
import { useAsync } from '../hooks/useAsync'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const TECH_TINTS = {
  salmon: 'tint-salmon-soft',
  sky: 'tint-sky-soft',
  emerald: 'tint-emerald-soft',
  violet: 'tint-violet-soft',
}

export default function BadgesGridView({ titulo, linkBase }) {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getBadges())
  useAutoRefresh(reload)
  const [q, setQ] = useState('')

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const lista = data.filter((b) => b.ativo !== false && `${b.nome} ${b.nivel} ${b.fornecedor}`.toLowerCase().includes(q.toLowerCase()))

  const tituloFinal = titulo || t('badgesGrid.tituloDefault')

  return (
    <div>
      <PageHeader title={tituloFinal} />
      <div className="position-relative mb-4" style={{ maxWidth: '24rem' }}>
        <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('badgesGrid.pesquisar')}
          className="form-control rounded-pill ps-5"
        />
      </div>
      {lista.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('badgesGrid.vazioTitulo')}
          description={t('badgesGrid.vazioDesc')}
        />
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {lista.map((b) => {
            const conteudo = (
              <>
                <div className={`d-flex align-items-center justify-content-center ${TECH_TINTS[b.tint] || TECH_TINTS.sky}`} style={{ height: '6rem' }}>
                  <div className="avatar-circle bg-white fs-4" style={{ height: '3.5rem', width: '3.5rem' }}>{b.nome[0]}</div>
                </div>
                <div className="p-3 text-center">
                  <p className="fw-semibold text-ink mb-0">{b.nome} - {t('badgesGrid.nivel')} {b.nivel}</p>
                  <p className="mt-1 mb-0 d-flex align-items-center justify-content-center gap-1 small fw-medium text-warning-emphasis">
                    <Coins size={14} /> {b.ponto} {t('badgesGrid.pontos')}
                  </p>
                </div>
              </>
            )
            const cls = `d-block overflow-hidden rounded-4 border bg-white shadow-sm text-decoration-none ${linkBase ? 'hover-shadow' : ''}`
            return (
              <div key={b.id} className="col">
                {linkBase
                  ? <Link to={`${linkBase}/${b.id}`} className={cls}>{conteudo}</Link>
                  : <div className={cls}>{conteudo}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
