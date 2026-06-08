import { useNavigate, Link } from 'react-router-dom'
import { LogOut, KeyRound, Mail, Users, Settings, ExternalLink } from 'lucide-react'
import { Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const ACOES = [
  { to: '/perfil/alterar-password', icon: KeyRound, title: 'Alterar Palavra-passe', desc: 'Atualiza a tua palavra-passe de acesso' },
  { to: '/perfil/assinatura', icon: Mail, title: 'Assinatura de Email', desc: 'Configura a tua assinatura profissional' },
  { to: '/ranking', icon: Users, title: 'Diretório de Consultores', desc: 'Explora os perfis dos teus colegas' },
  { to: '/perfil/preferencias', icon: Settings, title: 'Preferências', desc: 'Notificações e idioma' },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const iniciais = (user?.nome || 'U')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

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
          <p className="mt-3 font-semibold text-ink">{user?.nome}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">Application Operations</span>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">SRE</span>
          </div>
          <Link to="/perfil/publico" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Ver Perfil Público <ExternalLink size={14} />
          </Link>

          <div className="mt-5 flex justify-center gap-6 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xl font-bold text-brand">1250</p>
              <p className="text-xs text-muted">Pontos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand">8</p>
              <p className="text-xs text-muted">Badges</p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Terminar Sessão
          </button>
        </Card>

        {/* Informações da conta */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">Informações da Conta</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Nome Completo</span>
              <input defaultValue={user?.nome} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
              <input defaultValue={user?.email} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Biografia</span>
            <textarea
              rows={3}
              defaultValue="Desenvolvedor Frontend focado em React/Next.js e TypeScript."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
              Service Line
              <Link to="/escolher-area" className="text-xs font-normal text-brand hover:underline">Selecionar área</Link>
            </span>
            <input defaultValue="Application Operations - Site Reliability Engineering" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          <div className="mt-5 flex justify-end">
            <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Guardar Alterações
            </button>
          </div>
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
