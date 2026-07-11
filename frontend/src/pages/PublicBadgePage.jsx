import { useParams } from 'react-router-dom'
import { Award, ShieldCheck, ShieldX } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Função adaptada para receber o idioma atual (locale)
function formatarData(d, locale = 'pt-PT') {
  return d ? new Date(d).toLocaleDateString(locale) : null
}

// Página PÚBLICA (sem login) — verificação de um badge por link único.
export default function PublicBadgePage() {
  const { t, i18n } = useTranslation() // <-- Inicializa a tradução e o i18n
  const { token } = useParams()
  const { data, loading } = useAsync(() => api.verificarBadge(token), [token])

  // Mapear o idioma atual para o formato de data correto
  const localeMap = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES'
  }
  const currentLocale = localeMap[i18n.language?.substring(0, 2)] || 'pt-PT'

  return (
    <div className="d-flex min-vh-100 flex-column align-items-center justify-content-center bg-light p-4">
      <div className="mb-4 d-flex align-items-center gap-3 fs-4 fw-bold text-brand">
        <span className="d-flex align-items-center justify-content-center rounded-3 bg-brand text-white" style={{ height: '2.5rem', width: '2.5rem' }}>S</span>
        Softinsa Badges
      </div>

      {loading ? (
        <p className="text-muted">{t('publicBadge.verificando')}</p>
      ) : !data ? (
        <div className="w-100 rounded-4 border bg-white p-5 text-center shadow-sm" style={{ maxWidth: '28rem' }}>
          <ShieldX size={48} className="mx-auto text-danger" />
          <h1 className="mt-3 fs-5 fw-bold text-ink">{t('publicBadge.naoEncontradoTitulo')}</h1>
          <p className="mt-1 small text-muted">{t('publicBadge.naoEncontradoDesc')}</p>
        </div>
      ) : (
        <div className="w-100 rounded-4 border bg-white p-5 text-center shadow-sm" style={{ maxWidth: '28rem' }}>
          <div className="mx-auto d-flex align-items-center justify-content-center rounded-4 bg-brand-light text-brand" style={{ height: '5rem', width: '5rem' }}>
            <Award size={40} />
          </div>
          <h1 className="mt-4 fs-4 fw-bold text-ink">{data.badge.nome}</h1>
          <p className="mt-1 small text-muted">{data.badge.descricao}</p>

          <div
            className={`mt-3 d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 small fw-semibold ${
              data.valido ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
            }`}
          >
            {data.valido ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
            {data.valido ? t('publicBadge.valido') : t('publicBadge.expirado')}
          </div>

          <dl className="mt-4 d-flex flex-column gap-2 border-top pt-4 text-start small mb-0">
            <div className="d-flex justify-content-between">
              <dt className="text-muted fw-normal">{t('publicBadge.atribuidoA')}</dt>
              <dd className="fw-semibold text-ink mb-0">{data.consultor?.nome}</dd>
            </div>
            <div className="d-flex justify-content-between">
              <dt className="text-muted fw-normal">{t('publicBadge.emissor')}</dt>
              <dd className="fw-semibold text-ink mb-0">{data.badge.fornecedor}</dd>
            </div>
            <div className="d-flex justify-content-between">
              <dt className="text-muted fw-normal">{t('publicBadge.dataAtribuicao')}</dt>
              <dd className="fw-semibold text-ink mb-0">{formatarData(data.dataAtribuicao, currentLocale)}</dd>
            </div>
            <div className="d-flex justify-content-between">
              <dt className="text-muted fw-normal">{t('publicBadge.validade')}</dt>
              <dd className="fw-semibold text-ink mb-0">
                {formatarData(data.dataExpiracao, currentLocale) || t('publicBadge.naoExpira')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <p className="mt-4 fs-xs text-secondary">{t('publicBadge.footer')}</p>
    </div>
  )
}
