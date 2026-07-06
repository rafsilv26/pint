import { useState } from 'react'
import { Trophy, Star, Medal, TrendingUp, Percent, Award } from 'lucide-react'
import { useAsync } from '../hooks/useAsync.js'
import { Card, Spinner, ErrorState } from '../components/ui'
import { getGamification } from '../services/apiReal.js'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const iniciais = (nome) =>
  nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// O componente Segmented foi ajustado para receber { value, label }
function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-white p-1 ring-1 ring-gray-200">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === o.value ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
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
  const { t } = useTranslation() // <-- Inicializa a tradução

  const { data, loading, error, reload } = useAsync(() => getGamification())
  
  // O estado agora guarda as chaves
  const [periodo, setPeriodo] = useState('total')
  const [categoria, setCategoria] = useState('pontos')

  if (error) {
    console.error("Erro capturado no React:", error);
    return <ErrorState onRetry={reload} />
  }

  if (loading || !data) return <Spinner />

  const { me, lista, top3 } = data

  const stats = [
    { icon: Trophy, label: t('ranking.stats.posicao'), value: `#${me.posicao}`, hint: `${t('ranking.stats.em')} ${me.totalConsultores} ${t('ranking.stats.consultores')}` },
    { icon: Star, label: t('ranking.stats.pontos'), value: me.pontos },
    { icon: Medal, label: t('ranking.stats.badges'), value: me.badges },
    { icon: Percent, label: t('ranking.stats.percentil'), value: me.percentil },
    { icon: TrendingUp, label: t('ranking.stats.evolucao'), value: me.evolucao, hint: t('ranking.stats.posicoesMes') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Trophy className="text-amber-500" /> {t('ranking.titulo')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('ranking.subtitulo')}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented 
          options={[
            { value: 'semana', label: t('ranking.periodos.semana') },
            { value: 'mes', label: t('ranking.periodos.mes') },
            { value: 'ano', label: t('ranking.periodos.ano') },
            { value: 'total', label: t('ranking.periodos.total') },
          ]} 
          value={periodo} 
          onChange={setPeriodo} 
        />
        <Segmented 
          options={[
            { value: 'pontos', label: t('ranking.categorias.pontos') },
            { value: 'badges', label: t('ranking.categorias.badges') },
            { value: 'dias', label: t('ranking.categorias.dias') },
          ]} 
          value={categoria} 
          onChange={setCategoria} 
        />
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
            <Award size={18} /> {t('ranking.completos')}
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
                  <p className="truncate text-xs text-muted">{t('ranking.consultorDefault')}</p>
                </div>
                <div className="hidden items-center gap-1 text-sm text-ink sm:flex">
                  <Star size={14} className="text-amber-500" /> {c.pontos}
                </div>
                <div className="hidden items-center gap-1 text-sm text-ink sm:flex">
                  <Medal size={14} className="text-orange-500" /> {c.badges}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {c.delta || '-'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 3 pódio */}
        <Card>
          <h2 className="mb-4 text-center font-semibold text-ink">{t('ranking.top3')}</h2>
          <div className="flex items-end justify-center gap-3">
            {top3.map((c) => {
              const p = PODIO[c.rank] || PODIO[2]
              return (
                <div key={c.rank} className="flex w-1/3 flex-col items-center">
                  <div className={`grid h-12 w-12 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand ring-2 ${p.ring}`}>
                    {iniciais(c.nome)}
                  </div>
                  <p className="mt-2 truncate text-center text-xs font-semibold text-ink">{c.nome}</p>
                  <div className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-lg ${p.base} ${p.h} text-white`}>
                    <span className="text-sm font-bold">#{c.rank}</span>
                    <span className="text-xs">{c.pontos} {t('ranking.pts')}</span>
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