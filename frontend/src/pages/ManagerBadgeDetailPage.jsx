import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarClock, ChevronDown, Coins, Layers3, Network, Tag } from 'lucide-react'
import { Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const HERO_TINTS = {
  salmon: 'tint-salmon',
  sky: 'tint-sky',
  emerald: 'tint-emerald',
  violet: 'tint-violet',
}

export default function ManagerBadgeDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: badge, loading, error, reload } = useAsync(() => api.getBadge(id), [id])
  const [aberto, setAberto] = useState(0)

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!badge) return <p className="text-muted">{t('managerBadge.naoEncontrado')}</p>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('managerBadge.voltar')}
      </button>

      <div className={`overflow-hidden rounded-4 p-4 p-sm-5 ${HERO_TINTS[badge.tint] || HERO_TINTS.sky}`}>
        <div className="d-flex align-items-center justify-content-between gap-4 flex-wrap">
          <div>
            <div className="d-flex flex-wrap gap-2">
              <span className="rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">{badge.nivel}</span>
              <span className="d-flex align-items-center gap-1 rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">
                <Coins size={12} /> {badge.ponto} {t('managerBadge.pontos')}
              </span>
              {badge.ativo === false && <span className="rounded-pill text-bg-secondary px-2 py-1 fs-xs fw-semibold">{t('tmWorkspace.catalog.inactive')}</span>}
            </div>
            <h1 className="mt-3 fs-2 fs-sm-1 fw-bold text-ink">{t('managerBadge.badgeDe')} {badge.nome}</h1>
          </div>
          <div className="d-none d-sm-block flex-shrink-0 text-center">
            <div className="d-flex align-items-center justify-content-center overflow-hidden rounded-circle bg-white fs-1 fw-bold text-ink shadow" style={{ height: '6rem', width: '6rem' }}>{badge.imagem ? <img src={badge.imagem} alt="" className="w-100 h-100 object-fit-cover" /> : badge.nome[0]}</div>
            <p className="mt-2 small fw-medium text-ink">{badge.fornecedor}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 d-flex flex-wrap gap-2">
        {badge.learningPath && <span className="badge text-bg-light border d-inline-flex align-items-center gap-1 px-3 py-2"><Layers3 size={13} />{badge.learningPath}</span>}
        {badge.serviceLine && <span className="badge text-bg-light border d-inline-flex align-items-center gap-1 px-3 py-2"><Network size={13} />{badge.serviceLine}</span>}
        {badge.area && <span className="badge text-bg-light border d-inline-flex align-items-center gap-1 px-3 py-2"><Tag size={13} />{badge.area}</span>}
        <span className="badge text-bg-light border d-inline-flex align-items-center gap-1 px-3 py-2"><CalendarClock size={13} />{badge.duracaoMeses ? t('tmWorkspace.badgeDetail.monthsValidity', { count: badge.duracaoMeses }) : t('tmWorkspace.common.semExpiracao')}</span>
      </div>

      <div className="mt-4 row g-4">
        <section className="col-lg-6">
          <h2 className="mb-3 fw-semibold text-ink">{t('managerBadge.descricao')}</h2>
          <p className="small text-muted" style={{ lineHeight: 1.6 }}>{badge.descricao}</p>
        </section>
        <section className="col-lg-6">
          <h2 className="mb-3 fw-semibold text-ink">{t('managerBadge.requisitos')}</h2>
          {badge.requisitos.length === 0 ? (
            <p className="rounded-3 border border-dashed p-3 small text-muted">{t('managerBadge.semRequisitos')}</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {badge.requisitos.map((req, i) => (
                <div key={req.id ?? i} className="overflow-hidden rounded-3 border bg-white">
                  <button onClick={() => setAberto(aberto === i ? -1 : i)} className="d-flex w-100 align-items-center justify-content-between gap-2 px-3 py-2 text-start small fw-medium text-ink btn btn-link text-decoration-none">
                    {i + 1}. {req.titulo}
                    <ChevronDown size={18} className="flex-shrink-0 text-muted" style={{ transform: aberto === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {aberto === i && (
                    <div className="border-top px-3 py-3">
                      <p className="small text-muted mb-0">{req.descricao || t('managerBadge.requisitoTextoExtra')}</p>
                      <span className={`mt-2 badge ${req.obrigatorio === false ? 'text-bg-light border' : 'text-bg-primary'}`}>{req.obrigatorio === false ? t('tmWorkspace.badgeDetail.optional') : t('tmWorkspace.badgeDetail.required')}</span>
                      {/^https?:\/\//i.test(req.icone || '') && <img src={req.icone} alt="" className="mt-3 d-block rounded-2 border object-fit-cover" style={{ width: 96, height: 64 }} />}
                    </div>
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
