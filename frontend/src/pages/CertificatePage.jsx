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
    return <div className="grid min-h-screen place-items-center text-muted">{t('certificado.gerando')}</div>
  }
  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        {t('certificado.naoEncontrado')} <Link to="/" className="ml-1 text-brand hover:underline">{t('certificado.voltarInicio')}</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/historico" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
            <ArrowLeft size={16} /> {t('certificado.voltar')}
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Download size={16} /> {t('certificado.imprimir')}
          </button>
        </div>

        {/* Certificado */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-10 shadow-lg">
          {/* faixas douradas */}
          <div className="absolute left-0 top-0 h-24 w-44 -translate-x-10 -translate-y-12 rotate-[-25deg] bg-gradient-to-r from-amber-300 to-yellow-500" />
          <div className="absolute bottom-0 right-0 h-20 w-56 translate-x-12 translate-y-10 rotate-[-25deg] bg-gradient-to-r from-amber-300 to-yellow-500" />

          <div className="relative">
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              {t('certificado.titulo')} <span className="text-brand">SOFTINSA</span>
            </p>

            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
              {t('certificado.texto1.inicio')} <strong className="text-ink">{data.consultor?.nome}</strong> {t('certificado.texto1.meio')}{' '}
              <strong className="text-ink">{data.badge?.nome}</strong> ({data.badge?.fornecedor}) {t('certificado.texto1.fim')}{' '}
              <strong className="text-ink">{formatar(data.dataAtribuicao, currentLocale)}</strong>.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {t('certificado.texto2')}
            </p>

            <div className="mt-10 flex items-end justify-between">
              <div className="grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-white shadow">
                <Award size={30} />
              </div>
              <p className="text-xl font-extrabold tracking-tight text-brand">SOFTINSA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}