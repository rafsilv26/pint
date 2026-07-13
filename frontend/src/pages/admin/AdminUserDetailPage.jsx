import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Shield, MapPin, Network, Calendar, KeyRound, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

const iniciais = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function AdminUserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data, loading, error, reload } = useAsync(async () => {
    const [users, areas, serviceLines] = await Promise.all([
      api.getUsers(),
      api.listResource('areas').catch(() => []),
      api.listResource('service-lines').catch(() => []),
    ])
    const user = (users || []).find((u) => String(u.id) === String(id)) || null
    return { user, areas: areas || [], serviceLines: serviceLines || [] }
  }, [id])

  const ROLE_LABELS = {
    Consultor: t('adminUsers.roles.consultor'),
    TalentManager: t('adminUsers.roles.talentManager'),
    ServiceLineLeader: t('adminUsers.roles.serviceLineLeader'),
    Admin: t('adminUsers.roles.admin'),
  }
  const roleLabel = (r) => ROLE_LABELS[r] || r

  const voltar = (
    <Link to="/admin/utilizadores" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
      <ArrowLeft size={16} /> {t('adminUserDetail.voltar')}
    </Link>
  )

  if (loading) return <Spinner />
  if (error) return <div>{voltar}<ErrorState onRetry={reload} /></div>

  const u = data?.user
  if (!u) return <div>{voltar}<p className="mt-3 text-muted">{t('adminUserDetail.naoEncontrado')}</p></div>

  const areaNome = data.areas.find((a) => Number(a.id) === Number(u.areaId))?.nome
  const slNome = data.serviceLines.find((s) => Number(s.id) === Number(u.serviceLineId))?.nome
  const isConsultor = (u.roles || []).includes('Consultor')

  const factos = [
    { icon: Shield, label: t('adminUserDetail.papel'), value: (u.roles || []).map(roleLabel).join(', ') || '—' },
    { icon: MapPin, label: t('adminUserDetail.area'), value: areaNome, only: isConsultor },
    { icon: Network, label: t('adminUserDetail.serviceLine'), value: slNome },
    { icon: Calendar, label: t('adminUserDetail.registado'), value: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : null },
  ].filter((f) => f.only !== false && f.value)

  return (
    <div>
      {voltar}
      <PageHeader title={u.nome} subtitle={t('adminUserDetail.subtitulo')} />

      <Card>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fs-3 fw-bold text-brand flex-shrink-0" style={{ height: '4.5rem', width: '4.5rem' }}>
            {iniciais(u.nome)}
          </div>
          <div className="min-w-0">
            <p className="fs-5 fw-bold text-ink mb-0">{u.nome}</p>
            <a href={`mailto:${u.email}`} className="d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
              <Mail size={13} /> {u.email}
            </a>
            <div className="mt-2 d-flex flex-wrap gap-1">
              {(u.roles || []).map((r) => (
                <span key={r} className="rounded-pill bg-brand-light text-brand px-2 py-1 fs-xs fw-medium">{roleLabel(r)}</span>
              ))}
              <span className={`rounded-pill px-2 py-1 fs-xs fw-medium ${u.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {u.ativo ? t('adminUsers.estado.ativo') : t('adminUsers.estado.inativo')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top row row-cols-1 row-cols-sm-2 g-3">
          {factos.map((f) => (
            <div key={f.label} className="col d-flex align-items-center gap-2">
              <f.icon size={16} className="text-brand flex-shrink-0" />
              <div className="min-w-0">
                <p className="fs-xs text-muted mb-0">{f.label}</p>
                <p className="fw-medium text-ink mb-0">{f.value}</p>
              </div>
            </div>
          ))}
          <div className="col d-flex align-items-center gap-2">
            <KeyRound size={16} className="text-brand flex-shrink-0" />
            <div className="min-w-0">
              <p className="fs-xs text-muted mb-0">{t('adminUserDetail.primeiroAcesso')}</p>
              <p className="fw-medium text-ink mb-0 d-flex align-items-center gap-1">
                {u.mustChangePassword
                  ? <><XCircle size={14} className="text-warning" /> {t('adminUserDetail.pendente')}</>
                  : <><CheckCircle2 size={14} className="text-success" /> {t('adminUserDetail.feito')}</>}
              </p>
            </div>
          </div>
        </div>

        {isConsultor && (
          <div className="mt-4 pt-3 border-top">
            <Link to={`/admin/consultor/${u.id}`} className="btn btn-outline-secondary bg-white btn-sm">
              {t('adminUserDetail.verPerfilPublico')}
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
