import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, FileText, Award, Plus, RefreshCw } from 'lucide-react'
import { Spinner, EmptyState, StatusPill, ErrorState } from '../components/ui'
import LinkedinGlyph from '../components/LinkedinGlyph'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { partilharLinkedin } from '../utils/share'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const CARD_TINT = {
  blue: 'bg-primary-subtle bg-opacity-50',
  amber: 'bg-warning-subtle bg-opacity-50',
  green: 'bg-success-subtle bg-opacity-50',
  red: 'bg-danger-subtle bg-opacity-50',
  indigo: 'bg-info-subtle bg-opacity-50',
  gray: 'bg-light',
}
const BAR = {
  blue: 'bg-primary',
  amber: 'bg-warning',
  green: 'bg-success',
  red: 'bg-danger',
  indigo: 'bg-info',
  gray: 'bg-secondary',
}

function Acoes({ c }) {
  const { t } = useTranslation() // <-- Inicializa no componente auxiliar

  const detalhes = (
    <Link
      to={`/catalogo/${c.badge.id}`}
      className="btn btn-outline-secondary bg-white fs-xs fw-semibold"
    >
      {t('candidaturas.acoes.verDetalhes')}
    </Link>
  )

  if (c.status.code === 'APPROVED') {
    return (
      <>
        {detalhes}
        {c.badge.publicToken && (
          <button
            onClick={() => partilharLinkedin(c.badge.publicToken)}
            className="btn d-flex align-items-center gap-1 fs-xs fw-semibold text-white"
            style={{ backgroundColor: '#0a66c2' }}
          >
            <LinkedinGlyph size={14} /> {t('candidaturas.acoes.partilhar')}
          </button>
        )}
      </>
    )
  }
  if (c.status.code === 'REJECTED') {
    return (
      <>
        {detalhes}
        <Link
          to={`/candidaturas/nova?badge=${c.badge.id}`}
          className="btn btn-danger d-flex align-items-center gap-1 fs-xs fw-semibold"
        >
          <RefreshCw size={14} /> {t('candidaturas.acoes.reenviar')}
        </Link>
      </>
    )
  }
  return (
    <>
      {detalhes}
      <Link
        to={`/candidaturas/nova?badge=${c.badge.id}`}
        className="btn btn-outline-primary d-flex align-items-center gap-1 fs-xs fw-semibold"
      >
        <Plus size={14} /> {t('candidaturas.acoes.adicionarEvidencias')}
      </Link>
    </>
  )
}

export default function ApplicationsPage() {
  const { t } = useTranslation() // <-- Inicializa no componente principal
  const { data: candidaturas, loading, error, reload } = useAsync(() => api.getMinhasCandidaturas())
  const [pesquisa, setPesquisa] = useState('')

  const filtradas = (candidaturas || []).filter((c) =>
    c.badge.nome.toLowerCase().includes(pesquisa.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <h1 className="fs-2 fw-bold text-ink mb-0">{t('candidaturas.titulo')}</h1>
        <Link
          to="/candidaturas/nova"
          className="btn btn-brand d-flex align-items-center gap-1"
        >
          <Plus size={16} /> {t('candidaturas.nova')}
        </Link>
      </div>

      <div className="position-relative mb-4" style={{ maxWidth: '28rem' }}>
        <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder={t('candidaturas.pesquisar')}
          className="form-control ps-5"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('candidaturas.vazioTitulo')}
          description={t('candidaturas.vazioDesc')}
        />
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtradas.map((c) => (
            <div key={c.id} className={`rounded-4 border p-4 shadow-sm ${CARD_TINT[c.status.cor]}`}>
              <div className="d-flex align-items-start gap-3">
                <div
                  className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 text-white"
                  style={{ height: '3rem', width: '3rem', background: 'linear-gradient(135deg,#374151,#111827)' }}
                >
                  <Award size={22} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                    <div>
                      <p className="fw-semibold text-ink mb-0">{c.badge.nome}</p>
                      <div className="mt-1 d-flex flex-wrap gap-1">
                        {c.tags.map((tag) => (
                          <span key={tag} className="rounded-pill bg-white px-2 py-1 fs-xs fw-medium text-muted border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                </div>
              </div>

              {/* Progresso de avaliação */}
              <div className="mt-3">
                <div className="mb-1 d-flex align-items-center justify-content-between fs-xs text-muted">
                  <span>{t('candidaturas.progresso')}</span>
                  <span className="fw-semibold">{c.progresso}%</span>
                </div>
                <div className="w-100 overflow-hidden rounded-pill bg-white" style={{ height: '0.5rem' }}>
                  <div className={`h-100 rounded-pill ${BAR[c.status.cor]}`} style={{ width: `${c.progresso}%` }} />
                </div>
              </div>

              {/* Meta */}
              <div className="mt-3 d-flex flex-wrap gap-3 fs-xs text-muted">
                <span className="d-flex align-items-center gap-1"><Calendar size={13} /> {t('candidaturas.meta.submetido')} {c.submittedDate}</span>
                <span className="d-flex align-items-center gap-1"><Clock size={13} /> {c.diasAnalise} {t('candidaturas.meta.diasAnalise')}</span>
                <span className="d-flex align-items-center gap-1"><FileText size={13} /> {c.evidencias} {t('candidaturas.meta.evidencias')}</span>
              </div>

              {/* Feedback (rejeitada) */}
              {c.feedback && (
                <div className="mt-3 rounded-3 bg-danger-subtle p-3 border border-danger-subtle">
                  <p className="fs-xs fw-semibold text-danger mb-0">{t('candidaturas.feedback.de')} {c.feedback.papel}</p>
                  <p className="mt-1 fs-xs text-danger-emphasis mb-0">{c.feedback.texto}</p>
                  <p className="mt-1 fs-xs text-muted mb-0">— {c.feedback.autor}</p>
                </div>
              )}

              {/* Ações */}
              <div className="mt-3 d-flex flex-wrap justify-content-end gap-2">
                <Acoes c={c} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
