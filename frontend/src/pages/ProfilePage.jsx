import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, KeyRound, Mail, Users, Settings, ExternalLink } from 'lucide-react'
import { Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const ACOES = [
  { to: '/perfil/alterar-password', icon: KeyRound, title: 'Alterar Palavra-passe', desc: 'Atualiza a tua palavra-passe de acesso' },
  { to: '/perfil/assinatura', icon: Mail, title: 'Assinatura de Email', desc: 'Configura a tua assinatura profissional' },
  { to: '/consultores', icon: Users, title: 'Diretório de Consultores', desc: 'Explora os perfis dos teus colegas' },
  { to: '/perfil/preferencias', icon: Settings, title: 'Preferências', desc: 'Notificações e idioma' },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Dados reais do consultor (pontos, badges, área, biografia, …)
  const { data: consultor, loading, reload } = useAsync(
    () => api.getConsultant(user.id).catch(() => null),
    [user?.id]
  )

  // 1. Estado controlado para gerir os campos do formulário
  const [form, setForm] = useState({
    nome: '',
    email: '',
    biografia: '',
    serviceLine: ''
  })
  const [saving, setSaving] = useState(false)

  // 2. Sincronizar os dados da API assim que o carregamento terminar
  useEffect(() => {
    if (consultor || user) {
      setForm({
        nome: consultor?.name || user?.nome || '',
        email: user?.email || consultor?.email || '',
        biografia: consultor?.biography || '',
        serviceLine: consultor?.serviceLine || ''
      })
    }
  }, [consultor, user])

  const nomeExibicao = form.nome || 'Consultor'
  const pontos = consultor?.points ?? 0
  const badges = consultor?.badges ?? 0
  const tags = [consultor?.area, form.serviceLine].filter(Boolean)
  const iniciais = nomeExibicao.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  // 3. Função assíncrona para enviar as alterações para a base de dados
  async function guardarAlteracoes(e) {
    e.preventDefault()
    setSaving(true)
    try {
      // Garante que a tua api.js tem esta rota configurada para receber o ID e o corpo com os dados
      await api.updateConsultant(user.id, {
        name: form.nome,
        biography: form.biografia,
        serviceLine: form.serviceLine
      })
      alert('Perfil atualizado com sucesso!')
      reload() // Recarrega a query do useAsync para trazer os dados novos e limpos
    } catch (err) {
      alert(err.message || 'Não foi possível guardar as alterações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Perfil e Configurações</h1>
        <p className="mt-1 text-sm text-muted">Gere a tua conta e preferências</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cartão lateral */}
        <Card className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-light text-2xl font-bold text-brand">
            {iniciais}
          </div>
          <p className="mt-3 font-semibold text-ink">{nomeExibicao}</p>
          <p className="text-sm text-muted">{form.email}</p>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">{t}</span>
              ))}
            </div>
          )}
          <Link to="/perfil/publico" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Ver Perfil Público <ExternalLink size={14} />
          </Link>

          <div className="mt-5 flex justify-center gap-6 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xl font-bold text-brand">{loading ? '—' : pontos}</p>
              <p className="text-xs text-muted">Pontos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand">{loading ? '—' : badges}</p>
              <p className="text-xs text-muted">Badges</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Terminar Sessão
          </button>
        </Card>

        {/* Informações da conta dentro de um Form estruturado */}
        <Card className="lg:col-span-2">
          <form onSubmit={guardarAlteracoes} className="space-y-4">
            <h2 className="mb-2 font-semibold text-ink">Informações da Conta</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Nome Completo</span>
                <input 
                  value={form.nome} 
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" 
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
                <input 
                  type="email"
                  value={form.email} 
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-muted outline-none cursor-not-allowed border-dashed" 
                />
              </label>
            </div>
            
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Biografia</span>
              <textarea
                rows={3}
                value={form.biografia}
                onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                placeholder="Escreve uma breve biografia profissional…"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
            
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
                Service Line
                <Link to="/escolher-area" className="text-xs font-normal text-brand hover:underline">Selecionar área</Link>
              </span>
              <input 
                value={form.serviceLine} 
                onChange={(e) => setForm({ ...form, serviceLine: e.target.value })}
                placeholder="Sem service line atribuída" 
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" 
              />
            </label>
            
            <div className="mt-5 flex justify-end">
              <button 
                type="submit"
                disabled={saving || loading}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'A guardar…' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ACOES.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="flex h-full items-center gap-4 transition hover:border-brand hover:shadow-md">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                <a.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="text-sm text-muted">{a.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}