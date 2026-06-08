import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle2, Info } from 'lucide-react'
import { Card, Field, Button } from '../components/ui'

const REGRAS = [
  'Mínimo de 8 caracteres',
  'Pelo menos uma letra maiúscula',
  'Pelo menos um número',
  'Pelo menos um caráter especial',
]

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    if (nova.length < 8) return setErro('A nova palavra-passe deve ter pelo menos 8 caracteres.')
    if (nova !== confirmar) return setErro('As palavras-passe não coincidem.')
    setSucesso(true)
    setTimeout(() => navigate('/perfil'), 1500)
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Perfil
      </Link>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <KeyRound className="text-brand" /> Alterar Palavra-passe
        </h1>
        <p className="mt-1 text-sm text-muted">Atualiza a tua palavra-passe de acesso</p>
      </div>

      <Card>
        {sucesso ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <p className="mt-3 font-semibold text-ink">Palavra-passe alterada!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
            <Field label="Palavra-passe Atual" type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
            <Field label="Nova Palavra-passe" type="password" value={nova} onChange={(e) => setNova(e.target.value)} required />
            <Field label="Confirmar Nova Palavra-passe" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />

            <div className="rounded-lg bg-brand-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Info size={15} className="text-brand" /> Boas práticas</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted">
                {REGRAS.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>

            <Button type="submit" className="w-full">Alterar Palavra-passe</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
