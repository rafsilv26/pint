import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function SLLPedidosPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => api.getServiceLinePedidos())
  const lista = data || []
  const cont = (code) => lista.filter((c) => c.status.code === code).length

  // Agora que o resumo está dentro do componente, podemos usar o t() para traduzir as labels
  const resumo = [
    { label: t('sllPedidos.resumo.pendentes'), value: cont('VALIDATED'), icon: Clock, tint: 'bg-amber-100 text-amber-600' },
    { label: t('sllPedidos.resumo.aprovados'), value: cont('APPROVED'), icon: CheckCircle2, tint: 'bg-green-100 text-green-600' },
    { label: t('sllPedidos.resumo.rejeitados'), value: cont('REJECTED'), icon: XCircle, tint: 'bg-red-100 text-red-600' },
  ]

  const exportColumns = [
    { key: 'trackingId', label: t('sllPedidos.tabela.trackingId') },
    { key: 'badge', label: t('sllPedidos.tabela.badge') },
    { key: 'consultor', label: t('sllPedidos.tabela.consultor') },
    { key: 'data', label: t('sllPedidos.tabela.data') },
    { key: 'nivel', label: t('sllPedidos.tabela.nivel') },
    { key: 'pontos', label: t('sllPedidos.tabela.pontos') },
    { key: 'estadoTexto', label: t('sllPedidos.tabela.estado') },
  ]
  const exportData = lista.map((c) => ({ ...c, estadoTexto: c.status?.name || c.status?.code || '' }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{t('sllPedidos.titulo')}</h1>
        <ExportButtons data={exportData} columns={exportColumns} filename="pedidos-service-line" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {resumo.map((r) => (
          <Card key={r.label} className="flex items-center gap-4">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${r.tint}`}><r.icon size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-ink">{r.value}</p>
              <p className="text-sm text-muted">{r.label}</p>
            </div>
          </Card>
        ))}
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
              title={t('sllPedidos.empty.titulo')} 
              description={t('sllPedidos.empty.descricao')} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.trackingId')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.badge')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.consultor')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.data')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.nivel')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.pontos')}</th>
                  <th className="px-4 py-3">{t('sllPedidos.tabela.estado')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/sll/pedidos/${c.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-ink">{c.trackingId}</td>
                    <td className="px-4 py-3 text-ink">{c.badge}</td>
                    <td className="px-4 py-3 text-ink">{c.consultor}</td>
                    <td className="px-4 py-3 text-muted">{c.data}</td>
                    <td className="px-4 py-3 text-muted">{c.nivel}</td>
                    <td className="px-4 py-3 text-muted">{c.pontos}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-right text-brand"><ChevronRight size={16} /></td>
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