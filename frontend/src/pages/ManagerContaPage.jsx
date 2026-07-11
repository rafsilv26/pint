import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe2, LogOut, KeyRound, PenLine } from 'lucide-react'
import { PageHeader, Card, Field, Button } from '../components/ui'
import { useAuth } from '../context/useAuth'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Definições de conta dos perfis de gestão (Admin / TM / SLL).
export default function ManagerContaPage() {
  const { t, i18n } = useTranslation() // <-- Inicializa a tradução
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isTalentManager = location.pathname.startsWith('/tm')
  const isServiceLineLeader = location.pathname.startsWith('/sll')
  const [pw, setPw] = useState({ atual: '', nova: '', confirmar: '' })
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)
  const [saving, setSaving] = useState(false)

  const iniciais = (user?.nome || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

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
    <div className="mx-auto" style={{ maxWidth: '42rem' }}>
      <PageHeader
        title={t('managerConta.titulo')}
        subtitle={t('managerConta.subtitulo')}
      />

      <Card className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fs-5 fw-bold text-brand flex-shrink-0" style={{ height: '4rem', width: '4rem' }}>{iniciais}</div>
        <div>
          <p className="fs-5 fw-semibold text-ink mb-0">{user?.nome}</p>
          <p className="small text-muted mb-0">{user?.email}</p>
          <p className="mt-1 fs-xs fw-medium text-brand mb-0">{(user?.roles || [user?.role]).filter(Boolean).join(', ')}</p>
        </div>
      </Card>

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
