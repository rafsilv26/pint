import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, X, Target, Crown } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/useAuth'
import { useTranslation } from 'react-i18next'
import * as api from '../services/api'

const DIAS_ALERTA = 60

export default function DashboardAlerts({ conquistas = [] }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: badges } = useAsync(() => api.getMeusBadges())
  const { data: objetivos } = useAsync(() => api.getMeusObjetivos())
  const [premiosDispensados, setPremiosDispensados] = useState(false)

  if (!badges) return null
  const validos = badges.filter((b) => b.valid !== false)

  const chavePremios = `premios-consultor-${user?.id || 'x'}`
  let vistosPremios = []
  try { vistosPremios = JSON.parse(localStorage.getItem(chavePremios) || '[]') } catch { vistosPremios = [] }
  const novosPremios = (conquistas || []).filter((c) => !vistosPremios.includes(c.id))
  const mostrarPremios = novosPremios.length > 0 && !premiosDispensados
  const dispensarPremios = () => {
    localStorage.setItem(chavePremios, JSON.stringify((conquistas || []).map((c) => c.id)))
    setPremiosDispensados(true)
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const aExpirar = validos
    .filter((b) => b.expirationDate)
    .map((b) => ({ ...b, dias: Math.ceil((new Date(b.expirationDate) - hoje) / 86400000) }))
    .filter((b) => b.dias >= 0 && b.dias <= DIAS_ALERTA)
    .sort((a, b) => a.dias - b.dias)

  const objetivosAlerta = (objetivos || [])
    .filter((o) => !o.concluido && o.expectedDate)
    .map((o) => ({ ...o, dias: Math.ceil((new Date(o.expectedDate) - hoje) / 86400000) }))
    .filter((o) => o.dias >= 0 && o.dias <= DIAS_ALERTA)
    .sort((a, b) => a.dias - b.dias)

  if (!mostrarPremios && aExpirar.length === 0 && objetivosAlerta.length === 0) return null

  return (
    <div className="d-flex flex-column gap-3">
      {mostrarPremios && (
        <div className="rounded-3 p-4 text-white shadow-sm d-flex align-items-center gap-3" style={{ background: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}>
          <Crown size={28} className="flex-shrink-0" />
          <div className="flex-grow-1 min-w-0">
            <p className="fw-bold mb-1">{t('dashboardAlertas.premioTitulo')}</p>
            <p className="small text-white mb-0" style={{ opacity: 0.9 }}>
              {novosPremios.map((c) => c.nome).join(' · ')}
            </p>
          </div>
          <button onClick={dispensarPremios} className="btn btn-sm btn-light flex-shrink-0" title={t('dashboardAlertas.marcoDispensar')}>
            <X size={16} />
          </button>
        </div>
      )}

      {aExpirar.length > 0 && (
        <div className="rounded-3 border border-warning-subtle bg-warning-subtle p-3">
          <p className="d-flex align-items-center gap-2 fw-semibold text-warning-emphasis mb-2">
            <Clock size={16} /> {t('dashboardAlertas.expiraTitulo')}
          </p>
          <ul className="list-unstyled mb-2 d-flex flex-column gap-1 small text-warning-emphasis">
            {aExpirar.map((b) => (
              <li key={b.badgeId}>
                {b.dias === 0
                  ? t('dashboardAlertas.expiraHoje', { nome: b.nome })
                  : t('dashboardAlertas.expiraItem', { nome: b.nome, dias: b.dias, count: b.dias })}
              </li>
            ))}
          </ul>
          <Link to="/historico" className="small fw-medium text-warning-emphasis text-decoration-none">
            {t('dashboardAlertas.verHistorico')} →
          </Link>
        </div>
      )}

      {objetivosAlerta.length > 0 && (
        <div className="rounded-3 border bg-white p-3 shadow-sm">
          <p className="d-flex align-items-center gap-2 fw-semibold text-ink mb-2">
            <Target size={16} className="text-brand" /> {t('dashboardAlertas.objetivosTitulo')}
          </p>
          <ul className="list-unstyled mb-2 d-flex flex-column gap-1 small text-muted">
            {objetivosAlerta.map((o) => (
              <li key={o.id}>
                {o.dias === 0
                  ? t('dashboardAlertas.objetivoHoje', { title: o.title })
                  : t('dashboardAlertas.objetivoItem', { title: o.title, dias: o.dias, count: o.dias })}
              </li>
            ))}
          </ul>
          <Link to="/objetivos" className="small fw-medium text-brand text-decoration-none">
            {t('dashboardAlertas.verObjetivos')} →
          </Link>
        </div>
      )}
    </div>
  )
}
