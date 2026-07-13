import { Link } from 'react-router-dom'
import { Award, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui'
import LinkedinGlyph from '../components/LinkedinGlyph'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { partilharLinkedin } from '../utils/share'
import { useTranslation } from 'react-i18next'

function formatarData(d, locale = 'pt-PT') {
  return d ? new Date(d).toLocaleDateString(locale) : '—'
}

export default function HistoryPage() {
  const { t, i18n } = useTranslation()
  const { data: badges, loading, error, reload } = useAsync(() => api.getMeusBadges())

  const localeMap = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES'
  }
  const currentLocale = localeMap[i18n.language?.substring(0, 2)] || 'pt-PT'

  return (
    <div>
      <PageHeader
        title={t('historico.titulo')}
        subtitle={t('historico.subtitulo')}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (badges || []).length === 0 ? (
        <EmptyState
          icon={Award}
          title={t('historico.vazioTitulo')}
          description={t('historico.vazioDesc')}
        />
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 g-3">
          {badges.map((b) => {
            const expirado = b.expirationDate && new Date(b.expirationDate) < new Date()
            return (
              <div className="col" key={b.badgeId}>
                <Card>
                  <div className="d-flex align-items-start gap-3">
                    <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 bg-brand-light text-brand" style={{ height: '3.5rem', width: '3.5rem' }}>
                      <Award size={28} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <p className="fw-semibold text-ink mb-0">{b.nome}</p>
                        {b.valid && !expirado && (
                          <ShieldCheck size={16} className="text-success" title={t('historico.valido')} />
                        )}
                      </div>
                      <p className="small text-muted mb-0">{b.fornecedor}</p>
                      <p className="mt-1 fs-xs text-muted mb-0">
                        {t('historico.obtidoA')} {formatarData(b.obtainedDate, currentLocale)}
                        {b.expirationDate
                          ? ` · ${t('historico.expiraA')} ${formatarData(b.expirationDate, currentLocale)}`
                          : ` · ${t('historico.naoExpira')}`
                        }
                      </p>
                    </div>
                    <span className="rounded-pill bg-brand-light px-2 py-1 fs-xs fw-semibold text-brand">
                      {b.pontos} {t('historico.pontos')}
                    </span>
                  </div>

                  <div className="mt-3 d-flex gap-2 border-top pt-3">
                    <Link
                      to={`/certificado/${b.publicToken}`}
                      className="btn btn-brand btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <Download size={16} /> {t('historico.certificado')}
                    </Link>
                    <Link
                      to={`/badge/${b.publicToken}`}
                      className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <ExternalLink size={16} /> {t('historico.paginaPublica')}
                    </Link>
                    {b.valid && !expirado && (
                      <button
                        onClick={() => partilharLinkedin(b.publicToken)}
                        className="btn btn-sm d-inline-flex align-items-center gap-1 text-white ms-auto"
                        style={{ backgroundColor: '#0a66c2' }}
                        title={t('historico.partilhar')}
                      >
                        <LinkedinGlyph size={15} /> {t('historico.partilhar')}
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
