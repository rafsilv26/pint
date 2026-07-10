import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Award, Star, Sparkles, Calendar, Mail, Linkedin, Network, Trophy, FileText, ChevronRight } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Perfil de um consultor visto por um perfil de gestão (TM / SLL / Admin).
export default function ManagerConsultorDetailPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: c, loading, error, reload } = useAsync(() => api.getConsultant(id), [id])
  const { data: historico, loading: loadingHistorico } = useAsync(() => api.getConsultantCandidaturas(id), [id])

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('managerConsultor.naoEncontrado')}</p>

  // A página é partilhada por /tm/consultores/:id e /sll/consultores/:id — a
  // ligação para o detalhe de uma candidatura tem de respeitar essa base.
  const linkCandidatura = (candidaturaId) =>
    location.pathname.startsWith('/sll') ? `/sll/pedidos/${candidaturaId}` : `/tm/candidaturas/${candidaturaId}`

  const iniciais = (c.name || 'C').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const stats = [
    { icon: Award, label: t('managerConsultor.stats.badges'), value: c.badges ?? 0 },
    { icon: Star, label: t('managerConsultor.stats.pontos'), value: c.points ?? 0 },
    { icon: Sparkles, label: t('managerConsultor.stats.conquistas'), value: c.specials ?? 0 },
    { icon: Calendar, label: t('managerConsultor.stats.desde'), value: c.startDate || '—' },
  ]
  const badgesConquistados = c.badgesConquistados || []
  const listaHistorico = historico || []

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('managerConsultor.voltar')}
      </button>

      <Card className="p-0">
        <div className="h-24 rounded-t-xl bg-gradient-to-r from-brand to-brand-accent" />
        <div className="px-6 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-brand-light text-2xl font-bold text-brand">{iniciais}</div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-ink">{c.name}</h1>
                  {c.rank ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <Trophy size={12} /> {t('managerConsultor.ranking', { posicao: c.rank })}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted">
                  {c.role || t('managerConsultor.defaultRole')}
                  {c.area ? ` · ${c.area}` : ''}
                  {c.serviceLine ? ` · ${c.serviceLine}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pb-1 text-sm text-muted">
              {c.serviceLine && (
                <span className="flex items-center gap-1"><Network size={14} /> {c.serviceLine}</span>
              )}
              {c.linkedinUrl && (
                <a
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-brand hover:underline"
                >
                  <Linkedin size={14} /> {t('managerConsultor.linkedin')}
                </a>
              )}
              {c.email && <p className="flex items-center gap-1"><Mail size={14} /> {c.email}</p>}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand"><s.icon size={20} /></div>
            <div>
              <p className="text-xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {c.biography && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold text-ink">{t('managerConsultor.sobre')}</h2>
          <p className="text-sm leading-relaxed text-muted">{c.biography}</p>
        </Card>
      )}

      {/* Badges Conquistados */}
      <Card className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">{t('managerConsultor.badgesConquistados.titulo')}</h2>
        {badgesConquistados.length === 0 ? (
          <EmptyState
            icon={Award}
            title={t('managerConsultor.badgesConquistados.vazioTitulo')}
            description={t('managerConsultor.badgesConquistados.vazioDesc')}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badgesConquistados.map((b) => (
              <div key={`${b.id}-${b.obtidoEm}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-light text-sm font-bold text-brand">
                  {(b.nome || 'B')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{b.nome}</p>
                  <p className="text-xs text-muted">
                    {t('managerConsultor.badgesConquistados.pontos', { pontos: b.pontos })}
                    {b.obtidoEm ? ` · ${new Date(b.obtidoEm).toLocaleDateString('pt-PT')}` : ''}
                  </p>
                  {!b.valido && (
                    <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {t('managerConsultor.badgesConquistados.expirado')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Histórico de Candidaturas */}
      <Card className="mt-6 overflow-hidden p-0">
        <h2 className="px-5 pt-5 font-semibold text-ink">{t('managerConsultor.historico.titulo')}</h2>
        {loadingHistorico ? (
          <div className="p-6"><Spinner /></div>
        ) : listaHistorico.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title={t('managerConsultor.historico.vazioTitulo')}
              description={t('managerConsultor.historico.vazioDesc')}
            />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-5 py-3">{t('managerConsultor.historico.tabela.trackingId')}</th>
                  <th className="px-5 py-3">{t('managerConsultor.historico.tabela.badge')}</th>
                  <th className="px-5 py-3">{t('managerConsultor.historico.tabela.nivel')}</th>
                  <th className="px-5 py-3">{t('managerConsultor.historico.tabela.data')}</th>
                  <th className="px-5 py-3">{t('managerConsultor.historico.tabela.estado')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {listaHistorico.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-ink">{h.trackingId}</td>
                    <td className="px-5 py-3 text-ink">{h.badge}</td>
                    <td className="px-5 py-3 text-muted">{h.nivel}</td>
                    <td className="px-5 py-3 text-muted">{h.data}</td>
                    <td className="px-5 py-3"><StatusPill status={h.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={linkCandidatura(h.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                        {t('managerConsultor.historico.ver')} <ChevronRight size={14} />
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
