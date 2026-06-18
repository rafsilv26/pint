import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, Star, Sparkles, Calendar, Mail } from 'lucide-react'
import { Card, Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

// Perfil de um consultor visto por um perfil de gestão (TM / SLL / Admin).
export default function ManagerConsultorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: c, loading, error, reload } = useAsync(() => api.getConsultant(id), [id])

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">Consultor não encontrado.</p>

  const iniciais = (c.name || 'C').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const stats = [
    { icon: Award, label: 'Badges', value: c.badges ?? 0 },
    { icon: Star, label: 'Pontos', value: c.points ?? 0 },
    { icon: Sparkles, label: 'Conquistas Especiais', value: c.specials ?? 0 },
    { icon: Calendar, label: 'Consultor desde', value: c.startDate || '—' },
  ]

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </button>

      <Card className="p-0">
        <div className="h-24 rounded-t-xl bg-gradient-to-r from-brand to-brand-accent" />
        <div className="px-6 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-brand-light text-2xl font-bold text-brand">{iniciais}</div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-ink">{c.name}</h1>
                <p className="text-sm text-muted">{c.role || 'Consultor'}{c.area ? ` · ${c.area}` : ''}</p>
              </div>
            </div>
            {c.email && <p className="flex items-center gap-1 pb-1 text-sm text-muted"><Mail size={14} /> {c.email}</p>}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand"><s.icon size={20} /></div>
            <div>
              <p className="text-xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {c.biography && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold text-ink">Sobre</h2>
          <p className="text-sm leading-relaxed text-muted">{c.biography}</p>
        </Card>
      )}
    </div>
  )
}
