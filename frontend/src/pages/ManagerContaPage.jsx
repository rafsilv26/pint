import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Award, BookOpen, Clock3, Globe2, KeyRound, LogOut, Network, PenLine, Users } from 'lucide-react'
import { PageHeader, Card, Field, Button, Spinner } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

// Definições de conta dos perfis de gestão (Admin / TM / SLL).
export default function ManagerContaPage() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isTalentManager = location.pathname.startsWith('/tm')
  const isServiceLineLeader = location.pathname.startsWith('/sll')
  const [pw, setPw] = useState({ atual: '', nova: '', confirmar: '' })
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)
  const [saving, setSaving] = useState(false)
  const {
    data: serviceLineProfile,
    loading: loadingServiceLine,
    error: serviceLineError,
    reload: reloadServiceLine,
  } = useAsync(
    () => isServiceLineLeader ? api.getServiceLineProfile() : Promise.resolve(null),
    [isServiceLineLeader],
  )

  useAutoRefresh(reloadServiceLine, 30_000, isServiceLineLeader)

  const iniciais = (user?.nome || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const roles = (user?.roles || [user?.role]).filter(Boolean)
  const roleLabel = roles.map((role) => t(`managerConta.roles.${role}`, { defaultValue: role })).join(', ')
  const serviceLineStats = serviceLineProfile ? [
    { key: 'consultants', icon: Users, value: serviceLineProfile.stats.consultants },
    { key: 'availableBadges', icon: Award, value: serviceLineProfile.stats.availableBadges },
    { key: 'pendingApprovals', icon: Clock3, value: serviceLineProfile.stats.pendingApprovals },
    { key: 'awardedBadges', icon: Award, value: serviceLineProfile.stats.awardedBadges },
  ] : []

  async function alterar(e) {
    e.preventDefault()
    setErro(null)
    setMsg(null)

    // Validações traduzidas
    if (pw.nova.length < 8) return setErro(t('managerConta.erroComprimento'))
    if (pw.nova !== pw.confirmar) return setErro(t('managerConta.erroCoincidem'))
    if (pw.atual === pw.nova) return setErro(t('managerConta.erroDiferente'))

    setSaving(true)
    try {
      const response = await api.changePassword({ currentPassword: pw.atual, newPassword: pw.nova })
      setMsg(response?.message || response?.mensagem || t('managerConta.sucessoMsg'))
      setPw({ atual: '', nova: '', confirmar: '' })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '56rem' }}>
      <PageHeader
        title={t('managerConta.titulo')}
        subtitle={t('managerConta.subtitulo')}
      />

      <Card className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fs-5 fw-bold text-brand flex-shrink-0" style={{ height: '4rem', width: '4rem' }}>{iniciais}</div>
        <div className="min-w-0">
          <p className="fs-5 fw-semibold text-ink mb-0">{user?.nome}</p>
          <p className="small text-muted mb-0 text-break">{user?.email}</p>
          <p className="mt-1 fs-xs fw-medium text-brand mb-0">{roleLabel}</p>
          {isServiceLineLeader && serviceLineProfile?.serviceLine?.nome && (
            <p className="small text-muted mt-1 mb-0 d-flex align-items-center gap-1">
              <Network size={14} aria-hidden="true" />
              {serviceLineProfile.serviceLine.nome}
            </p>
          )}
        </div>
      </Card>

      {isServiceLineLeader && (
        <Card className="mt-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="small fw-semibold text-brand text-uppercase mb-1">{t('managerConta.serviceLine.eyebrow')}</p>
              <h2 className="h4 fw-bold text-ink mb-1 d-flex align-items-center gap-2">
                <Network size={22} className="text-brand" aria-hidden="true" />
                {serviceLineProfile?.serviceLine?.nome || t('managerConta.serviceLine.notAssigned')}
              </h2>
              <p className="small text-muted mb-0">{t('managerConta.serviceLine.subtitle')}</p>
            </div>
          </div>

          {loadingServiceLine && !serviceLineProfile && <Spinner label={t('managerConta.serviceLine.loading')} />}

          {serviceLineError && !serviceLineProfile && (
            <div className="alert alert-danger mt-4 mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
              <span>{serviceLineError}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={reloadServiceLine}>{t('ui.error.retry')}</button>
            </div>
          )}

          {serviceLineProfile && (
            <>
              {serviceLineProfile.serviceLine?.descricao && (
                <p className="mt-3 mb-0 text-muted">{serviceLineProfile.serviceLine.descricao}</p>
              )}

              <div className="mt-4 row g-3">
                <div className="col-12 col-md-5">
                  <p className="small text-muted mb-1 d-flex align-items-center gap-2">
                    <BookOpen size={16} aria-hidden="true" />
                    {t('managerConta.serviceLine.learningPath')}
                  </p>
                  <p className="fw-semibold text-ink mb-0">{serviceLineProfile.learningPath?.nome || t('managerConta.serviceLine.notAvailable')}</p>
                </div>
                <div className="col-12 col-md-7">
                  <p className="small text-muted mb-2">{t('managerConta.serviceLine.areas')}</p>
                  <div className="d-flex flex-wrap gap-2">
                    {serviceLineProfile.areas.length > 0
                      ? serviceLineProfile.areas.map((area) => <span key={area.id} className="badge rounded-pill bg-brand-light text-brand px-3 py-2">{area.nome}</span>)
                      : <span className="small text-muted">{t('managerConta.serviceLine.emptyAreas')}</span>}
                  </div>
                </div>
              </div>

              <div className="row g-3 mt-2 pt-3 border-top">
                {serviceLineStats.map(({ key, icon: Icon, value }) => (
                  <div className="col-6 col-md-3" key={key}>
                    <div className="d-flex align-items-center gap-2 mb-1 text-brand">
                      <Icon size={17} aria-hidden="true" />
                      <span className="h4 fw-bold mb-0">{value}</span>
                    </div>
                    <p className="small text-muted mb-0">{t(`managerConta.serviceLine.stats.${key}`)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-3 d-flex align-items-center gap-2 fw-semibold text-ink"><Globe2 size={18} className="text-brand" />{t('managerConta.idioma')}</h2>
        <div className="btn-group w-100" role="group" aria-label={t('managerConta.idioma')}>
          {[['pt', 'Português'], ['en', 'English'], ['es', 'Español']].map(([code, label]) => <button key={code} type="button" onClick={() => i18n.changeLanguage(code)} className={`btn ${i18n.language.startsWith(code) ? 'btn-brand' : 'btn-outline-secondary'}`}>{label}</button>)}
        </div>
        {(isTalentManager || isServiceLineLeader) && <Link to={isTalentManager ? '/tm/assinatura' : '/sll/assinatura'} className="mt-3 btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"><PenLine size={16} />{t('tmWorkspace.signature.emailSignature')}</Link>}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 d-flex align-items-center gap-2 fw-semibold text-ink">
          <KeyRound size={18} className="text-brand" /> {t('managerConta.alterarPassword')}
        </h2>
        <form onSubmit={alterar} className="d-flex flex-column gap-3">
          {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}
          {msg && <div className="rounded-3 bg-success-subtle px-3 py-2 small text-success">{msg}</div>}

          <Field
            label={t('managerConta.labels.atual')}
            type="password"
            value={pw.atual}
            onChange={(e) => setPw({ ...pw, atual: e.target.value })}
            required
          />
          <Field
            label={t('managerConta.labels.nova')}
            type="password"
            value={pw.nova}
            onChange={(e) => setPw({ ...pw, nova: e.target.value })}
            hint={t('managerConta.labels.dicaMinimo')}
            required
          />
          <Field
            label={t('managerConta.labels.confirmar')}
            type="password"
            value={pw.confirmar}
            onChange={(e) => setPw({ ...pw, confirmar: e.target.value })}
            required
          />

          <Button type="submit" disabled={saving}>
            {saving ? t('managerConta.botoes.guardando') : t('managerConta.botoes.alterar')}
          </Button>
        </form>
      </Card>

      <button
        onClick={() => { if (window.confirm(t('managerConta.confirmarLogout'))) { logout(); navigate('/login') } }}
        className="mt-4 btn btn-outline-danger bg-white w-100 d-flex align-items-center justify-content-center gap-2"
      >
        <LogOut size={16} /> {t('managerConta.botoes.terminarSessao')}
      </button>
    </div>
  )
}
