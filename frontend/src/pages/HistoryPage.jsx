import { Link } from 'react-router-dom'
import { Award, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { PageHeader, Card, Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

function formatarData(d) {
  return d ? new Date(d).toLocaleDateString('pt-PT') : '—'
}

export default function HistoryPage() {
  const { data: badges, loading, error, reload } = useAsync(() => api.getMeusBadges())

  return (
    <div>
      <PageHeader title="Histórico de Badges" subtitle="Os badges que já conquistaste." />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (badges || []).length === 0 ? (
        <EmptyState icon={Award} title="Ainda não tens badges" description="Conquista o teu primeiro badge!" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {badges.map((b) => {
            const expirado = b.expirationDate && new Date(b.expirationDate) < new Date()
            return (
              <Card key={b.badgeId}>
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                    <Award size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{b.nome}</p>
                      {b.valid && !expirado && (
                        <ShieldCheck size={16} className="text-green-600" title="Válido" />
                      )}
                    </div>
                    <p className="text-sm text-muted">{b.fornecedor}</p>
                    <p className="mt-1 text-xs text-muted">
                      Obtido a {formatarData(b.obtainedDate)}
                      {b.expirationDate ? ` · expira a ${formatarData(b.expirationDate)}` : ' · não expira'}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {b.pontos} pts
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  <Link
                    to={`/certificado/${b.publicToken}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    <Download size={16} /> Certificado
                  </Link>
                  <Link
                    to={`/badge/${b.publicToken}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
                  >
                    <ExternalLink size={16} /> Página pública
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
