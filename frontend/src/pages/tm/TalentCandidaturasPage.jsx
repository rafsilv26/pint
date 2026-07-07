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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-gray-200">
          {TABS.map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                tab === tItem.key ? 'bg-brand text-white' : 'text-muted hover:text-ink'
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
          <div className="p-6"><Spinner /></div>
        ) : error ? (
          <div className="p-6"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-6">
            <EmptyState 
              icon={FileText} 
              title={t('talentCandidaturas.empty.titulo')} 
              description={t('talentCandidaturas.empty.descricao')} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.trackingId')}</th>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.consultor')}</th>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.badge')}</th>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.nivel')}</th>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.data')}</th>
                  <th className="px-4 py-3">{t('talentCandidaturas.tabela.estado')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{c.trackingId}</td>
                    <td className="px-4 py-3 text-ink">{c.consultor}</td>
                    <td className="px-4 py-3 text-ink">{c.badge}</td>
                    <td className="px-4 py-3 text-muted">{c.nivel}</td>
                    <td className="px-4 py-3 text-muted">{c.data}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/tm/candidaturas/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
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