import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: areas } = useAsync(() => api.getAreasPublicas())

  const [form, setForm] = useState({ nome: '', email: '', password: '', confirmar: '', areaId: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    if (form.password.length < 8) return setErro(t('registo.erroComprimento'))
    if (form.password !== form.confirmar) return setErro(t('registo.erroCoincidem'))
    setLoading(true)
    try {
      const res = await api.signup({
        nome: form.nome,
        email: form.email,
        password: form.password,
        areaId: form.areaId ? Number(form.areaId) : undefined,
      })
      setSucesso(res.message || t('registo.sucesso'))
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <AuthShell title={t('registo.titulo')} subtitle={t('registo.subtitulo')}>
        <div className="text-center">
          <CheckCircle2 size={44} className="mx-auto text-success" />
          <p className="mt-3 small text-ink">{sucesso}</p>
          <button onClick={() => navigate('/login')} className="mt-2 btn btn-brand rounded-pill px-4 py-2 fw-semibold">
            {t('registo.irLogin')}
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('registo.titulo')} subtitle={t('registo.subtitulo')}>
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}

        <Field label={t('registo.nome')} icon={User} value={form.nome} onChange={set('nome')} placeholder={t('registo.nomePlaceholder')} required />
        <Field label={t('registo.email')} type="email" icon={Mail} value={form.email} onChange={set('email')} placeholder={t('registo.emailPlaceholder')} required />
        <Field
          label={t('registo.password')}
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={form.password}
          onChange={set('password')}
          placeholder={t('registo.passwordPlaceholder')}
          required
          trailing={
            <button type="button" className="input-group-text bg-white" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword} aria-label={t('registo.mostrarPassword')}>
              {showPassword ? <EyeOff size={16} className="text-secondary" /> : <Eye size={16} className="text-secondary" />}
            </button>
          }
        />
        <Field
          label={t('registo.confirmar')}
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={form.confirmar}
          onChange={set('confirmar')}
          placeholder={t('registo.confirmarPlaceholder')}
          required
        />

        <label className="d-block">
          <span className="mb-1 d-block small fw-medium text-ink">{t('registo.area')}</span>
          <select value={form.areaId} onChange={set('areaId')} className="form-select">
            <option value="">{t('registo.areaPlaceholder')}</option>
            {(areas || []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>

        <button type="submit" disabled={loading} className="btn btn-brand rounded-pill px-5 py-2 fw-semibold mx-auto">
          {loading ? t('registo.aCriar') : t('registo.criar')}
        </button>

        <p className="text-center small text-muted mb-0">
          {t('registo.jaTens')} <Link to="/login" className="text-brand text-decoration-none">{t('registo.entrar')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
