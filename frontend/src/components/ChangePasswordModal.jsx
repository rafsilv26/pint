import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Field } from './ui'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

// Pop-up de primeira-troca de password (mostrado por cima da app quando
// mustChangePassword está ativo). Bloqueia a app até estar trocada.
export default function ChangePasswordModal() {
  const navigate = useNavigate()
  const { markPasswordChanged, logout } = useAuth()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    if (nova.length < 8) return setErro('A nova palavra-passe deve ter pelo menos 8 caracteres.')
    if (nova !== confirmar) return setErro('As palavras-passe não coincidem.')
    setLoading(true)
    try {
      await api.changePassword({ currentPassword: atual, newPassword: nova })
      markPasswordChanged()
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-light text-brand">
            <Lock size={18} />
          </div>
          <h2 className="text-lg font-bold text-ink">Definir nova palavra-passe</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          É o teu primeiro acesso — define uma palavra-passe pessoal para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
          <Field
            label="Palavra-passe atual (a que recebeste)"
            type="password"
            icon={Lock}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            placeholder="Palavra-passe temporária"
            required
          />
          <Field
            label="Nova palavra-passe"
            type="password"
            icon={Lock}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            hint="Mínimo 8 caracteres."
            required
          />
          <Field
            label="Confirmar nova palavra-passe"
            type="password"
            icon={Lock}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'A guardar…' : 'Definir e entrar'}
          </button>
        </form>

        <button
          onClick={() => { logout(); navigate('/login') }}
          className="mt-3 w-full text-center text-sm text-muted transition hover:text-brand"
        >
          Não és tu? Terminar sessão
        </button>
      </div>
    </div>
  )
}
