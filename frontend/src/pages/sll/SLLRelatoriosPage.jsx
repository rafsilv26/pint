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
    { label: t('sllRelatorios.resumo.badgesAtribuidos'), value: totalBadgesAtribuidos, icon: Award, tint: { backgroundColor: '#ede9fe', color: '#7c3aed' } },
    { label: t('sllRelatorios.resumo.totalPedidos'), value: pedidos.length, icon: FileBarChart, tint: { backgroundColor: '#fef3c7', color: '#d97706' } },
    { label: t('sllRelatorios.resumo.aprovacoes'), value: aprovacoes.length, icon: CheckCircle2, tint: { backgroundColor: '#dcfce7', color: '#16a34a' } },
    { label: t('sllRelatorios.resumo.consultores'), value: consultores.length, icon: Users, tint: { backgroundColor: '#e0f2fe', color: '#0284c7' } },
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
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="fs-2 fw-bold text-ink">{t('sllRelatorios.titulo')}</h1>
        <p className="small text-muted">{t('sllRelatorios.subtitulo')}</p>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
        {resumo.map((r) => (
          <div className="col" key={r.label}>
            <Card className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ height: '3rem', width: '3rem', ...r.tint }}><r.icon size={22} /></div>
              <div>
                <p className="fs-3 fw-bold text-ink mb-0">{r.value}</p>
                <p className="small text-muted mb-0">{r.label}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="row row-cols-1 row-cols-sm-2 g-3">
        {seccoes.map((s) => (
          <div className="col" key={s.key}>
            <Card className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <h2 className="fw-semibold text-ink mb-0">{t(`sllRelatorios.seccoes.${s.key}.titulo`)}</h2>
                <p className="mt-1 small text-muted mb-0">{t(`sllRelatorios.seccoes.${s.key}.descricao`)}</p>
              </div>
              <ExportButtons data={s.data} columns={s.columns} filename={s.filename} />
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
