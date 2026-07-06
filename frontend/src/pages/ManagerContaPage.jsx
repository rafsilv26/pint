import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, KeyRound } from 'lucide-react'
import { PageHeader, Card, Field, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Definições de conta dos perfis de gestão (Admin / TM / SLL).
export default function ManagerContaPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
    
    setSaving(true)
    try {
      await api.changePassword({ currentPassword: pw.atual, newPassword: pw.nova })
      setMsg(t('managerConta.sucessoMsg'))
      setPw({ atual: '', nova: '', confirmar: '' })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader 
        title={t('managerConta.titulo')} 
        subtitle={t('managerConta.subtitulo')} 
      />

      <Card className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light text-lg font-bold text-brand">{iniciais}</div>
        <div>
          <p className="text-lg font-semibold text-ink">{user?.nome}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          <p className="mt-1 text-xs font-medium text-brand">{(user?.roles || [user?.role]).filter(Boolean).join(', ')}</p>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
          <KeyRound size={18} className="text-brand" /> {t('managerConta.alterarPassword')}
        </h2>
        <form onSubmit={alterar} className="space-y-3">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
          {msg && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
          
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
        onClick={() => { logout(); navigate('/login') }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={16} /> {t('managerConta.botoes.terminarSessao')}
      </button>
    </div>
  )
}