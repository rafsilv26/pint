import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, KeyRound, Mail, Users, Settings, ExternalLink } from 'lucide-react'
import { Card } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useTranslation } from 'react-i18next'
import * as api from '../services/api'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const ACOES = [
    { to: '/perfil/alterar-password', icon: KeyRound, title: t('perfil.acoes.alterarPassword'), desc: t('perfil.acoes.alterarPasswordDesc') },
    { to: '/perfil/assinatura', icon: Mail, title: t('perfil.acoes.assinatura'), desc: t('perfil.acoes.assinaturaDesc') },
    { to: '/consultores', icon: Users, title: t('perfil.acoes.diretorio'), desc: t('perfil.acoes.diretorioDesc') },
    { to: '/perfil/preferencias', icon: Settings, title: t('perfil.acoes.preferencias'), desc: t('perfil.acoes.preferenciasDesc') },
  ]

  const { data: consultor, loading, reload } = useAsync(
    () => api.getConsultant(user.id).catch(() => null),
    [user?.id]
  )

  const [form, setForm] = useState({
    nome: '',
    email: '',
    biografia: '',
    linkedinUrl: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.resolve().then(() => {
      if (!alive || (!consultor && !user)) return
      setForm({
        nome: consultor?.name || user?.nome || '',
        email: user?.email || consultor?.email || '',
        biografia: consultor?.biography || '',
        linkedinUrl: consultor?.linkedinUrl || ''
      })
    })
    return () => { alive = false }
  }, [consultor, user])

  const pontos = consultor?.points ?? 0
  const badges = consultor?.badges ?? 0
  const tags = [consultor?.area, consultor?.serviceLine].filter(Boolean)
  const iniciais = form.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  async function guardarAlteracoes(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateConsultant(user.id, {
        name: form.nome,
        biography: form.biografia,
        linkedinUrl: form.linkedinUrl
      })
      alert(t('perfil.sucesso'))
      reload()
    } catch (err) {
      alert(err.message || t('perfil.erro'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="fs-2 fw-bold text-ink">{t('perfil.titulo')}</h1>
        <p className="mt-1 small text-muted">{t('perfil.subtitulo')}</p>
      </div>

      <div className="row g-4">
        {/* Cartão lateral */}
        <div className="col-lg-4">
          <Card className="text-center">
            <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-brand-light fs-2 fw-bold text-brand" style={{ height: '5rem', width: '5rem' }}>
              {iniciais}
            </div>
            <p className="mt-3 fw-semibold text-ink mb-0">{form.nome}</p>
            <p className="small text-muted">{form.email}</p>
            {tags.length > 0 && (
              <div className="mt-2 d-flex flex-wrap justify-content-center gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-pill bg-brand-light px-2 py-1 fs-xs fw-medium text-brand">{tag}</span>
                ))}
              </div>
            )}
            <Link to="/perfil/publico" className="mt-2 d-inline-flex align-items-center gap-1 small fw-medium text-brand text-decoration-none">
              {t('perfil.verPerfilPublico')} <ExternalLink size={14} />
            </Link>

            <div className="mt-4 d-flex justify-content-center gap-5 border-top pt-3">
              <div>
                <p className="fs-4 fw-bold text-brand mb-0">{loading ? '—' : pontos}</p>
                <p className="fs-xs text-muted mb-0">{t('perfil.pontos')}</p>
              </div>
              <div>
                <p className="fs-4 fw-bold text-brand mb-0">{loading ? '—' : badges}</p>
                <p className="fs-xs text-muted mb-0">{t('perfil.badges')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { logout(); navigate('/login') }}
              className="mt-4 btn btn-outline-danger bg-white w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <LogOut size={16} /> {t('perfil.terminarSessao')}
            </button>
          </Card>
        </div>

        {/* Formulário */}
        <div className="col-lg-8">
          <Card>
            <form onSubmit={guardarAlteracoes} className="d-flex flex-column gap-3">
              <h2 className="mb-1 fw-semibold text-ink">{t('perfil.informacoesConta')}</h2>

              <div className="row g-3">
                <label className="col-sm-6 d-block">
                  <span className="mb-2 d-block small fw-medium text-ink">{t('perfil.nomeCompleto')}</span>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    className="form-control"
                  />
                </label>

                <label className="col-sm-6 d-block">
                  <span className="mb-2 d-block small fw-medium text-ink">{t('perfil.email')}</span>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="form-control bg-light text-muted border-dashed"
                  />
                </label>
              </div>

              <label className="d-block">
                <span className="mb-2 d-block small fw-medium text-ink">{t('perfil.biografia')}</span>
                <textarea
                  rows={3}
                  value={form.biografia}
                  onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                  placeholder={t('perfil.biografiaPlaceholder')}
                  className="form-control"
                />
              </label>

              <label className="d-block">
                <span className="mb-2 d-block small fw-medium text-ink">{t('perfil.linkedin')}</span>
                <input
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder={t('perfil.linkedinPlaceholder')}
                  className="form-control"
                />
              </label>

              <div className="mt-2 d-flex justify-content-end">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="btn btn-brand"
                >
                  {saving ? t('perfil.aguardar') : t('perfil.guardar')}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Ações */}
      <div className="row row-cols-1 row-cols-sm-2 g-3">
        {ACOES.map((a) => (
          <div className="col" key={a.to}>
            <Link to={a.to} className="text-decoration-none">
              <Card className="d-flex h-100 align-items-center gap-3 hover-shadow">
                <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 bg-brand-light text-brand" style={{ height: '2.75rem', width: '2.75rem' }}>
                  <a.icon size={20} />
                </div>
                <div>
                  <p className="fw-semibold text-ink mb-0">{a.title}</p>
                  <p className="small text-muted mb-0">{a.desc}</p>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
