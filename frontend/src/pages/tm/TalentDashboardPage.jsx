import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Award, ClipboardCheck, Layers, ArrowUpRight, AlertTriangle, FileBarChart, Route } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook
import { useAuth } from '../../context/useAuth'

const STAT_ICONS = [Users, Award, ClipboardCheck, Layers]
const TINTS = {
  sky: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  violet: { backgroundColor: '#ede9fe', color: '#7c3aed' },
  amber: { backgroundColor: '#fef3c7', color: '#d97706' },
  emerald: { backgroundColor: '#d1fae5', color: '#059669' },
}
const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// Quando usada em /admin (usarDadosAdmin), busca a mesma estrutura de dados mas
// com a "Atividade Recente" a vir do feed real e transversal da app (utilizadores,
// badges, candidaturas, avisos, políticas...) em vez de só candidaturas pendentes.
export default function TalentDashboardPage({ usarDadosAdmin = false }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { user } = useAuth()
  const [progressArea, setProgressArea] = useState('')
  const [progressServiceLine, setProgressServiceLine] = useState('')
  const { data, loading, error, reload } = useAsync(
    () => (usarDadosAdmin ? api.getAdminDashboard() : api.getTalentDashboard()),
    [usarDadosAdmin]
  )
  useAutoRefresh(reload, 30_000, !usarDadosAdmin)

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const maxBar = Math.max(1, ...(data.pedidosFechados.length ? data.pedidosFechados : [1]))
  const temDados = data.pedidosFechados.some((v) => v > 0)
  const totalSemana = data.pedidosFechados.reduce((soma, v) => soma + v, 0)
  const hour = new Date().getHours()
  const greetingKey = user?.greetingKind === 'welcome' ? 'welcome' : user?.greetingKind === 'welcomeBack' ? 'welcomeBack' : hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening'
  const progressRows = (data.progressoConsultores || []).filter((consultant) =>
    (!progressArea || consultant.area === progressArea) &&
    (!progressServiceLine || consultant.serviceLine === progressServiceLine)
  )

  // Rótulos dos dias a partir do ficheiro de idioma (Segunda-first).
  const diasSemana = t('talentDashboard.diasSemana', { returnObjects: true })
  // O gráfico é rolante (últimos 7 dias): a barra i corresponde à data
  // (hoje - (total-1-i)). Converte para o índice Segunda-first do array acima.
  const rotularDia = (i, total) => {
    const d = new Date()
    d.setDate(d.getDate() - (total - 1 - i))
    return diasSemana[(d.getDay() + 6) % 7] || ''
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div><p className="small text-muted mb-1">{t(`tmWorkspace.dashboard.greeting.${greetingKey}`)}, {user?.nome?.split(' ')[0] || ''}</p><h1 className="fs-2 fw-bold text-ink mb-0">{t('talentDashboard.titulo')}</h1></div>

      {/* Estatísticas */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
        {data.stats.map((s, i) => {
          const Icon = STAT_ICONS[i] || Award
          return (
            <div className="col" key={s.label}>
              <Card>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center justify-content-center rounded-3" style={{ height: '2.75rem', width: '2.75rem', ...(TINTS[s.tint] || TINTS.sky) }}>
                    <Icon size={20} />
                  </div>
                  {s.delta && (
                    <span className="d-flex align-items-center gap-1 fs-xs fw-semibold text-success">
                      <ArrowUpRight size={12} /> {s.delta}
                    </span>
                  )}
                </div>
                <p className="mt-3 mb-0 fs-3 fw-bold text-ink">{s.value}</p>
                <p className="mb-0 small text-muted">{s.label}</p>
              </Card>
            </div>
          )
        })}
      </div>

      <div className="row g-4 align-items-stretch">
        {/* Pontuação Global */}
        <div className="col-lg-6">
          <Card className="d-flex h-100 flex-column">
            <h2 className="mb-3 fw-semibold text-ink">{t('talentDashboard.pontuacaoGlobal')}</h2>
            <div className="d-grid gap-2 px-2 pb-2 fs-xs fw-medium text-muted" style={{ gridTemplateColumns: '2rem 1fr auto' }}>
              <span>{t('talentDashboard.tabela.posicao')}</span>
              <span>{t('talentDashboard.tabela.nome')}</span>
              <span>{t('talentDashboard.tabela.pontos')}</span>
            </div>
            <div className="flex-grow-1 d-flex flex-column gap-1">
              {data.pontuacaoGlobal.map((r) => (
                <div key={r.rank} className="d-grid align-items-center gap-2 rounded-3 px-2 py-2" style={{ gridTemplateColumns: '2rem 1fr auto' }}>
                  <span className="small fw-bold text-muted">{r.rank}</span>
                  <span className="d-flex align-items-center gap-2 small text-ink">
                    <span className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-semibold text-brand" style={{ height: '1.75rem', width: '1.75rem', fontSize: '0.625rem' }}>
                      {iniciais(r.nome)}
                    </span>
                    {r.nome}
                  </span>
                  <span className="small fw-semibold text-ink">{r.pontos}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Pedidos fechados + Atividade */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          <Card>
            <div className="mb-3 d-flex align-items-baseline justify-content-between">
              <h2 className="fw-semibold text-ink mb-0">{t('talentDashboard.pedidosFechados')}</h2>
              <span className="fs-xs text-muted">{t('talentDashboard.pedidosFechadosTotal', { count: totalSemana })}</span>
            </div>
            {!temDados ? (
              <p className="small text-muted mb-0">{t('talentDashboard.semDados')}</p>
            ) : (
              <div className="d-flex gap-2" style={{ height: '10rem' }}>
                {data.pedidosFechados.map((v, i) => (
                  <div key={i} className="d-flex flex-grow-1 flex-column align-items-center gap-1">
                    <span className="fw-semibold text-ink" style={{ fontSize: '0.6875rem' }}>{v}</span>
                    <div className="d-flex w-100 flex-grow-1 align-items-end">
                      <div
                        className="w-100 rounded-top bg-brand"
                        style={{ height: `${(v / maxBar) * 100}%`, minHeight: '2px' }}
                        title={String(v)}
                      />
                    </div>
                    <span className="text-secondary" style={{ fontSize: '0.625rem' }}>
                      {rotularDia(i, data.pedidosFechados.length)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('talentDashboard.atividadeRecente')}</h2>
            <div className="d-flex flex-column gap-3">
              {data.atividadeRecente.slice(0, 5).map((a, i) => (
                <div key={i} className="d-flex align-items-center gap-3">
                  <span className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-brand-light fs-xs fw-semibold text-brand" style={{ height: '2.25rem', width: '2.25rem' }}>
                    {iniciais(a.nome)}
                  </span>
                  <div>
                    <p className="small fw-medium text-ink mb-0">{a.nome}</p>
                    <p className="fs-xs text-muted mb-0">{a.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {!usarDadosAdmin && <div className="row g-4">
        <div className="col-xl-7">
          <Card className="h-100">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><h2 className="h6 fw-bold mb-0">{t('tmWorkspace.dashboard.consultantProgress')}</h2><Link to="/tm/consultores" className="small text-brand text-decoration-none">{t('tmWorkspace.common.verTodos')}</Link></div>
            <div className="row g-2 mb-3"><div className="col-sm-6"><select className="form-select form-select-sm" value={progressServiceLine} onChange={(event) => setProgressServiceLine(event.target.value)} aria-label={t('tmWorkspace.common.serviceLine')}><option value="">{t('tmWorkspace.common.todasServiceLines')}</option>{(data.progressServiceLines || []).map((value) => <option key={value}>{value}</option>)}</select></div><div className="col-sm-6"><select className="form-select form-select-sm" value={progressArea} onChange={(event) => setProgressArea(event.target.value)} aria-label={t('tmWorkspace.common.area')}><option value="">{t('tmWorkspace.common.todasAreas')}</option>{(data.progressAreas || []).map((value) => <option key={value}>{value}</option>)}</select></div></div>
            {progressRows.length === 0 ? <p className="small text-muted mb-0">{t('tmWorkspace.common.semDados')}</p> : <div className="d-flex flex-column gap-3">{progressRows.map((consultant) => <div key={consultant.id}><div className="d-flex align-items-center justify-content-between small mb-1"><Link to={`/tm/consultores/${consultant.id}`} className="fw-semibold text-ink text-decoration-none">{consultant.name}</Link><span className="text-muted">{consultant.pathCompleted}/{consultant.pathTotal} · {consultant.progress}%</span></div><div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${consultant.progress}%` }} /></div></div>)}</div>}
          </Card>
        </div>
        <div className="col-xl-5">
          <Card className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-3"><h2 className="h6 fw-bold mb-0">{t('tmWorkspace.dashboard.validity')}</h2><Link to="/tm/validades" className="small text-brand text-decoration-none">{t('tmWorkspace.common.verTodas')}</Link></div>
            {(data.expiracoes || []).length === 0 ? <p className="small text-muted mb-0">{t('tmWorkspace.dashboard.noExpirations')}</p> : <div className="d-flex flex-column gap-3">{data.expiracoes.map((award, index) => <div className="d-flex gap-2" key={`${award.consultantId}-${award.badgeId}-${index}`}><AlertTriangle size={17} className={award.expiration.code === 'expired' ? 'text-danger' : 'text-warning'} /><div><p className="small fw-semibold mb-0">{award.nome}</p><p className="fs-xs text-muted mb-0">{award.consultor} · {award.expirationDate ? new Date(award.expirationDate).toLocaleDateString() : '—'}</p></div></div>)}</div>}
          </Card>
        </div>
      </div>}

      {!usarDadosAdmin && <div className="d-flex flex-wrap gap-3">
        <Link to="/tm/candidaturas" className="btn btn-brand d-inline-flex align-items-center gap-2"><ClipboardCheck size={17} /> {t('tmWorkspace.dashboard.review')}</Link>
        <Link to="/tm/relatorios" className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2"><FileBarChart size={17} /> {t('tmWorkspace.dashboard.openReports')}</Link>
        <Link to="/tm/learning-paths" className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2"><Route size={17} /> {t('tmWorkspace.dashboard.learningPaths')}</Link>
      </div>}
    </div>
  )
}
