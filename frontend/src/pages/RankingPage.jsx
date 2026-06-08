import { useState } from 'react'
import { Trophy, Star, Medal, TrendingUp, Percent, Award } from 'lucide-react'
import { Card, Spinner } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const iniciais = (nome) =>
  nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-white p-1 ring-1 ring-gray-200">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === o ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

const PODIO = {
  1: { base: 'bg-amber-400', ring: 'ring-amber-400', h: 'h-28' },
  2: { base: 'bg-gray-300', ring: 'ring-gray-300', h: 'h-20' },
  3: { base: 'bg-orange-400', ring: 'ring-orange-400', h: 'h-16' },
}

export default function RankingPage() {
  const { data, loading } = useAsync(() => api.getGamification())
  const [periodo, setPeriodo] = useState('Total')
  const [categoria, setCategoria] = useState('Pontos')

  if (loading || !data) return <Spinner />

  const { me, lista, top3 } = data
  const stats = [
    { icon: Trophy, label: 'Posição', value: `#${me.posicao}`, hint: `em ${me.totalConsultores} consultores` },
    { icon: Star, label: 'Pontos', value: me.pontos },
    { icon: Medal, label: 'Badges', value: me.badges },
    { icon: Percent, label: 'Percentil', value: me.percentil },
    { icon: TrendingUp, label: 'Evolução', value: me.evolucao, hint: 'posições este mês' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Trophy className="text-amber-500" /> Ranking & Gamificação
        </h1>
        <p className="mt-1 text-sm text-muted">Compete com os melhores consultores da Softinsa</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented options={['Semana', 'Mês', 'Ano', 'Total']} value={periodo} onChange={setPeriodo} />
        <Segmented options={['Pontos', 'Badges', 'Dias']} value={categoria} onChange={setCategoria} />
      </div>

      {/* Banner de estatísticas */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 bg-gradient-to-br from-brand to-brand-accent text-white shadow-sm sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="p-5">
            <s.icon size={18} className="text-white/70" />
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-white/80">{s.label}</p>
            {s.hint && <p className="text-xs text-white/60">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rankings completos */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
            <Award size={18} /> Rankings Completos
          </h2>
          <div className="space-y-2">
            {lista.map((c) => (
              <div key={c.rank} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <span className="w-8 text-center text-sm font-bold text-muted">#{c.rank}</span>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-light text-xs font-semibold text-brand">
                  {iniciais(c.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.nome}</p>
                  <p className="truncate text-xs text-muted">{c.area}</p>
                </div>
                <div className="hidden items-center gap-1 text-sm text-ink sm:flex">
                  <Star size={14} className="text-amber-500" /> {c.pontos}
                </div>
                <div className="hidden items-center gap-1 text-sm text-ink sm:flex">
                  <Medal size={14} className="text-orange-500" /> {c.badges}
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  {c.delta}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 3 pódio */}
        <Card>
          <h2 className="mb-4 text-center font-semibold text-ink">Top 3 Consultores</h2>
          <div className="flex items-end justify-center gap-3">
            {top3.map((c) => {
              const p = PODIO[c.rank]
              return (
                <div key={c.rank} className="flex w-1/3 flex-col items-center">
                  <div className={`grid h-12 w-12 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand ring-2 ${p.ring}`}>
                    {iniciais(c.nome)}
                  </div>
                  <p className="mt-2 truncate text-center text-xs font-semibold text-ink">{c.nome}</p>
                  <div className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-lg ${p.base} ${p.h} text-white`}>
                    <span className="text-sm font-bold">#{c.rank}</span>
                    <span className="text-xs">{c.pontos} pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
