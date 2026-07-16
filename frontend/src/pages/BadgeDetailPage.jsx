import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Coins, Award, Clock, ChevronRight, CheckCircle2, ListChecks, ExternalLink } from 'lucide-react'
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

// Estados de candidatura que ainda estão "vivos" (ainda em processo). APPROVED
// já é conquista e REJECTED permite recandidatar, por isso ficam de fora.
const ESTADOS_ATIVOS = ['OPEN', 'SUBMITTED', 'IN_VALIDATION', 'VALIDATED', 'IN_APPROVAL']

export default function BadgeDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data: badge, loading, error, reload } = useAsync(() => api.getBadge(id), [id])

  // Estado do consultor para este badge: já conquistado e/ou com candidatura
  // em curso. Serve só para decidir que ação mostrar — falha em silêncio.
  const { data: estado } = useAsync(async () => {
    const [conquistados, candidaturas] = await Promise.all([
      api.getMeusBadges().catch(() => []),
      api.getMinhasCandidaturas().catch(() => []),
    ])
    return { conquistados, candidaturas }
  }, [id])

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

  const trilho = [badge.learningPath, badge.serviceLine, badge.area].filter(Boolean)
  const validade = badge.duracaoMeses
    ? `${Math.max(1, Math.round(badge.duracaoMeses / 12))} ${t('badgeDetail.anos')}`
    : t('badgeDetail.naoExpira')

  const pill = 'rounded-pill bg-white bg-opacity-75 px-2 py-1 fs-xs fw-semibold text-ink'

  const jaConquistado = (estado?.conquistados || []).some(
    (b) => Number(b.badgeId) === Number(badge.id) && b.valid !== false,
  )
  const candidaturaAtiva = (estado?.candidaturas || []).some(
    (c) => Number(c.badge?.id) === Number(badge.id) && ESTADOS_ATIVOS.includes(c.status?.code),
  )
  // Só mostra "Candidatar" depois de confirmar o estado (estado != null) e se
  // não houver conquista nem candidatura em curso. Evita o botão certo piscar
  // antes da verificação chegar.
  const podeCandidatar = Boolean(estado) && !jaConquistado && !candidaturaAtiva

  return (
    <div>
      {voltar}

      <div className={`overflow-hidden rounded-4 p-4 p-sm-5 ${HERO_TINTS[badge.tint] || HERO_TINTS.sky}`}>
        {trilho.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-1 fs-xs fw-medium text-ink text-opacity-75 mb-3">
            {trilho.map((n, i) => (
              <span key={n} className="d-inline-flex align-items-center gap-1">
                {i > 0 && <ChevronRight size={12} />}{n}
              </span>
            ))}
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between gap-4 flex-wrap">
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap gap-2">
              {badge.nivel && <span className={pill}>{badge.nivel}</span>}
              <span className={`d-inline-flex align-items-center gap-1 ${pill}`}>
                <Coins size={12} /> {badge.ponto} {t('badgeDetail.pontos')}
              </span>
              <span className={`d-inline-flex align-items-center gap-1 ${pill}`}>
                <Clock size={12} /> {t('badgeDetail.validade')}: {validade}
              </span>
            </div>
            <h1 className="mt-3 fs-2 fs-sm-1 fw-bold text-ink mb-0">{badge.nome}</h1>
            {badge.fornecedor && (
              <p className="mt-1 small text-ink text-opacity-75 mb-0">{t('badgeDetail.emitidoPor')} {badge.fornecedor}</p>
            )}
            {podeCandidatar && (
              <Link
                to={`/candidaturas/nova?badge=${badge.id}`}
                className="mt-4 d-inline-flex align-items-center gap-2 rounded-3 btn btn-brand px-4 py-2 fw-semibold"
              >
                <Award size={18} /> {t('badgeDetail.candidatar')}
              </Link>
            )}
            {jaConquistado && (
              <span className="mt-4 d-inline-flex align-items-center gap-2 rounded-3 bg-white bg-opacity-75 px-4 py-2 fw-semibold text-success">
                <CheckCircle2 size={18} /> {t('badgeDetail.jaConquistado')}
              </span>
            )}
            {!jaConquistado && candidaturaAtiva && (
              <Link
                to="/candidaturas"
                title={t('badgeDetail.candidaturaAtiva')}
                className="mt-4 d-inline-flex align-items-center gap-2 rounded-3 btn btn-outline-dark bg-white px-4 py-2 fw-semibold"
              >
                <Clock size={18} /> {t('badgeDetail.verCandidatura')}
              </Link>
            )}
          </div>

          <div className="d-none d-sm-block flex-shrink-0 text-center">
            <div className="badge-seal mx-auto" style={{ height: '7rem', width: '7rem' }}>
              {badge.imagem
                ? <img src={badge.imagem} alt="" className="w-100 h-100 rounded-circle object-fit-cover" />
                : <Award size={44} />}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 row g-4">
        <section className="col-lg-5">
          <h2 className="mb-3 fw-semibold text-ink">{t('badgeDetail.descricao')}</h2>
          {badge.descricao && <p className="text-muted" style={{ lineHeight: 1.7 }}>{badge.descricao}</p>}
          <p className="text-muted border-start border-3 border-brand ps-3" style={{ lineHeight: 1.7 }}>
            {t('badgeDetail.descTextoExtra')}
          </p>
          <a
            href="https://www.softinsa.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 d-inline-flex align-items-center gap-2 small fw-medium text-brand text-decoration-none"
          >
            <ExternalLink size={15} /> {t('badgeDetail.competenciasSoftinsa')}
          </a>
        </section>

        <section className="col-lg-7">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="fw-semibold text-ink mb-0 d-flex align-items-center gap-2">
              <ListChecks size={20} className="text-brand" /> {t('badgeDetail.requisitos')}
            </h2>
          </div>

          {badge.requisitos.length === 0 ? (
            <p className="rounded-3 border border-dashed p-3 small text-muted">{t('badgeDetail.semRequisitos')}</p>
          ) : (
            <>
              <div className="d-flex flex-column gap-2">
                {badge.requisitos.map((req, i) => {
                  const isObrigatorio = req.obrigatorio !== false
                  return (
                    <div key={req.id ?? i} className="rounded-3 border bg-white p-3 d-flex gap-3">
                      <span className="badge-seal flex-shrink-0 fw-bold" style={{ height: '2rem', width: '2rem', fontSize: '0.85rem' }}>
                        {i + 1}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <p className="fw-semibold text-ink mb-1">{req.titulo}</p>
                          <span className={`badge rounded-pill flex-shrink-0 ${isObrigatorio ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                            {isObrigatorio ? t('badgeDetail.obrigatorio') : t('badgeDetail.opcional')}
                          </span>
                        </div>
                        <p className="small text-muted mb-0" style={{ lineHeight: 1.6 }}>
                          {req.descricao || t('badgeDetail.requisitoTextoExtra')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 d-flex align-items-center gap-2 rounded-3 bg-brand-light text-brand px-3 py-2 fs-xs mb-0">
                <CheckCircle2 size={14} className="flex-shrink-0" /> {t('badgeDetail.todosRequisitos')}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
