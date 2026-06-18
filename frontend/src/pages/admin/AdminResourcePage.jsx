import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, Button } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { ADMIN_RESOURCES } from '../../config/adminResources'

// Página genérica de gestão (lista + adicionar/editar + eliminar) para os
// recursos do catálogo. Configurada por ADMIN_RESOURCES[resourceKey].
export default function AdminResourcePage({ resourceKey, readOnly = false }) {
  const cfg = ADMIN_RESOURCES[resourceKey]
  const { data, loading, error, reload } = useAsync(() => api.listResource(cfg.resource), [resourceKey])

  const [editing, setEditing] = useState(null) // row em edição, ou {} para novo
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [confirmar, setConfirmar] = useState(null) // row a eliminar

  const rows = data || []

  function abrir(row) {
    setEditing(row || {})
    setForm(row ? { ...row } : {})
    setErroForm(null)
  }
  function fechar() {
    setEditing(null)
    setForm({})
  }

  async function guardar(e) {
    e.preventDefault()
    setSaving(true)
    setErroForm(null)
    try {
      if (editing?.id) await api.updateResource(cfg.resource, editing.id, form)
      else await api.createResource(cfg.resource, form)
      fechar()
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function apagar() {
    try {
      await api.deleteResource(cfg.resource, confirmar.id)
    } finally {
      setConfirmar(null)
      reload()
    }
  }

  return (
    <div>
      <PageHeader
        title={cfg.titulo}
        action={readOnly ? null : <Button onClick={() => abrir(null)}><Plus size={16} /> Adicionar {cfg.singular}</Button>}
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><Spinner /></div>
        ) : error ? (
          <div className="p-6"><ErrorState onRetry={reload} /></div>
        ) : rows.length === 0 ? (
          <div className="p-6"><EmptyState title={`Sem ${cfg.titulo.toLowerCase()}`} description="Adiciona o primeiro registo." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  {cfg.colunas.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
                  {!readOnly && <th className="px-4 py-3 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    {cfg.colunas.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3 text-ink">{String(r[c.key] ?? '—')}</td>
                    ))}
                    {!readOnly && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => abrir(r)} className="text-muted hover:text-brand" aria-label="Editar"><Pencil size={16} /></button>
                          <button onClick={() => setConfirmar(r)} className="text-muted hover:text-red-600" aria-label="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal adicionar/editar */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={guardar} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">
              {editing.id ? `Editar ${cfg.singular}` : `Adicionar ${cfg.singular}`}
            </h2>
            {erroForm && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroForm}</div>}
            <div className="space-y-3">
              {cfg.campos.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">{f.label}</span>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={fechar}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmar eliminação */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <p className="mt-3 font-semibold text-ink">Eliminar registo?</p>
            <p className="mt-1 text-sm text-muted">Esta ação não pode ser desfeita.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setConfirmar(null)}>Cancelar</Button>
              <button onClick={apagar} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
