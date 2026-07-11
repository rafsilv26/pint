import { useState } from 'react'
import { Bell, Calendar, Trash2, Search } from 'lucide-react'
import { Spinner, EmptyState, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Função adaptada para receber o idioma atual (locale)
function formatar(dt, locale = 'pt-PT') {
  return new Date(dt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation() // <-- Inicializa a tradução e o i18n
  const { data, loading, error, reload } = useAsync(() => api.getNotificacoes())
  const [filtro, setFiltro] = useState('todas')
  const [pesquisa, setPesquisa] = useState('')
  const [lidas, setLidas] = useState({})
  const [apagadas, setApagadas] = useState({})

  // Mapear o idioma atual para o formato de data/hora correto
  const localeMap = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES'
  }
  const currentLocale = localeMap[i18n.language?.substring(0, 2)] || 'pt-PT'

  // As TAGS foram movidas para dentro para traduzir os labels
  const TAGS = {
    info: { label: t('notificacoes.tags.info'), cls: 'text-bg-primary' },
    warning: { label: t('notificacoes.tags.aviso'), cls: 'text-bg-warning' },
    success: { label: t('notificacoes.tags.sucesso'), cls: 'text-bg-success' },
  }

  const FILTROS = [
    { key: 'todas', label: t('notificacoes.filtros.todas') },
    { key: 'nao-lidas', label: t('notificacoes.filtros.naoLidas') },
  ]

  function marcarLida(id) {
    setLidas((a) => ({ ...a, [id]: true }))
    api.markNotificationRead(id).catch(() => {})
  }

  function marcarTodas() {
    const todas = {}
    ;(data || []).forEach((n) => { todas[n.id] = true })
    setLidas(todas)
    api.markAllNotificationsRead().catch(() => {})
  }

  const lista = (data || [])
    .filter((n) => !apagadas[n.id])
    .filter((n) => (filtro === 'nao-lidas' ? !(n.lida || lidas[n.id]) : true))
    .filter((n) => `${n.title} ${n.message}`.toLowerCase().includes(pesquisa.toLowerCase()))

  return (
    <div>
      <h1 className="mb-4 fs-2 fw-bold text-ink">{t('notificacoes.titulo')}</h1>

      {/* Filtros */}
      <div className="mb-4 d-flex flex-wrap align-items-center gap-3">
        <div className="d-flex rounded-3 bg-white p-1 border">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`btn btn-sm rounded-2 fw-medium ${
                filtro === f.key ? 'btn-brand' : 'btn-link text-muted text-decoration-none'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="position-relative flex-grow-1" style={{ maxWidth: '20rem' }}>
          <Search size={16} className="position-absolute text-secondary" style={{ left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder={t('notificacoes.pesquisar')}
            className="form-control"
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
        <button
          onClick={marcarTodas}
          className="btn btn-outline-secondary bg-white fw-medium"
        >
          {t('notificacoes.marcarTodas')}
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notificacoes.vazioTitulo')}
          description={t('notificacoes.vazioDesc')}
        />
      ) : (
        <div className="d-flex flex-column gap-2">
          {lista.map((n) => {
            const tag = TAGS[n.type] || TAGS.info
            const lida = n.lida || lidas[n.id]
            return (
              <div
                key={n.id}
                onClick={() => marcarLida(n.id)}
                className={`d-flex cursor-pointer align-items-start gap-3 rounded-3 border p-3 ${
                  lida ? 'bg-light' : 'bg-white border-brand border-opacity-25'
                }`}
              >
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`rounded-1 px-2 py-1 fw-bold ${tag.cls}`} style={{ fontSize: '0.625rem' }}>{tag.label}</span>
                    <p className="fw-semibold text-ink mb-0">{n.title}</p>
                    {!lida && <span className="rounded-circle bg-brand" style={{ height: '0.5rem', width: '0.5rem' }} />}
                  </div>
                  <p className="mt-1 small text-muted mb-0">{n.message}</p>
                  <p className="mt-2 d-flex align-items-center gap-1 fs-xs text-secondary mb-0">
                    <Calendar size={12} /> {formatar(n.createdAt, currentLocale)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setApagadas((a) => ({ ...a, [n.id]: true }))
                  }}
                  className="btn btn-link p-0 text-secondary"
                  aria-label={t('notificacoes.apagar')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
