import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function TalentCandidaturasPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [tab, setTab] = useState('pendentes')
  const { data, loading, error, reload } = useAsync(() => api.getTalentCandidaturas(tab), [tab])
  const lista = data || []

  // Declarar as tabs dentro do componente para poder traduzir com o t()
  const TABS = [
    { key: 'pendentes', label: t('talentCandidaturas.tabs.pendentes') },
    { key: 'validadas', label: t('talentCandidaturas.tabs.validadas') },
    { key: 'relatorios', label: t('talentCandidaturas.tabs.relatorios') },
  ]

  return (
    <div>
      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex rounded-3 bg-white p-1 border">
          {TABS.map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key)}
              className={`btn btn-sm rounded-2 fw-medium ${
                tab === tItem.key ? 'btn-brand' : 'btn-link text-muted text-decoration-none'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
        <ExportButtons />
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title={t('talentCandidaturas.empty.titulo')}
              description={t('talentCandidaturas.empty.descricao')}
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.trackingId')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.consultor')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.badge')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.nivel')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.data')}</th>
                  <th className="px-3 py-2">{t('talentCandidaturas.tabela.estado')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 fw-medium text-ink">{c.trackingId}</td>
                    <td className="px-3 py-2 text-ink">{c.consultor}</td>
                    <td className="px-3 py-2 text-ink">{c.badge}</td>
                    <td className="px-3 py-2 text-muted">{c.nivel}</td>
                    <td className="px-3 py-2 text-muted">{c.data}</td>
                    <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                    <td className="px-3 py-2 text-end">
                      <Link
                        to={`/tm/candidaturas/${c.id}`}
                        className="btn btn-brand btn-sm d-inline-flex align-items-center gap-1"
                      >
                        {t('talentCandidaturas.tabela.verCandidatura')} <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
