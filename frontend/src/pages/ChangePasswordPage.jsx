import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle2, Info } from 'lucide-react'
import { Card, Field, Button } from '../components/ui'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function ChangePasswordPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const navigate = useNavigate()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  // As regras agora são traduzidas dinamicamente
  const REGRAS = [
    t('mudarPassword.regras.minimo'),
    t('mudarPassword.regras.maiuscula'),
    t('mudarPassword.regras.numero'),
    t('mudarPassword.regras.especial'),
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    
    // Alertas também traduzidos
    if (nova.length < 8) return setErro(t('mudarPassword.erroComprimento'))
    if (nova !== confirmar) return setErro(t('mudarPassword.erroCoincidem'))
    
    try {
      await api.changePassword({ currentPassword: atual, newPassword: nova })
      setSucesso(true)
      setTimeout(() => navigate('/perfil'), 1500)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('mudarPassword.voltar')}
      </Link>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <KeyRound className="text-brand" /> {t('mudarPassword.titulo')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('mudarPassword.subtitulo')}</p>
      </div>

      <Card>
        {sucesso ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <p className="mt-3 font-semibold text-ink">{t('mudarPassword.sucesso')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
            
            <Field label={t('mudarPassword.atual')} type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
            <Field label={t('mudarPassword.nova')} type="password" value={nova} onChange={(e) => setNova(e.target.value)} required />
            <Field label={t('mudarPassword.confirmar')} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />

            <div className="rounded-lg bg-brand-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Info size={15} className="text-brand" /> {t('mudarPassword.boasPraticas')}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted">
                {REGRAS.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <Button type="submit" className="w-full">{t('mudarPassword.botao')}</Button>
          </form>
        )}
      </Card>
    </div>
  )
}