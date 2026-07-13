import { useState } from 'react'
import { Trophy, Star, Medal, Percent, Award } from 'lucide-react'
import { useAsync } from '../hooks/useAsync.js'
import { Card, Spinner, ErrorState } from '../components/ui'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const iniciais = (nome = '') =>
  nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

function Segmented({ options, value, onChange }) {
  return (
    <div className="d-flex rounded-3 bg-white p-1 border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`btn btn-sm rounded-2 fw-medium ${
            value === o.value ? 'btn-brand' : 'btn-link text-muted text-decoration-none'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const PODIO = {
  1: { color: '#fbbf24', h: '7rem' },
  2: { color: '#d1d5db', h: '5rem' },
  3: { color: '#fb923c', h: '4rem' },
}

export default function RankingPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getGamification())
  const [categoria, setCategoria] = useState('pontos')

  if (error) return <ErrorState onRetry={reload} />
  if (loading || !data) return <Spinner />

  const { me, lista } = data

  const ordenada = [...lista]
    .sort((a, b) => (categoria === 'badges' ? b.badges - a.badges : b.pontos - a.pontos))
    .map((c, i) => ({ ...c, rank: i + 1 }))
  const top3 = ordenada.slice(0, 3)

  const total = me.totalConsultores || 0
  const posNum = Number(me.posicao)
  const percentil = total > 0 && Number.isFinite(posNum)
    ? `${Math.round((1 - (posNum - 1) / total) * 100)}%`
    : '—'

  const stats = [
    { icon: Trophy, label: t('ranking.stats.posicao'), value: `#${me.posicao}`, hint: `${t('ranking.stats.em')} ${total} ${t('ranking.stats.consultores')}` },
    { icon: Star, label: t('ranking.stats.pontos'), value: me.pontos },
    { icon: Medal, label: t('ranking.stats.badges'), value: me.badges },
    { icon: Percent, label: t('ranking.stats.percentil'), value: percentil },
  ]

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="d-flex align-items-center gap-2 fs-2 fw-bold text-ink">
          <Trophy className="text-warning" /> {t('ranking.titulo')}
        </h1>
        <p className="mt-1 small text-muted">{t('ranking.subtitulo')}</p>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className="small text-muted">{t('ranking.ordenarPor')}</span>
        <Segmented
          options={[
            { value: 'pontos', label: t('ranking.categorias.pontos') },
            { value: 'badges', label: t('ranking.categorias.badges') },
          ]}
          value={categoria}
          onChange={setCategoria}
        />
      </div>

      <div className="row row-cols-2 row-cols-lg-4 g-0 overflow-hidden rounded-4 bg-gradient-brand text-white shadow-sm">
        {stats.map((s) => (
          <div key={s.label} className="col p-4">
            <s.icon size={18} className="text-white-50" />
            <p className="mt-2 fs-3 fw-bold mb-0">{s.value}</p>
            <p className="small text-white-50 mb-0">{s.label}</p>
            {s.hint && <p className="fs-xs text-white-50 mb-0">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <Card>
            <h2 className="mb-3 d-flex align-items-center gap-2 fw-semibold text-ink">
              <Award size={18} /> {t('ranking.completos')}
            </h2>
            <div className="d-flex flex-column gap-2">
              {ordenada.map((c) => (
                <div key={c.rank} className="d-flex align-items-center gap-3 rounded-3 border p-3">
                  <span className="text-center small fw-bold text-muted" style={{ width: '2rem' }}>#{c.rank}</span>
                  <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-brand-light fs-xs fw-semibold text-brand" style={{ height: '2.5rem', width: '2.5rem' }}>
                    {iniciais(c.nome)}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <p className="text-truncate fw-semibold text-ink mb-0">{c.nome}</p>
                    <p className="text-truncate fs-xs text-muted mb-0">{t('ranking.consultorDefault')}</p>
                  </div>
                  <div className={`d-none d-sm-flex align-items-center gap-1 small ${categoria === 'pontos' ? 'text-ink fw-semibold' : 'text-muted'}`}>
                    <Star size={14} className="text-warning" /> {c.pontos}
                  </div>
                  <div className={`d-none d-sm-flex align-items-center gap-1 small ${categoria === 'badges' ? 'text-ink fw-semibold' : 'text-muted'}`}>
                    <Medal size={14} style={{ color: '#fb923c' }} /> {c.badges}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-lg-4">
          <Card>
            <h2 className="mb-3 text-center fw-semibold text-ink">{t('ranking.top3')}</h2>
            <div className="d-flex align-items-end justify-content-center gap-3">
              {top3.map((c) => {
                const p = PODIO[c.rank] || PODIO[2]
                const valor = categoria === 'badges' ? c.badges : c.pontos
                const unidade = categoria === 'badges' ? t('ranking.categorias.badges').toLowerCase() : t('ranking.pts')
                return (
                  <div key={c.rank} className="d-flex flex-column align-items-center" style={{ width: '33%' }}>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fs-xs fw-bold text-brand"
                      style={{ height: '3rem', width: '3rem', boxShadow: `0 0 0 2px ${p.color}` }}
                    >
                      {iniciais(c.nome)}
                    </div>
                    <p className="mt-2 text-truncate text-center fs-xs fw-semibold text-ink mb-0" style={{ maxWidth: '100%' }}>{c.nome}</p>
                    <div
                      className="mt-2 d-flex w-100 flex-column align-items-center justify-content-center rounded-top-3 text-white"
                      style={{ backgroundColor: p.color, height: p.h }}
                    >
                      <span className="small fw-bold">#{c.rank}</span>
                      <span className="fs-xs">{valor} {unidade}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
