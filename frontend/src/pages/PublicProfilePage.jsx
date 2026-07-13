import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award, Star, Sparkles, Calendar, Mail, ArrowLeft,
  Trophy, CheckCircle2, XCircle, User as UserIcon,
} from 'lucide-react'
import { Card, Spinner, EmptyState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/useAuth'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// lucide-react não inclui logótipos de marcas (removidos por questões de
// trademark) — ícone do LinkedIn inline, mesma convenção de tamanho/cor
// (currentColor) dos ícones lucide usados no resto da página.
function LinkedinGlyph({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// Cores das 3 primeiras posições do ranking (ouro/prata/bronze) — únicas
// exceções à palete da marca, por representarem uma convenção universal de
// pódio, tal como o azul do LinkedIn abaixo representa a marca do LinkedIn.
const MEDALHAS = {
  1: { bg: '#fef3c7', fg: '#b45309' },
  2: { bg: '#f1f5f9', fg: '#475569' },
  3: { bg: '#fde2c8', fg: '#9a3412' },
}

// Tint determinístico (mesmo badge -> mesma cor sempre) reaproveitando as
// classes tint-* já usadas na grelha de badges do catálogo.
const TINTS = ['tint-sky-soft', 'tint-emerald-soft', 'tint-violet-soft', 'tint-salmon-soft']
const tintDoBadge = (id) => TINTS[Number(id) % TINTS.length]

export default function PublicProfilePage() {
  const { t, i18n } = useTranslation() // <-- Inicializa a tradução
  const { user } = useAuth()
  const { id } = useParams()
  // Sem :id -> o meu próprio perfil. Com :id -> perfil de outro consultor
  // (a partir do diretório).
  const targetId = id ? Number(id) : user?.id
  const isSelf = !id || Number(id) === user?.id

  const { data, loading } = useAsync(async () => {
    const consultor = await api.getConsultant(targetId).catch(() => null)
    // Os meus badges vêm do endpoint próprio; os de outro consultor vêm já
    // incluídos no perfil dele (badgesConquistados).
    const badges = isSelf
      ? await api.getMeusBadges().catch(() => [])
      : (consultor?.badgesConquistados || []).map((b) => ({
          badgeId: b.id,
          nome: b.nome,
          fornecedor: b.fornecedor || '',
          pontos: b.pontos ?? 0,
          obtainedDate: b.obtidoEm,
          valid: b.valido !== false,
          imagem: b.imagem || null,
        }))
    return { consultor, badges }
  }, [targetId, isSelf])

  // Usar IDs para as tabs para a lógica não quebrar ao mudar o idioma
  const [tab, setTab] = useState('sobre')

  const TABS = [
    { id: 'sobre', label: t('perfilPublico.tabs.sobre'), icon: UserIcon },
    { id: 'badges', label: t('perfilPublico.tabs.badges'), icon: Award },
    { id: 'conquistas', label: t('perfilPublico.tabs.conquistas'), icon: Sparkles },
  ]

  const localeMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES' }
  const currentLocale = localeMap[i18n.language?.substring(0, 2)] || 'pt-PT'
  const formatarData = (d) => (d ? new Date(d).toLocaleDateString(currentLocale) : '—')

  const consultor = data?.consultor
  const badges = data?.badges || []

  const nome = consultor?.name || (isSelf ? user?.nome : '') || 'Consultor'
  const email = isSelf ? user?.email : consultor?.email
  const cargo = consultor?.role || user?.role || t('perfilPublico.defaultRole')
  const bio = consultor?.biography || t('perfilPublico.semBio')
  const iniciais = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const rank = consultor?.rank
  const medalha = MEDALHAS[rank]

  const factos = [
    { label: t('perfilPublico.areaLabel'), value: consultor?.area },
    { label: t('perfilPublico.serviceLineLabel'), value: consultor?.serviceLine },
    { label: t('perfilPublico.stats.desde'), value: consultor?.startDate },
    { label: t('perfilPublico.rankingLabel'), value: rank ? `#${rank}` : null },
  ].filter((f) => f.value)

  return (
    <div>
      <Link to={isSelf ? '/perfil' : '/consultores'} className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {isSelf ? t('perfilPublico.voltar') : t('perfilPublico.voltarDiretorio')}
      </Link>

      {/* Cabeçalho — cartão de credencial centrado */}
      <Card className="p-0 overflow-hidden">
        <div className="bg-gradient-brand" style={{ height: '7rem' }} />
        <div className="px-4 pb-4 text-center">
          {/* Avatar centrado, sobreposto à faixa */}
          <div className="position-relative mx-auto" style={{ height: '6.5rem', width: '6.5rem', marginTop: '-3.5rem' }}>
            <div
              className="rounded-circle h-100 w-100 p-1 shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--bs-primary), #3f93cf)' }}
            >
              <div className="rounded-circle h-100 w-100 d-flex align-items-center justify-content-center bg-white overflow-hidden">
                {consultor?.imagePath ? (
                  <img src={consultor.imagePath} alt="" className="w-100 h-100 object-fit-cover" />
                ) : (
                  <span className="fs-2 fw-bold text-brand">{iniciais}</span>
                )}
              </div>
            </div>
            {medalha && (
              <span
                className="position-absolute d-flex align-items-center justify-content-center rounded-circle border border-2 border-white shadow-sm"
                style={{ height: '2rem', width: '2rem', bottom: '-0.2rem', right: '-0.2rem', backgroundColor: medalha.bg }}
                title={`${t('perfilPublico.rankingLabel')}: #${rank}`}
              >
                <Trophy size={14} style={{ color: medalha.fg }} />
              </span>
            )}
          </div>

          <h1 className="mt-3 fs-4 fw-bold text-ink mb-0">{nome}</h1>
          <p className="small text-muted mb-0">{cargo}</p>

          {(consultor?.area || consultor?.serviceLine) && (
            <div className="mt-2 d-flex flex-wrap justify-content-center gap-1">
              {[consultor?.area, consultor?.serviceLine].filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-pill bg-brand-light text-brand px-2 py-1 fs-xs fw-medium">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-3 d-flex flex-wrap justify-content-center gap-2">
            {email && (
              <a href={`mailto:${email}`} className="d-inline-flex align-items-center gap-1 rounded-pill border px-3 py-1 fs-xs fw-medium text-muted text-decoration-none">
                <Mail size={13} /> {email}
              </a>
            )}
            {consultor?.linkedinUrl && (
              <a
                href={consultor.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="d-inline-flex align-items-center gap-1 rounded-pill border px-3 py-1 fs-xs fw-medium text-decoration-none"
                style={{ borderColor: '#0a66c2', color: '#0a66c2' }}
              >
                <LinkedinGlyph size={13} /> LinkedIn
              </a>
            )}
          </div>

          {/* Faixa de estatísticas */}
          <div className="mt-4 pt-3 border-top row row-cols-3 g-0 text-center">
            {[
              { label: t('perfilPublico.stats.pontos'), value: consultor?.points ?? 0 },
              { label: t('perfilPublico.stats.badges'), value: consultor?.badges ?? badges.length },
              { label: t('perfilPublico.stats.conquistas'), value: consultor?.specials ?? 0 },
            ].map((s) => (
              <div className="col" key={s.label}>
                <p className="fs-4 fw-bold text-ink mb-0">{loading ? '—' : s.value}</p>
                <p className="fs-xs text-muted mb-0">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <div>
          <div className="mb-3 d-flex gap-1 border-bottom">
            {TABS.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`btn btn-link d-inline-flex align-items-center gap-2 rounded-0 border-bottom border-2 px-3 py-2 small fw-medium text-decoration-none ${
                  tab === tItem.id ? 'border-brand text-brand' : 'border-transparent text-muted'
                }`}
              >
                <tItem.icon size={15} /> {tItem.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner />
          ) : tab === 'sobre' ? (
            <Card>
              <h2 className="fs-6 fw-semibold text-uppercase text-muted mb-0" style={{ letterSpacing: '0.03em' }}>
                {t('perfilPublico.tabs.sobre')}
              </h2>
              <p className="mt-3 mb-0 text-muted border-start border-3 border-brand ps-3" style={{ lineHeight: 1.7 }}>{bio}</p>

              {factos.length > 0 && (
                <div className="mt-4 pt-3 border-top row row-cols-1 row-cols-sm-2 g-3">
                  {factos.map((f) => (
                    <div key={f.label} className="col">
                      <p className="fs-xs text-muted text-uppercase fw-semibold mb-1" style={{ letterSpacing: '0.03em' }}>{f.label}</p>
                      <p className="fw-medium text-ink mb-0">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : tab === 'badges' ? (
            badges.length === 0 ? (
              <EmptyState icon={Award} title={t('perfilPublico.vazioBadgesTitulo')} description={t('perfilPublico.vazioBadgesDesc')} />
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 g-3">
                {badges.map((b) => (
                  <div className="col" key={b.badgeId}>
                    <Card className="h-100 p-0 overflow-hidden">
                      <div className={`d-flex align-items-center justify-content-center ${tintDoBadge(b.badgeId)}`} style={{ height: '4.5rem' }}>
                        <div className="avatar-circle bg-white fs-5 overflow-hidden" style={{ height: '3rem', width: '3rem' }}>
                          {b.imagem ? <img src={b.imagem} alt="" className="w-100 h-100 rounded-circle object-fit-cover" /> : b.nome[0]}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="fw-semibold text-ink mb-1">{b.nome}</p>
                        {b.fornecedor && <p className="fs-xs text-muted mb-2">{b.fornecedor}</p>}
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-inline-flex align-items-center gap-1 fs-xs fw-medium text-warning-emphasis">
                            <Star size={12} /> {b.pontos} {t('perfilPublico.pts')}
                          </span>
                          <span className={`d-inline-flex align-items-center gap-1 fs-xs fw-medium ${b.valid ? 'text-success' : 'text-muted'}`}>
                            {b.valid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {b.valid ? t('perfilPublico.valido') : t('perfilPublico.expirado')}
                          </span>
                        </div>
                        <p className="fs-xs text-muted mt-2 mb-0 d-flex align-items-center gap-1">
                          <Calendar size={11} /> {t('perfilPublico.obtidoEm')} {formatarData(b.obtainedDate)}
                        </p>
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
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-warning-subtle text-warning-emphasis flex-shrink-0" style={{ height: '3rem', width: '3rem' }}>
                  <Sparkles size={22} />
                </div>
                <p className="fw-semibold text-ink mb-0">{consultor.specials} {t('perfilPublico.conquistasCount')}</p>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  )
}
