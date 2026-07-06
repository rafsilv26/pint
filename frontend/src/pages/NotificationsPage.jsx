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
    info: { label: t('notificacoes.tags.info'), cls: 'bg-blue-100 text-blue-700' },
    warning: { label: t('notificacoes.tags.aviso'), cls: 'bg-amber-100 text-amber-700' },
    success: { label: t('notificacoes.tags.sucesso'), cls: 'bg-green-100 text-green-700' },
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
      <h1 className="mb-4 text-2xl font-bold text-ink">{t('notificacoes.titulo')}</h1>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-gray-200">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filtro === f.key ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder={t('notificacoes.pesquisar')}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={marcarTodas}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-muted transition hover:text-ink"
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
        <div className="space-y-3">
          {lista.map((n) => {
            const tag = TAGS[n.type] || TAGS.info
            const lida = n.lida || lidas[n.id]
            return (
              <div
                key={n.id}
                onClick={() => marcarLida(n.id)}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition hover:shadow-sm ${
                  lida ? 'border-gray-200 bg-gray-50' : 'border-brand/30 bg-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tag.cls}`}>{tag.label}</span>
                    <p className="font-semibold text-ink">{n.title}</p>
                    {!lida && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.message}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} /> {formatar(n.createdAt, currentLocale)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setApagadas((a) => ({ ...a, [n.id]: true }))
                  }}
                  className="text-gray-300 transition hover:text-red-600"
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