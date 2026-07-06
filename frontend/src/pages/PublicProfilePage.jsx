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
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('perfilPublico.voltar')}
      </Link>

      {/* Cabeçalho */}
      <Card className="p-0">
        <div className="h-28 rounded-t-xl bg-gradient-to-r from-brand to-brand-accent" />
        <div className="px-6 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-brand-light text-2xl font-bold text-brand">
                {iniciais}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-ink">{nome}</h1>
                <p className="text-sm text-muted">{cargo}</p>
              </div>
            </div>
            <p className="flex items-center gap-1 pb-1 text-sm text-muted">
              <Mail size={14} /> {user?.email}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Conteúdo */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            {TABS.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                  tab === tItem.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
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
              <h2 className="font-semibold text-ink">{nome}</h2>
              {(consultor?.area || consultor?.serviceLine) && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[consultor?.area, consultor?.serviceLine].filter(Boolean).map((tItem) => (
                    <span key={tItem} className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-600">{tItem}</span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted">{bio}</p>
            </Card>
          ) : tab === 'badges' ? (
            badges.length === 0 ? (
              <EmptyState icon={Award} title={t('perfilPublico.vazioBadgesTitulo')} description={t('perfilPublico.vazioBadgesDesc')} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {badges.map((b) => (
                  <Card key={b.badgeId} className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand"><Award size={22} /></div>
                    <div>
                      <p className="font-semibold text-ink">{b.nome}</p>
                      <p className="text-xs text-muted">{b.fornecedor} · {b.pontos} {t('perfilPublico.pts')}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            (consultor?.specials ?? 0) === 0 ? (
              <EmptyState icon={Sparkles} title={t('perfilPublico.vazioEspecialTitulo')} description={t('perfilPublico.vazioEspecialDesc')} />
            ) : (
              <Card className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600"><Sparkles size={22} /></div>
                <p className="font-semibold text-ink">{consultor.specials} {t('perfilPublico.conquistasCount')}</p>
              </Card>
            )
          )}
        </div>

        {/* Estatísticas */}
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand to-brand-accent p-4 text-white">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-lg font-bold">{loading ? '—' : s.value}</p>
                <p className="text-xs text-white/80">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}