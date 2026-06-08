import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Diamond, Code, Hexagon, Rocket, Boxes, Check, Info } from 'lucide-react'

const TINTS = {
  sky: 'bg-sky-100 text-sky-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  salmon: 'bg-red-100 text-red-500',
  violet: 'bg-violet-100 text-violet-600',
}

const AREAS = [
  { id: 1, nome: '.NET Development', desc: 'C#, .NET Core, ASP.NET', tags: ['4 Pilares', 'Intermédio'], badges: 14, tint: 'sky', icon: Diamond },
  { id: 2, nome: 'Python Development', desc: 'Django, Flask, FastAPI', tags: ['3 Pilares', 'Iniciante'], badges: 12, tint: 'amber', icon: Code },
  { id: 3, nome: 'Node.js Development', desc: 'Express, NestJS, backend JavaScript', tags: ['4 Pilares', 'Intermédio'], badges: 12, tint: 'emerald', icon: Hexagon },
  { id: 4, nome: 'OutSystems Development', desc: 'Plataforma de desenvolvimento low-code', tags: ['Iniciante'], badges: 18, tint: 'salmon', icon: Rocket },
  { id: 5, nome: 'Microservices Architecture', desc: 'Design e implementação de microsserviços', tags: ['Avançado'], badges: 8, tint: 'violet', icon: Boxes },
]

export default function EscolhaAreaPage() {
  const navigate = useNavigate()
  const [selecionada, setSelecionada] = useState(null)

  return (
    <div>
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Perfil
      </Link>

      <div className="mb-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand text-white">
          <Boxes size={26} />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink">Selecione a sua Área</h1>
        <p className="mt-1 text-sm text-muted">
          Vamos personalizar a sua experiência com badges relevantes para a sua área
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {AREAS.map((a) => {
          const ativa = selecionada === a.id
          return (
            <button
              key={a.id}
              onClick={() => setSelecionada(a.id)}
              className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                ativa ? 'border-brand ring-2 ring-brand/20' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${TINTS[a.tint]}`}>
                <a.icon size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{a.nome}</p>
                <p className="text-sm text-muted">{a.desc}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">{t}</span>
                  ))}
                  <span className="text-xs text-muted">· {a.badges} badges</span>
                </div>
              </div>
              {ativa && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Check size={16} />
                </span>
              )}
            </button>
          )
        })}

        <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-4 text-sm text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-brand" />
          Escolhe a área onde desejas focar o teu desenvolvimento. Isto vai personalizar as tuas recomendações de badges.
        </div>

        <button
          disabled={!selecionada}
          onClick={() => navigate('/perfil')}
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Confirmar Área
        </button>
      </div>
    </div>
  )
}
