import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, KeyRound, Mail, Users, Settings, ExternalLink } from 'lucide-react'
import { Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
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
    if (consultor || user) {
      setForm({
        nome: consultor?.name || user?.nome || '',
        email: user?.email || consultor?.email || '',
        biografia: consultor?.biography || '',
        linkedinUrl: consultor?.linkedinUrl || ''
      })
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('perfil.titulo')}</h1>
        <p className="mt-1 text-sm text-muted">{t('perfil.subtitulo')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cartão lateral */}
        <Card className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-light text-2xl font-bold text-brand">
            {iniciais}
          </div>
          <p className="mt-3 font-semibold text-ink">{form.nome}</p>
          <p className="text-sm text-muted">{form.email}</p>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">{t}</span>
              ))}
            </div>
          )}
          <Link to="/perfil/publico" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            {t('perfil.verPerfilPublico')} <ExternalLink size={14} />
          </Link>

          <div className="mt-5 flex justify-center gap-6 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xl font-bold text-brand">{loading ? '—' : pontos}</p>
              <p className="text-xs text-muted">{t('perfil.pontos')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand">{loading ? '—' : badges}</p>
              <p className="text-xs text-muted">{t('perfil.badges')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> {t('perfil.terminarSessao')}
          </button>
        </Card>

        {/* Formulário */}
        <Card className="lg:col-span-2">
          <form onSubmit={guardarAlteracoes} className="space-y-4">
            <h2 className="mb-2 font-semibold text-ink">{t('perfil.informacoesConta')}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">{t('perfil.nomeCompleto')}</span>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">{t('perfil.email')}</span>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-muted outline-none cursor-not-allowed border-dashed"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">{t('perfil.biografia')}</span>
              <textarea
                rows={3}
                value={form.biografia}
                onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                placeholder={t('perfil.biografiaPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">{t('perfil.linkedin')}</span>
              <input
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                placeholder={t('perfil.linkedinPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('perfil.aguardar') : t('perfil.guardar')}
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ACOES.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="flex h-full items-center gap-4 transition hover:border-brand hover:shadow-md">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                <a.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="text-sm text-muted">{a.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}