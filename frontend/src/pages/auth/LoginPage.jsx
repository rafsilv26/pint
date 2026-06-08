import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import { Field } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('rafael@softinsa.pt')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      await login({ email, password })
      const destino = location.state?.from?.pathname || '/'
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Login"
      subtitle="Introduzir as credenciais de acesso"
      footer={
        <>
          Ainda não tens conta?{' '}
          <Link to="/registo" className="font-semibold text-brand hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>
        )}
        <Field
          label="Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Introduzir o email"
          required
        />
        <Field
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Introduzir password"
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="rounded border-gray-300 text-brand focus:ring-brand" />
            Lembrar-me
          </label>
          <Link to="/recuperar-password" className="text-brand hover:underline">
            Esqueceu-se da password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mx-auto block rounded-full bg-brand px-12 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  )
}
