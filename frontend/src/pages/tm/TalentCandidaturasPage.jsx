import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, Search, FileBarChart } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function TalentCandidaturasPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [tab, setTab] = useState('pendentes')
  const [pesquisa, setPesquisa] = useState('')
  const { data, loading, error, reload } = useAsync(() => api.getTalentCandidaturas(tab), [tab])
  useAutoRefresh(reload)
  const lista = (data || []).filter((row) => `${row.trackingId} ${row.consultor} ${row.badge} ${row.area || ''}`.toLowerCase().includes(pesquisa.toLowerCase()))

  // Declarar as tabs dentro do componente para poder traduzir com o t()
  const TABS = [
    { key: 'pendentes', label: t('talentCandidaturas.tabs.pendentes') },
    { key: 'validadas', label: t('talentCandidaturas.tabs.validadas') },
    { key: 'processo', label: t('tmWorkspace.applications.inProgress') },
    { key: 'aprovadas', label: t('tmWorkspace.applications.approved') },
    { key: 'rejeitadas', label: t('tmWorkspace.applications.rejected') },
    { key: 'todas', label: t('tmWorkspace.applications.all') },
  ]
  const exportRows = lista.map((row) => ({ trackingId: row.trackingId, consultor: row.consultor, badge: row.badge, nivel: row.nivel, area: row.area, data: row.data, estado: row.status?.name }))

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
        <div className="d-flex flex-wrap gap-2"><Link to="/tm/relatorios" className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2"><FileBarChart size={16} /> {t('tmWorkspace.applications.reports')}</Link><ExportButtons data={exportRows} filename={`talent-manager-candidaturas-${tab}`} columns={[{ key: 'trackingId', label: 'Tracking ID' }, { key: 'consultor', label: t('tmWorkspace.common.consultor') }, { key: 'badge', label: t('tmWorkspace.common.badge') }, { key: 'nivel', label: t('tmWorkspace.common.nivel') }, { key: 'area', label: t('tmWorkspace.common.area') }, { key: 'data', label: t('tmWorkspace.common.data') }, { key: 'estado', label: t('tmWorkspace.common.estado') }]} /></div>
      </div>
      <div className="position-relative mb-3" style={{ maxWidth: 420 }}><Search size={17} className="position-absolute text-muted" style={{ left: 13, top: 11 }} /><input className="form-control ps-5" value={pesquisa} onChange={(event) => setPesquisa(event.target.value)} placeholder={t('tmWorkspace.applications.search')} /></div>

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
                  <th className="px-3 py-2">{t('tmWorkspace.common.area')}</th>
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
                    <td className="px-3 py-2 text-muted">{c.area || '—'}</td>
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
