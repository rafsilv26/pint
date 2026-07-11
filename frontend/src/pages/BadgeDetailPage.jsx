import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Coins } from 'lucide-react'
import { Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const HERO_TINTS = {
  salmon: 'tint-salmon',
  sky: 'tint-sky',
  emerald: 'tint-emerald',
  violet: 'tint-violet',
}

export default function BadgeDetailPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { id } = useParams()
  const { data: badge, loading, error, reload } = useAsync(() => api.getBadge(id), [id])
  const [aberto, setAberto] = useState(0)

  const voltar = (
    <Link to="/catalogo" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
      <ArrowLeft size={16} /> {t('badgeDetail.voltar')}
    </Link>
  )

  if (loading) return <Spinner />
  if (error) return <div>{voltar}<ErrorState onRetry={reload} /></div>
  if (!badge) {
    return <div>{voltar}<p className="mt-3 text-muted">{t('badgeDetail.naoEncontrado')}</p></div>
  }

  return (
    <div>
      {voltar}

      {/* Hero */}
      <div className={`overflow-hidden rounded-4 p-4 p-sm-5 ${HERO_TINTS[badge.tint] || HERO_TINTS.sky}`}>
        <div className="d-flex align-items-center justify-content-between gap-4 flex-wrap">
          <div>
            <div className="d-flex flex-wrap gap-2">
              <span className="rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">{badge.nivel}</span>
              <span className="d-flex align-items-center gap-1 rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">
                <Coins size={12} /> {badge.ponto} {t('badgeDetail.pontos')}
              </span>
              {badge.duracaoMeses && (
                <span className="rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink">
                  {t('badgeDetail.frequencia')}: {Math.round(badge.duracaoMeses / 12)} {t('badgeDetail.anos')}
                </span>
              )}
            </div>
            <h1 className="mt-3 fs-2 fs-sm-1 fw-bold text-ink">{t('badgeDetail.badgeDe')} {badge.nome}</h1>
            <Link
              to={`/candidaturas/nova?badge=${badge.id}`}
              className="mt-4 d-inline-block rounded-3 btn btn-brand px-4 py-2 fw-semibold"
            >
              {t('badgeDetail.candidatar')}
            </Link>
          </div>
          <div className="d-none d-sm-block flex-shrink-0 text-center">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-white fs-1 fw-bold text-ink shadow" style={{ height: '6rem', width: '6rem' }}>
              {badge.nome[0]}
            </div>
            <p className="mt-2 small fw-medium text-ink">{badge.fornecedor}</p>
          </div>
        </div>
      </div>

      {/* Descrição + Requisitos */}
      <div className="mt-4 row g-4">
        <section className="col-lg-6">
          <h2 className="mb-3 fw-semibold text-ink">{t('badgeDetail.descricao')}</h2>
          <p className="small text-muted" style={{ lineHeight: 1.6 }}>{badge.descricao}</p>
          <p className="mt-3 small text-muted" style={{ lineHeight: 1.6 }}>
            {t('badgeDetail.descTextoExtra')}
          </p>
        </section>

        <section className="col-lg-6">
          <h2 className="mb-3 fw-semibold text-ink">{t('badgeDetail.requisitos')}</h2>
          {badge.requisitos.length === 0 ? (
            <p className="rounded-3 border border-dashed p-3 small text-muted">
              {t('badgeDetail.semRequisitos')}
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {badge.requisitos.map((req, i) => (
                <div key={req.id ?? i} className="overflow-hidden rounded-3 border bg-white">
                  <button
                    onClick={() => setAberto(aberto === i ? -1 : i)}
                    className="d-flex w-100 align-items-center justify-content-between gap-2 px-3 py-2 text-start small fw-medium text-ink btn btn-link text-decoration-none"
                  >
                    {i + 1}. {req.titulo}
                    <ChevronDown size={18} className="flex-shrink-0 text-muted" style={{ transform: aberto === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {aberto === i && (
                    <p className="border-top px-3 py-2 small text-muted mb-0">
                      {t('badgeDetail.requisitoTextoExtra')}
                    </p>
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
