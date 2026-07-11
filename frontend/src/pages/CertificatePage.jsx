import { useParams, Link } from 'react-router-dom'
import { Download, ArrowLeft, Award } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Modificámos a função para aceitar o idioma e formatar a data de acordo com a região
function formatar(d, locale = 'pt-PT') {
  return d ? new Date(d).toLocaleDateString(locale) : '—'
}

export default function CertificatePage() {
  const { t, i18n } = useTranslation() // <-- Inicializamos a tradução e o i18n (para a data)
  const { token } = useParams()
  const { data, loading } = useAsync(() => api.verificarBadge(token), [token])

  // Mapear o idioma atual do i18n para o formato de data correto
  const localeMap = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES'
  }
  const currentLocale = localeMap[i18n.language?.substring(0, 2)] || 'pt-PT'

  if (loading) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center text-muted">{t('certificado.gerando')}</div>
  }
  if (!data) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center text-muted">
        {t('certificado.naoEncontrado')} <Link to="/" className="ms-1 text-brand text-decoration-none">{t('certificado.voltarInicio')}</Link>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-light px-3 py-4">
      <div className="mx-auto" style={{ maxWidth: '48rem' }}>
        <div className="mb-3 d-flex align-items-center justify-content-between d-print-none">
          <Link to="/historico" className="d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
            <ArrowLeft size={16} /> {t('certificado.voltar')}
          </Link>
          <button
            onClick={() => window.print()}
            className="btn btn-brand d-flex align-items-center gap-2"
          >
            <Download size={16} /> {t('certificado.imprimir')}
          </button>
        </div>

        {/* Certificado */}
        <div className="position-relative overflow-hidden rounded-4 border bg-white p-5 shadow-lg">
          {/* faixas douradas */}
          <div
            className="position-absolute"
            style={{
              left: 0, top: 0, height: '6rem', width: '11rem',
              transform: 'translate(-2.5rem, -3rem) rotate(-25deg)',
              background: 'linear-gradient(90deg,#fcd34d,#eab308)',
            }}
          />
          <div
            className="position-absolute"
            style={{
              right: 0, bottom: 0, height: '5rem', width: '14rem',
              transform: 'translate(3rem, 2.5rem) rotate(-25deg)',
              background: 'linear-gradient(90deg,#fcd34d,#eab308)',
            }}
          />

          <div className="position-relative">
            <p className="fs-2 fw-bold text-ink" style={{ letterSpacing: '-0.02em' }}>
              {t('certificado.titulo')} <span className="text-brand">SOFTINSA</span>
            </p>

            <p className="mt-4 small text-muted" style={{ maxWidth: '32rem', lineHeight: 1.6 }}>
              {t('certificado.texto1.inicio')} <strong className="text-ink">{data.consultor?.nome}</strong> {t('certificado.texto1.meio')}{' '}
              <strong className="text-ink">{data.badge?.nome}</strong> ({data.badge?.fornecedor}) {t('certificado.texto1.fim')}{' '}
              <strong className="text-ink">{formatar(data.dataAtribuicao, currentLocale)}</strong>.
            </p>
            <p className="mt-2 small text-muted" style={{ maxWidth: '32rem', lineHeight: 1.6 }}>
              {t('certificado.texto2')}
            </p>

            <div className="mt-5 d-flex align-items-end justify-content-between">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow"
                style={{ height: '4rem', width: '4rem', background: 'linear-gradient(135deg,#fcd34d,#eab308)' }}
              >
                <Award size={30} />
              </div>
              <p className="fs-4 fw-bold text-brand mb-0" style={{ letterSpacing: '-0.02em' }}>SOFTINSA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
