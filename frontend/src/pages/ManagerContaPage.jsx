import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, KeyRound } from 'lucide-react'
import { PageHeader, Card, Field, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

// Definições de conta dos perfis de gestão (Admin / TM / SLL).
export default function ManagerContaPage() {
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
    if (pw.nova.length < 8) return setErro('A nova palavra-passe deve ter pelo menos 8 caracteres.')
    if (pw.nova !== pw.confirmar) return setErro('As palavras-passe não coincidem.')
    setSaving(true)
    try {
      await api.changePassword({ currentPassword: pw.atual, newPassword: pw.nova })
      setMsg('Palavra-passe alterada com sucesso.')
      setPw({ atual: '', nova: '', confirmar: '' })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Definições de Conta" subtitle="Gere a tua conta." />

      <Card className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light text-lg font-bold text-brand">{iniciais}</div>
        <div>
          <p className="text-lg font-semibold text-ink">{user?.nome}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          <p className="mt-1 text-xs font-medium text-brand">{(user?.roles || [user?.role]).filter(Boolean).join(', ')}</p>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink"><KeyRound size={18} className="text-brand" /> Alterar Palavra-passe</h2>
        <form onSubmit={alterar} className="space-y-3">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
          {msg && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
          <Field label="Palavra-passe atual" type="password" value={pw.atual} onChange={(e) => setPw({ ...pw, atual: e.target.value })} required />
          <Field label="Nova palavra-passe" type="password" value={pw.nova} onChange={(e) => setPw({ ...pw, nova: e.target.value })} hint="Mínimo 8 caracteres." required />
          <Field label="Confirmar nova palavra-passe" type="password" value={pw.confirmar} onChange={(e) => setPw({ ...pw, confirmar: e.target.value })} required />
          <Button type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Alterar Palavra-passe'}</Button>
        </form>
      </Card>

      <button
        onClick={() => { logout(); navigate('/login') }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={16} /> Terminar Sessão
      </button>
    </div>
  )
}
