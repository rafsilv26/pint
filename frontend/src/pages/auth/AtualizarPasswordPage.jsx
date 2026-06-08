import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'

// Definir nova password (após link de recuperação).
export default function AtualizarPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/login'), 900)
  }

  return (
    <AuthShell title="Atualizar Password" subtitle="Introduzir a nova password de acesso">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Introduzir nova password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mx-auto block rounded-full bg-brand px-12 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'A guardar…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  )
}
