import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next'

export default function AdminPedidosPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getAdminPedidos())
  const lista = data || []

  const exportColumns = [
    { key: 'trackingId', label: t('adminPedidos.tabela.trackingId') },
    { key: 'consultor', label: t('adminPedidos.tabela.consultor') },
    { key: 'badge', label: t('adminPedidos.tabela.badge') },
    { key: 'nivel', label: t('adminPedidos.tabela.nivel') },
    { key: 'pontos', label: t('adminPedidos.tabela.pontos') },
    { key: 'data', label: t('adminPedidos.tabela.data') },
    { key: 'estadoTexto', label: t('adminPedidos.tabela.estado') },
  ]
  const exportData = lista.map((c) => ({ ...c, estadoTexto: c.status?.name || c.status?.code || '' }))

  return (
    <div>
      <PageHeader
        title={t('adminPedidos.titulo')}
        subtitle={t('adminPedidos.subtitulo')}
        action={<ExportButtons data={exportData} columns={exportColumns} filename="pedidos-badges" />}
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title={t('adminPedidos.vazioTitulo')}
              description={t('adminPedidos.vazioDesc')}
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-3 py-2">{t('adminPedidos.tabela.trackingId')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.consultor')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.badge')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.nivel')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.pontos')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.data')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.sla')}</th>
                  <th className="px-3 py-2">{t('adminPedidos.tabela.estado')}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 fw-medium">
                      <Link to={`/admin/pedidos/${c.id}`} className="text-brand text-decoration-none">{c.trackingId}</Link>
                    </td>
                    <td className="px-3 py-2 text-ink">{c.consultor}</td>
                    <td className="px-3 py-2 text-ink">{c.badge}</td>
                    <td className="px-3 py-2 text-muted">{c.nivel}</td>
                    <td className="px-3 py-2 text-muted">{c.pontos}</td>
                    <td className="px-3 py-2">
                      {c.slaExcedido
                        ? <span className="badge rounded-pill text-bg-danger">{t('adminPedidos.slaExcedido')}</span>
                        : <span className="text-muted">{c.slaLimite || '—'}</span>}
                    </td>
                    <td className="px-3 py-2"><StatusPill status={c.status} /></td>
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
