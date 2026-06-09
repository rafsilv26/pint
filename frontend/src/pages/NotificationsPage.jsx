import { useState } from 'react'
import { Bell, Calendar, Trash2, Search } from 'lucide-react'
import { Spinner, EmptyState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const TAGS = {
  info: { label: 'INFO', cls: 'bg-blue-100 text-blue-700' },
  warning: { label: 'AVISO', cls: 'bg-amber-100 text-amber-700' },
  success: { label: 'SUCESSO', cls: 'bg-green-100 text-green-700' },
}

function formatar(dt) {
  return new Date(dt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function NotificationsPage() {
  const { data, loading } = useAsync(() => api.getNotificacoes())
  const [filtro, setFiltro] = useState('todas')
  const [pesquisa, setPesquisa] = useState('')
  const [lidas, setLidas] = useState({})
  const [apagadas, setApagadas] = useState({})

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
      <h1 className="mb-4 text-2xl font-bold text-ink">Notificações</h1>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-gray-200">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'nao-lidas', label: 'Não lidas' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filtro === t.key ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Procurar…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={marcarTodas}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          Marcar todas como lidas
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : lista.length === 0 ? (
        <EmptyState icon={Bell} title="Sem notificações" description="Estás em dia! 🎉" />
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
                    <Calendar size={12} /> {formatar(n.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setApagadas((a) => ({ ...a, [n.id]: true }))
                  }}
                  className="text-gray-300 transition hover:text-red-600"
                  aria-label="Apagar"
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
