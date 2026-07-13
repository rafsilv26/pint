import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Diamond, Code, Hexagon, Rocket, Boxes, Check, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TINTS = {
  sky: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  amber: { backgroundColor: '#fef3c7', color: '#d97706' },
  emerald: { backgroundColor: '#d1fae5', color: '#059669' },
  salmon: { backgroundColor: '#fee2e2', color: '#ef4444' },
  violet: { backgroundColor: '#ede9fe', color: '#7c3aed' },
}

export default function EscolhaAreaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selecionada, setSelecionada] = useState(null)

  const AREAS = [
    { id: 1, nome: '.NET Development', desc: t('escolhaArea.areas.net'), tags: [t('escolhaArea.tags.pilares4'), t('escolhaArea.tags.intermedio')], badges: 14, tint: 'sky', icon: Diamond },
    { id: 2, nome: 'Python Development', desc: t('escolhaArea.areas.python'), tags: [t('escolhaArea.tags.pilares3'), t('escolhaArea.tags.iniciante')], badges: 12, tint: 'amber', icon: Code },
    { id: 3, nome: 'Node.js Development', desc: t('escolhaArea.areas.node'), tags: [t('escolhaArea.tags.pilares4'), t('escolhaArea.tags.intermedio')], badges: 12, tint: 'emerald', icon: Hexagon },
    { id: 4, nome: 'OutSystems Development', desc: t('escolhaArea.areas.outsystems'), tags: [t('escolhaArea.tags.iniciante')], badges: 18, tint: 'salmon', icon: Rocket },
    { id: 5, nome: 'Microservices Architecture', desc: t('escolhaArea.areas.microservices'), tags: [t('escolhaArea.tags.avancado')], badges: 8, tint: 'violet', icon: Boxes },
  ]

  return (
    <div>
      <Link to="/perfil" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('escolhaArea.voltar')}
      </Link>

      <div className="mb-4 text-center">
        <div className="mx-auto d-flex align-items-center justify-content-center rounded-3 bg-brand text-white" style={{ height: '3.5rem', width: '3.5rem' }}>
          <Boxes size={26} />
        </div>
        <h1 className="mt-3 fs-2 fw-bold text-ink">{t('escolhaArea.titulo')}</h1>
        <p className="mt-1 small text-muted">
          {t('escolhaArea.subtitulo')}
        </p>
      </div>

      <div className="mx-auto d-flex flex-column gap-2" style={{ maxWidth: '48rem' }}>
        {AREAS.map((a) => {
          const ativa = selecionada === a.id
          return (
            <button
              key={a.id}
              onClick={() => setSelecionada(a.id)}
              className={`w-100 d-flex align-items-center gap-3 rounded-4 border bg-white p-3 text-start shadow-sm ${
                ativa ? 'border-brand' : ''
              }`}
              style={ativa ? { boxShadow: '0 0 0 3px rgba(30,108,171,0.2)' } : undefined}
            >
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3" style={{ height: '3rem', width: '3rem', ...TINTS[a.tint] }}>
                <a.icon size={24} />
              </div>
              <div className="flex-grow-1 min-w-0">
                <p className="fw-semibold text-ink mb-0">{a.nome}</p>
                <p className="small text-muted mb-0">{a.desc}</p>
                <div className="mt-1 d-flex flex-wrap align-items-center gap-1">
                  {a.tags.map((tag) => (
                    <span key={tag} className="rounded-pill bg-light px-2 py-1 fs-xs fw-medium text-muted">{tag}</span>
                  ))}
                  <span className="fs-xs text-muted">· {a.badges} {t('escolhaArea.badgesCount')}</span>
                </div>
              </div>
              {ativa && (
                <span className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-brand text-white" style={{ height: '1.75rem', width: '1.75rem' }}>
                  <Check size={16} />
                </span>
              )}
            </button>
          )
        })}

        <div className="d-flex align-items-start gap-2 rounded-3 bg-brand-light p-3 small text-muted">
          <Info size={16} className="mt-1 flex-shrink-0 text-brand" />
          {t('escolhaArea.dica')}
        </div>

        <button
          disabled={!selecionada}
          onClick={() => navigate('/perfil')}
          className="btn btn-brand w-100 py-2 fw-semibold"
        >
          {t('escolhaArea.botao')}
        </button>
      </div>
    </div>
  )
}
