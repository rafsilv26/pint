import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Award, Star, Sparkles, Calendar, Mail, ExternalLink, Network, Trophy, FileText, FileDown, ChevronRight, Download, Plus, X } from 'lucide-react'
import { Card, Spinner, ErrorState, EmptyState, StatusPill } from '../components/ui'
import ConsultorTimelineManager from '../components/ConsultorTimelineManager'
import { useAsync } from '../hooks/useAsync'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import * as api from '../services/api'
import { downloadTalentConsultantReport } from '../utils/talentConsultantReport'
import { useTranslation } from 'react-i18next'

export default function ManagerConsultorDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const talentView = location.pathname.startsWith('/tm')
  const serviceLineView = location.pathname.startsWith('/sll')
  const adminView = location.pathname.startsWith('/admin')
  const { data: c, loading, error, reload } = useAsync(() => talentView ? api.getTalentConsultant(id) : api.getConsultant(id), [id, talentView])
  const { data: historico, loading: loadingHistorico, reload: reloadHistorico } = useAsync(() => api.getConsultantCandidaturas(id), [id])
  const { data: premiumBadges } = useAsync(() => api.getBadgesPremium(), [])
  const [certificateId, setCertificateId] = useState(null)
  const [certificateError, setCertificateError] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [reportError, setReportError] = useState('')
  const [premiumSelecionado, setPremiumSelecionado] = useState('')
  const [premiumBusy, setPremiumBusy] = useState(false)
  const [premiumError, setPremiumError] = useState('')
  useAutoRefresh(() => { reload(); reloadHistorico() })

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('managerConsultor.naoEncontrado')}</p>

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
  const specialAchievements = c.specialAchievements || []
  const listaHistorico = historico || []

  const downloadCertificate = async (badgeId) => {
    setCertificateId(badgeId)
    setCertificateError('')
    try {
      await api.downloadManagerCertificate(c.id, badgeId)
    } catch (downloadError) {
      setCertificateError(downloadError.message)
    } finally {
      setCertificateId(null)
    }
  }

  const downloadCompleteReport = async () => {
    setReportBusy(true)
    setReportError('')
    try {
      const report = await api.getTalentConsultantReport(c.id)
      downloadTalentConsultantReport(report, {
        t,
        locale: i18n.resolvedLanguage || i18n.language || 'pt-PT',
      })
    } catch (downloadError) {
      setReportError(downloadError.message || t('managerConsultor.report.erroDownload'))
    } finally {
      setReportBusy(false)
    }
  }

  const jaAtribuidos = new Set(specialAchievements.map((item) => item.badgePremiumId))
  const premiumDisponiveis = (premiumBadges || []).filter((b) => !jaAtribuidos.has(b.id))

  const atribuirPremium = async () => {
    if (!premiumSelecionado) return
    setPremiumBusy(true)
    setPremiumError('')
    try {
      await api.atribuirBadgePremium(c.id, Number(premiumSelecionado))
      setPremiumSelecionado('')
      await reload()
    } catch (err) {
      setPremiumError(err.message || t('managerConsultor.premium.erro'))
    } finally {
      setPremiumBusy(false)
    }
  }

  const revogarPremium = async (badgePremiumId) => {
    setPremiumError('')
    try {
      await api.revogarBadgePremium(c.id, badgePremiumId)
      await reload()
    } catch (err) {
      setPremiumError(err.message || t('managerConsultor.premium.erro'))
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('managerConsultor.voltar')}
      </button>

      <Card className="p-0">
        <div className="rounded-top-4 bg-gradient-brand" style={{ height: '6rem' }} />
        <div className="px-4 pb-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle border border-4 border-white bg-brand-light fs-3 fw-bold text-brand flex-shrink-0" style={{ height: '5rem', width: '5rem', marginTop: '-2.25rem' }}>{iniciais}</div>
              <div className="pt-3 pb-1 min-w-0">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <h1 className="fs-4 fw-bold text-ink mb-0">{c.name}</h1>
                  {c.rank ? (
                    <span className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1 fs-xs fw-semibold" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <Trophy size={12} /> {t('managerConsultor.ranking', { posicao: c.rank })}
                    </span>
                  ) : null}
                </div>
                <p className="small text-muted mb-0">
                  {c.role || t('managerConsultor.defaultRole')}
                  {c.area ? ` · ${c.area}` : ''}
                  {c.serviceLine ? ` · ${c.serviceLine}` : ''}
                </p>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-3 pt-3 pb-1 small text-muted">
              {(talentView || serviceLineView) && (
                <button type="button" className="btn btn-brand d-inline-flex align-items-center gap-2" onClick={downloadCompleteReport} disabled={reportBusy}>
                  {reportBusy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <FileDown size={16} />}
                  {reportBusy ? t('managerConsultor.report.generating') : t('managerConsultor.report.download')}
                </button>
              )}
              {c.serviceLine && (
                <span className="d-flex align-items-center gap-1"><Network size={14} /> {c.serviceLine}</span>
              )}
              {c.linkedinUrl && (
                <a
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="d-flex align-items-center gap-1 text-brand text-decoration-none"
                >
                  <ExternalLink size={14} /> {t('managerConsultor.linkedin')}
                </a>
              )}
              {c.email && <p className="d-flex align-items-center gap-1 mb-0"><Mail size={14} /> {c.email}</p>}
            </div>
          </div>
        </div>
      </Card>
      {reportError && <div className="mt-3 alert alert-danger py-2 small" role="alert">{reportError}</div>}

      <div className="mt-4 row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
        {stats.map((s) => (
          <div className="col" key={s.label}>
            <Card className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-brand-light text-brand flex-shrink-0" style={{ height: '2.75rem', width: '2.75rem' }}><s.icon size={20} /></div>
              <div>
                <p className="fs-4 fw-bold text-ink mb-0">{s.value}</p>
                <p className="fs-xs text-muted mb-0">{s.label}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {c.biography && (
        <Card className="mt-4">
          <h2 className="mb-2 fw-semibold text-ink">{t('managerConsultor.sobre')}</h2>
          <p className="small text-muted" style={{ lineHeight: 1.6 }}>{c.biography}</p>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-3 fw-semibold text-ink">{t('managerConsultor.badgesConquistados.titulo')}</h2>
        {badgesConquistados.length === 0 ? (
          <EmptyState
            icon={Award}
            title={t('managerConsultor.badgesConquistados.vazioTitulo')}
            description={t('managerConsultor.badgesConquistados.vazioDesc')}
          />
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {badgesConquistados.map((b) => (
              <div className="col" key={`${b.id}-${b.obtidoEm}`}>
                <div className="d-flex align-items-center gap-3 rounded-3 border bg-white p-3">
                  <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 bg-brand-light small fw-bold text-brand" style={{ height: '2.75rem', width: '2.75rem' }}>
                    {(b.nome || 'B')[0]}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <p className="text-truncate small fw-semibold text-ink mb-0">{b.nome}</p>
                    <p className="fs-xs text-muted mb-0">
                      {t('managerConsultor.badgesConquistados.pontos', { pontos: b.pontos })}
                      {b.obtidoEm ? ` · ${new Date(b.obtidoEm).toLocaleDateString('pt-PT')}` : ''}
                    </p>
                    {!b.valido && (
                      <span className="mt-1 d-inline-block rounded-pill bg-light px-2 py-1 fw-medium text-secondary" style={{ fontSize: '0.625rem' }}>
                        {t('managerConsultor.badgesConquistados.expirado')}
                      </span>
                    )}
                    {b.expirationDate && <p className={`mt-1 fs-xs mb-0 ${b.expiration?.code === 'expired' ? 'text-danger' : b.expiration?.code === 'soon' ? 'text-warning-emphasis' : 'text-muted'}`}>{t('tmWorkspace.validityLabel')}: {new Date(b.expirationDate).toLocaleDateString()}</p>}
                    <button type="button" className="mt-2 btn btn-link p-0 d-inline-flex align-items-center gap-1 fs-xs fw-semibold text-brand text-decoration-none" onClick={() => downloadCertificate(b.id)} disabled={certificateId === b.id}><Download size={13} /> {certificateId === b.id ? t('exportButtons.processando') : t('tmWorkspace.certificate')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {certificateError && <div className="mt-3 alert alert-danger py-2 small" role="alert">{certificateError}</div>}

      {(talentView || serviceLineView || adminView) && <div className="mt-4 row g-4">
        <div className="col-lg-6">
          <Card className="h-100">
            <h2 className="mb-3 h6 fw-bold"><Sparkles size={17} className="me-2 text-warning" />{t('tmWorkspace.specialAchievements')}</h2>
            {specialAchievements.length === 0 ? (
              <p className="small text-muted mb-0">{t('tmWorkspace.noSpecialAchievements')}</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {specialAchievements.map((item) => (
                  <div key={`${item.badgePremiumId}-${item.achievementDate}`} className="rounded-3 border p-3 position-relative">
                    <button
                      type="button"
                      onClick={() => revogarPremium(item.badgePremiumId)}
                      className="btn btn-sm btn-link text-danger p-0 position-absolute top-0 end-0 m-2"
                      title={t('managerConsultor.premium.remover')}
                    >
                      <X size={15} />
                    </button>
                    <p className="small fw-bold mb-1 pe-3">{item.name}</p>
                    <p className="fs-xs text-muted mb-1">{item.description || item.criteriaDescription}</p>
                    <p className="fs-xs text-muted mb-0">{item.achievementDate ? new Date(item.achievementDate).toLocaleDateString() : '—'}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 border-top pt-3">
              <label className="fs-xs fw-semibold text-muted d-block mb-2">{t('managerConsultor.premium.atribuir')}</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  value={premiumSelecionado}
                  onChange={(e) => setPremiumSelecionado(e.target.value)}
                  disabled={premiumBusy || premiumDisponiveis.length === 0}
                >
                  <option value="">{premiumDisponiveis.length ? t('managerConsultor.premium.seleciona') : t('managerConsultor.premium.semDisponiveis')}</option>
                  {premiumDisponiveis.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={atribuirPremium}
                  disabled={!premiumSelecionado || premiumBusy}
                  className="btn btn-brand btn-sm d-inline-flex align-items-center gap-1 flex-shrink-0"
                >
                  <Plus size={15} /> {premiumBusy ? t('exportButtons.processando') : t('managerConsultor.premium.botao')}
                </button>
              </div>
              {premiumError && <div className="mt-2 text-danger fs-xs">{premiumError}</div>}
            </div>
          </Card>
        </div>
        {talentView && <div className="col-lg-6"><ConsultorTimelineManager consultorId={c.id} className="h-100" /></div>}
      </div>}

      <Card className="mt-4 overflow-hidden p-0">
        <h2 className="px-4 pt-4 fw-semibold text-ink">{t('managerConsultor.historico.titulo')}</h2>
        {loadingHistorico ? (
          <div className="p-4"><Spinner /></div>
        ) : listaHistorico.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title={t('managerConsultor.historico.vazioTitulo')}
              description={t('managerConsultor.historico.vazioDesc')}
            />
          </div>
        ) : (
          <div className="mt-3 table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-4 py-2">{t('managerConsultor.historico.tabela.trackingId')}</th>
                  <th className="px-4 py-2">{t('managerConsultor.historico.tabela.badge')}</th>
                  <th className="px-4 py-2">{t('managerConsultor.historico.tabela.nivel')}</th>
                  <th className="px-4 py-2">{t('managerConsultor.historico.tabela.data')}</th>
                  <th className="px-4 py-2">{t('managerConsultor.historico.tabela.estado')}</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {listaHistorico.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2 fw-medium text-ink">{h.trackingId}</td>
                    <td className="px-4 py-2 text-ink">{h.badge}</td>
                    <td className="px-4 py-2 text-muted">{h.nivel}</td>
                    <td className="px-4 py-2 text-muted">{h.data}</td>
                    <td className="px-4 py-2"><StatusPill status={h.status} /></td>
                    <td className="px-4 py-2 text-end">
                      <Link to={linkCandidatura(h.id)} className="d-inline-flex align-items-center gap-1 fs-xs fw-semibold text-brand text-decoration-none">
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
