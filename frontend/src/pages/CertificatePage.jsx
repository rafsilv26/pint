import { useParams, Link } from 'react-router-dom'
import { Download, ArrowLeft, Award } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

function formatar(d) {
  return d ? new Date(d).toLocaleDateString('pt-PT') : '—'
}

// Página PÚBLICA — certificado de um badge conquistado.
export default function CertificatePage() {
  const { token } = useParams()
  const { data, loading } = useAsync(() => api.verificarBadge(token), [token])

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted">A gerar certificado…</div>
  }
  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        Certificado não encontrado. <Link to="/" className="ml-1 text-brand hover:underline">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/historico" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Download size={16} /> Descarregar / Imprimir
          </button>
        </div>

        {/* Certificado */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-10 shadow-lg">
          {/* faixas douradas */}
          <div className="absolute left-0 top-0 h-24 w-44 -translate-x-10 -translate-y-12 rotate-[-25deg] bg-gradient-to-r from-amber-300 to-yellow-500" />
          <div className="absolute bottom-0 right-0 h-20 w-56 translate-x-12 translate-y-10 rotate-[-25deg] bg-gradient-to-r from-amber-300 to-yellow-500" />

          <div className="relative">
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              CERTIFICADO <span className="text-brand">SOFTINSA</span>
            </p>

            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
              Certificamos que <strong className="text-ink">{data.consultor?.nome}</strong> concluiu o badge{' '}
              <strong className="text-ink">{data.badge?.nome}</strong> ({data.badge?.fornecedor}) no dia{' '}
              <strong className="text-ink">{formatar(data.dataAtribuicao)}</strong>.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Certificamos ainda que demonstrou possuir as competências necessárias para atuar nesta área,
              de acordo com os requisitos de certificação, sendo estes validados e aplicados com base nas
              evidências submetidas.
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
