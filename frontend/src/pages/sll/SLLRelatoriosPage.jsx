import { FileBarChart, Users, Award, CheckCircle2 } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next'

// Página de Relatórios do Service Line Leader. Cobre os requisitos do guião
// para este perfil: "Gerar Relatórios de badges atribuídos na sua
// área/período" e exportação (Excel/PDF) dos pedidos, badges, consultores e
// aprovações da sua Service Line — todos os dados já vêm filtrados pelo
// backend à Service Line do SLL autenticado (Admin/TalentManager veem tudo).
export default function SLLRelatoriosPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => Promise.all([
    api.getServiceLinePedidos(),
    api.getConsultants(),
    api.listResource('badges'),
  ]))

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />

  const [pedidos, consultores, badges] = data || [[], [], []]
  const aprovacoes = pedidos.filter((p) => p.status?.code === 'APPROVED')
  const totalBadgesAtribuidos = consultores.reduce((s, c) => s + (c.badges || 0), 0)

  const resumo = [
    { label: t('sllRelatorios.resumo.badgesAtribuidos'), value: totalBadgesAtribuidos, icon: Award, tint: 'bg-violet-100 text-violet-600' },
    { label: t('sllRelatorios.resumo.totalPedidos'), value: pedidos.length, icon: FileBarChart, tint: 'bg-amber-100 text-amber-600' },
    { label: t('sllRelatorios.resumo.aprovacoes'), value: aprovacoes.length, icon: CheckCircle2, tint: 'bg-green-100 text-green-600' },
    { label: t('sllRelatorios.resumo.consultores'), value: consultores.length, icon: Users, tint: 'bg-sky-100 text-sky-600' },
  ]

  const pedidosColumns = [
    { key: 'trackingId', label: t('sllRelatorios.tabela.trackingId') },
    { key: 'badge', label: t('sllRelatorios.tabela.badge') },
    { key: 'consultor', label: t('sllRelatorios.tabela.consultor') },
    { key: 'data', label: t('sllRelatorios.tabela.data') },
    { key: 'nivel', label: t('sllRelatorios.tabela.nivel') },
    { key: 'pontos', label: t('sllRelatorios.tabela.pontos') },
    { key: 'estadoTexto', label: t('sllRelatorios.tabela.estado') },
  ]
  const pedidosData = pedidos.map((p) => ({ ...p, estadoTexto: p.status?.name || p.status?.code || '' }))

  const badgesColumns = [
    { key: 'nome', label: t('sllRelatorios.tabela.nome') },
    { key: 'tipo', label: t('sllRelatorios.tabela.tipo') },
    { key: 'fornecedor', label: t('sllRelatorios.tabela.fornecedor') },
    { key: 'ponto', label: t('sllRelatorios.tabela.pontos') },
  ]

  const consultoresColumns = [
    { key: 'name', label: t('sllRelatorios.tabela.nome') },
    { key: 'email', label: t('sllRelatorios.tabela.email') },
    { key: 'area', label: t('sllRelatorios.tabela.area') },
    { key: 'serviceLine', label: t('sllRelatorios.tabela.serviceLine') },
    { key: 'badges', label: t('sllRelatorios.tabela.badges') },
    { key: 'points', label: t('sllRelatorios.tabela.pontos') },
  ]

  const seccoes = [
    { key: 'pedidos', data: pedidosData, columns: pedidosColumns, filename: 'pedidos-service-line' },
    { key: 'badges', data: badges, columns: badgesColumns, filename: 'badges-service-line' },
    { key: 'consultores', data: consultores, columns: consultoresColumns, filename: 'consultores-service-line' },
    { key: 'aprovacoes', data: aprovacoes.map((p) => ({ ...p, estadoTexto: p.status?.name || p.status?.code || '' })), columns: pedidosColumns, filename: 'aprovacoes-service-line' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('sllRelatorios.titulo')}</h1>
        <p className="text-sm text-muted">{t('sllRelatorios.subtitulo')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
        {seccoes.map((s) => (
          <Card key={s.key} className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-ink">{t(`sllRelatorios.seccoes.${s.key}.titulo`)}</h2>
              <p className="mt-0.5 text-sm text-muted">{t(`sllRelatorios.seccoes.${s.key}.descricao`)}</p>
            </div>
            <ExportButtons data={s.data} columns={s.columns} filename={s.filename} />
          </Card>
        ))}
      </div>
    </div>
  )
}
