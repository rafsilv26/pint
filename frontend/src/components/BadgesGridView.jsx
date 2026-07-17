import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Coins, Award, Crown } from 'lucide-react'
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

export default function BadgesGridView({ titulo, linkBase, permitirCatalogoGlobal = false }) {
  const { t } = useTranslation()
  const [scope, setScope] = useState('mine')
  const [tipo, setTipo] = useState('badges')
  // Cache por vista: cada scope/tipo faz fetch à DB remota uma vez; trocas
  // seguintes são instantâneas. Auto-refresh invalida só a vista ativa.
  const cache = useRef({})
  const keyFor = () => (tipo === 'premium' ? 'premium' : `badges:${scope}`)
  const { data, loading, error, reload } = useAsync(
    () => {
      const key = keyFor()
      if (cache.current[key]) return cache.current[key]
      const req = tipo === 'premium'
        ? api.getBadgesPremium()
        : api.getBadges({ scope: scope === 'all' ? 'all' : undefined })
      return Promise.resolve(req).then((d) => { cache.current[key] = d; return d })
    },
    [scope, tipo]
  )
  const refresh = () => { delete cache.current[keyFor()]; reload() }
  useAutoRefresh(refresh)
  const [q, setQ] = useState('')

  if (error) return <ErrorState onRetry={refresh} />
  // useAsync mantém data antiga durante a troca de tipo; ignora até coincidir shape
  const rowsArePremium = data && data.length > 0 && data[0].requisitos === undefined
  const stale = data && data.length > 0 && rowsArePremium !== (tipo === 'premium')
  if (loading || !data || stale) return <Spinner />

  const query = q.toLowerCase()
  const lista = tipo === 'premium'
    ? data.filter((b) => b.ativo !== false && `${b.nome} ${b.descricao} ${b.criterio}`.toLowerCase().includes(query))
    : data.filter((b) => b.ativo !== false && `${b.nome} ${b.nivel} ${b.fornecedor}`.toLowerCase().includes(query))

  const tituloFinal = titulo || t('badgesGrid.tituloDefault')

  return (
    <div>
      <PageHeader title={tituloFinal} />

      <div className="d-inline-flex rounded-3 bg-white p-1 border mb-4">
        <button
          type="button"
          onClick={() => setTipo('badges')}
          className={`btn btn-sm rounded-2 fw-medium ${tipo === 'badges' ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}
        >
          {t('badgesGrid.badgesTab')}
        </button>
        <button
          type="button"
          onClick={() => setTipo('premium')}
          className={`btn btn-sm rounded-2 fw-medium d-inline-flex align-items-center gap-1 ${tipo === 'premium' ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}
        >
          <Crown size={14} /> {t('badgesGrid.premiumTab')}
        </button>
      </div>
      {permitirCatalogoGlobal && tipo === 'badges' && (
        <div className="mb-4 d-flex flex-wrap gap-2" role="tablist" aria-label={t('badgesGrid.filtroCatalogo')}>
          <button
            type="button"
            onClick={() => setScope('mine')}
            className={`btn btn-sm ${scope === 'mine' ? 'btn-brand' : 'btn-outline-secondary'}`}
            role="tab"
            aria-selected={scope === 'mine'}
          >
            {t('badgesGrid.minhaServiceLine')}
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`btn btn-sm ${scope === 'all' ? 'btn-brand' : 'btn-outline-secondary'}`}
            role="tab"
            aria-selected={scope === 'all'}
          >
            {t('badgesGrid.todosBadges')}
          </button>
        </div>
      )}
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
          icon={tipo === 'premium' ? Crown : Award}
          title={tipo === 'premium' ? t('badgesGrid.premiumVazioTitulo') : t('badgesGrid.vazioTitulo')}
          description={tipo === 'premium' ? t('badgesGrid.premiumVazioDesc') : t('badgesGrid.vazioDesc')}
        />
      ) : tipo === 'premium' ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {lista.map((b) => (
            <div key={b.id} className="col">
              <div className="h-100 overflow-hidden rounded-4 border bg-white shadow-sm">
                <div className="d-flex align-items-center justify-content-center tint-violet-soft" style={{ height: '6rem' }}>
                  <div className="avatar-circle bg-white text-warning-emphasis" style={{ height: '3.5rem', width: '3.5rem' }}>
                    <Crown size={22} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="fw-semibold text-ink mb-1 d-flex align-items-center gap-1">
                    <Crown size={15} className="text-warning-emphasis" /> {b.nome}
                  </p>
                  {b.descricao && <p className="small text-muted mb-2">{b.descricao}</p>}
                  {b.criterio && (
                    <p className="fs-xs text-muted mb-0">
                      <span className="fw-medium">{t('badgesGrid.premiumCriterio')}:</span> {b.criterio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
