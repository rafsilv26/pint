import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Star, Percent, Calendar, Mail, ArrowLeft } from 'lucide-react'
import { Card, Spinner } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

const TABS = ['Sobre', 'Badges Conquistados', 'Conquistas Especiais']

export default function PublicProfilePage() {
  const { user } = useAuth()
  const { data: badges, loading } = useAsync(() => api.getMeusBadges())
  const [tab, setTab] = useState('Sobre')

  const nome = user?.nome || 'Consultor'
  const iniciais = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const stats = [
    { icon: Award, label: 'Badges Completados', value: badges?.length ?? 0 },
    { icon: Star, label: 'Pontos Totais', value: 300 },
    { icon: Percent, label: 'Taxa de Aprovação', value: '74%' },
    { icon: Calendar, label: 'Consultor desde', value: '1/1/2020' },
  ]

  return (
    <div>
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Perfil
      </Link>

      {/* Cabeçalho */}
      <Card className="p-0">
        <div className="h-28 rounded-t-xl bg-gradient-to-r from-brand to-brand-accent" />
        <div className="px-6 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-brand-light text-2xl font-bold text-brand">
                {iniciais}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-ink">{nome}</h1>
                <p className="text-sm text-muted">Desenvolvedor Web</p>
              </div>
            </div>
            <p className="flex items-center gap-1 pb-1 text-sm text-muted">
              <Mail size={14} /> {user?.email}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Conteúdo */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                  tab === t ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner />
          ) : tab === 'Sobre' ? (
            <Card>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-ink">{nome}</h2>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-600">React</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Desenvolvedor Frontend focado em React/Next.js e TypeScript. Proficiente em gestão de estado
                complexa, UX/UX responsivo e testes unitários. Comprometido com as melhores práticas de
                acessibilidade e Web Vitals.
              </p>
              <h3 className="mt-5 font-semibold text-ink">Assinatura de Badges</h3>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-red-100 text-red-500"><Award size={20} /></div>
                <div>
                  <p className="font-medium text-ink">Java - Intermédio</p>
                  <p className="text-xs text-muted">Softinsa Certification</p>
                </div>
              </div>
            </Card>
          ) : tab === 'Badges Conquistados' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {badges.map((b) => (
                <Card key={b.badgeId} className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand"><Award size={22} /></div>
                  <div>
                    <p className="font-semibold text-ink">{b.nome}</p>
                    <p className="text-xs text-muted">{b.fornecedor} · {b.pontos} pts</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { t: 'Primeiros Passos', d: 'Primeiro badge conquistado' },
                { t: 'Cloud Explorer', d: '2 badges de cloud conquistados' },
              ].map((c) => (
                <Card key={c.t} className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600"><Star size={22} /></div>
                  <div>
                    <p className="font-semibold text-ink">{c.t}</p>
                    <p className="text-xs text-muted">{c.d}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand to-brand-accent p-4 text-white">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-white/80">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
