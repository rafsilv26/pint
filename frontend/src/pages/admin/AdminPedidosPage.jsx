import { FileText } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function AdminPedidosPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data, loading, error, reload } = useAsync(() => api.getAdminPedidos())
  const lista = data || []

  return (
    <div>
      <PageHeader 
        title={t('adminPedidos.titulo')} 
        subtitle={t('adminPedidos.subtitulo')}
        action={<ExportButtons />}
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><Spinner /></div>
        ) : error ? (
          <div className="p-6"><ErrorState onRetry={reload} /></div>
        ) : lista.length === 0 ? (
          <div className="p-6">
            <EmptyState 
              icon={FileText} 
              title={t('adminPedidos.vazioTitulo')} 
              description={t('adminPedidos.vazioDesc')} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.trackingId')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.consultor')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.badge')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.nivel')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.pontos')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.data')}</th>
                  <th className="px-4 py-3">{t('adminPedidos.tabela.estado')}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{c.trackingId}</td>
                    <td className="px-4 py-3 text-ink">{c.consultor}</td>
                    <td className="px-4 py-3 text-ink">{c.badge}</td>
                    <td className="px-4 py-3 text-muted">{c.nivel}</td>
                    <td className="px-4 py-3 text-muted">{c.pontos}</td>
                    <td className="px-4 py-3 text-muted">{c.data}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
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