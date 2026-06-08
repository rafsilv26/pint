import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/layout/AuthShell'
import { Field, Button } from '../../components/ui'
import * as api from '../../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', password: '' })
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      const res = await api.register(form)
      setSucesso(res.message)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Regista-te para começares a conquistar badges."
      footer={
        <>
          Já tens conta?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Iniciar sessão
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
        {sucesso && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{sucesso}</div>
        )}
        <Field label="Nome completo" value={form.nome} onChange={update('nome')} placeholder="Rafael Silva" required />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} placeholder="nome@softinsa.pt" required />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="••••••••"
          hint="Mínimo 8 caracteres."
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A criar…' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  )
}
