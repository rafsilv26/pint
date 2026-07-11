import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Star, Sparkles, Calendar, Mail, ArrowLeft } from 'lucide-react'
import { Card, Spinner, EmptyState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function PublicProfilePage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { user } = useAuth()
  const { data, loading } = useAsync(async () => {
    const [consultor, badges] = await Promise.all([
      api.getConsultant(user.id).catch(() => null),
      api.getMeusBadges().catch(() => []),
    ])
    return { consultor, badges }
  }, [user?.id])

  // Usar IDs para as tabs para a lógica não quebrar ao mudar o idioma
  const [tab, setTab] = useState('sobre')

  const TABS = [
    { id: 'sobre', label: t('perfilPublico.tabs.sobre') },
    { id: 'badges', label: t('perfilPublico.tabs.badges') },
    { id: 'conquistas', label: t('perfilPublico.tabs.conquistas') },
  ]

  const consultor = data?.consultor
  const badges = data?.badges || []

  const nome = consultor?.name || user?.nome || 'Consultor'
  const cargo = consultor?.role || user?.role || t('perfilPublico.defaultRole')
  const bio = consultor?.biography || t('perfilPublico.semBio')
  const iniciais = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const stats = [
    { icon: Award, label: t('perfilPublico.stats.badges'), value: consultor?.badges ?? badges.length },
    { icon: Star, label: t('perfilPublico.stats.pontos'), value: consultor?.points ?? 0 },
    { icon: Sparkles, label: t('perfilPublico.stats.conquistas'), value: consultor?.specials ?? 0 },
    { icon: Calendar, label: t('perfilPublico.stats.desde'), value: consultor?.startDate || '—' },
  ]

  return (
    <div>
      <Link to="/perfil" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('perfilPublico.voltar')}
      </Link>

      {/* Cabeçalho */}
      <Card className="p-0">
        <div className="rounded-top-4 bg-gradient-brand" style={{ height: '7rem' }} />
        <div className="px-4 pb-4">
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3" style={{ marginTop: '-2.5rem' }}>
            <div className="d-flex align-items-end gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle border border-4 border-white bg-brand-light fs-3 fw-bold text-brand" style={{ height: '5rem', width: '5rem' }}>
                {iniciais}
              </div>
              <div className="pb-1">
                <h1 className="fs-4 fw-bold text-ink mb-0">{nome}</h1>
                <p className="small text-muted mb-0">{cargo}</p>
              </div>
            </div>
            <p className="d-flex align-items-center gap-1 pb-1 small text-muted mb-0">
              <Mail size={14} /> {user?.email}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 row g-4">
        {/* Conteúdo */}
        <div className="col-lg-8">
          <div className="mb-3 d-flex gap-1 border-bottom">
            {TABS.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`btn btn-link rounded-0 border-bottom border-2 px-3 py-2 small fw-medium text-decoration-none ${
                  tab === tItem.id ? 'border-brand text-brand' : 'border-transparent text-muted'
                }`}
              >
                {tItem.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner />
          ) : tab === 'sobre' ? (
            <Card>
              <h2 className="fw-semibold text-ink">{nome}</h2>
              {(consultor?.area || consultor?.serviceLine) && (
                <div className="mt-1 d-flex flex-wrap gap-1">
                  {[consultor?.area, consultor?.serviceLine].filter(Boolean).map((tItem) => (
                    <span key={tItem} className="rounded-pill px-2 py-1 fs-xs fw-medium" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>{tItem}</span>
                  ))}
                </div>
              )}
              <p className="mt-3 small text-muted" style={{ lineHeight: 1.6 }}>{bio}</p>
            </Card>
          ) : tab === 'badges' ? (
            badges.length === 0 ? (
              <EmptyState icon={Award} title={t('perfilPublico.vazioBadgesTitulo')} description={t('perfilPublico.vazioBadgesDesc')} />
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 g-3">
                {badges.map((b) => (
                  <div className="col" key={b.badgeId}>
                    <Card className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 bg-brand-light text-brand flex-shrink-0" style={{ height: '3rem', width: '3rem' }}><Award size={22} /></div>
                      <div>
                        <p className="fw-semibold text-ink mb-0">{b.nome}</p>
                        <p className="fs-xs text-muted mb-0">{b.fornecedor} · {b.pontos} {t('perfilPublico.pts')}</p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )
          ) : (
            (consultor?.specials ?? 0) === 0 ? (
              <EmptyState icon={Sparkles} title={t('perfilPublico.vazioEspecialTitulo')} description={t('perfilPublico.vazioEspecialDesc')} />
            ) : (
              <Card className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ height: '3rem', width: '3rem', backgroundColor: '#ffedd5', color: '#ea580c' }}><Sparkles size={22} /></div>
                <p className="fw-semibold text-ink mb-0">{consultor.specials} {t('perfilPublico.conquistasCount')}</p>
              </Card>
            )
          )}
        </div>

        {/* Estatísticas */}
        <div className="col-lg-4 d-flex flex-column gap-2">
          {stats.map((s) => (
            <div key={s.label} className="d-flex align-items-center gap-3 rounded-3 bg-gradient-brand p-3 text-white">
              <div className="d-flex align-items-center justify-content-center rounded-2 bg-white bg-opacity-15 flex-shrink-0" style={{ height: '2.5rem', width: '2.5rem' }}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="fs-5 fw-bold mb-0">{loading ? '—' : s.value}</p>
                <p className="fs-xs text-white-50 mb-0">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
