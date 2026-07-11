import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, Button } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function AdminUsersPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { data, loading, error, reload } = useAsync(() => api.getUsers())
  const { data: serviceLines } = useAsync(() => api.listResource('service-lines'))
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const rows = data || []
  const serviceLineOptions = serviceLines || []

  // Lista de Roles movida para dentro para suportar traduções
  const ROLES = [
    { value: 'Consultor', label: t('adminUsers.roles.consultor') },
    { value: 'TalentManager', label: t('adminUsers.roles.talentManager') },
    { value: 'ServiceLineLeader', label: t('adminUsers.roles.serviceLineLeader') },
    { value: 'Admin', label: t('adminUsers.roles.admin') },
  ]
  const roleLabel = (r) => (ROLES.find((x) => x.value === r)?.label || r)

  function abrir(u) {
    setEditing(u || {})
    setForm(u
      ? { nome: u.nome, email: u.email, role: (u.roles || [])[0] || 'Consultor', ativo: u.ativo, serviceLineId: u.serviceLineId || '' }
      : { nome: '', email: '', password: '', role: 'Consultor', serviceLineId: '' })
    setErroForm(null)
  }
  function fechar() { setEditing(null); setForm({}) }

  async function guardar(e) {
    e.preventDefault()
    if (form.role === 'ServiceLineLeader' && !form.serviceLineId) {
      setErroForm(t('adminUsers.modal.serviceLineObrigatoria'))
      return
    }
    setSaving(true)
    setErroForm(null)
    try {
      const serviceLineId = form.role === 'ServiceLineLeader' ? Number(form.serviceLineId) : undefined
      if (editing?.id) {
        await api.updateUser(editing.id, { nome: form.nome, email: form.email, roles: [form.role], ativo: form.ativo, serviceLineId })
      } else {
        await api.createUser({ nome: form.nome, email: form.email, password: form.password, roles: [form.role], serviceLineId })
      }
      fechar()
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function apagar() {
    try { await api.deleteUser(confirmar.id) } finally { setConfirmar(null); reload() }
  }

  return (
    <div>
      <PageHeader
        title={t('adminUsers.titulo')}
        action={
          <div className="flex gap-2">
            <ExportButtons data={rows} />
            <Button onClick={() => abrir(null)}><Plus size={16} /> {t('adminUsers.adicionar')}</Button>
          </div>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><Spinner /></div>
        ) : error ? (
          <div className="p-6"><ErrorState onRetry={reload} /></div>
        ) : rows.length === 0 ? (
          <div className="p-6"><EmptyState title={t('adminUsers.vazioTitulo')} description={t('adminUsers.vazioDesc')} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">{t('adminUsers.tabela.nome')}</th>
                  <th className="px-4 py-3">{t('adminUsers.tabela.email')}</th>
                  <th className="px-4 py-3">{t('adminUsers.tabela.papel')}</th>
                  <th className="px-4 py-3">{t('adminUsers.tabela.estado')}</th>
                  <th className="px-4 py-3 text-right">{t('adminUsers.tabela.acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{u.nome}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3 text-ink">{(u.roles || []).map(roleLabel).join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      {u.ativo
                        ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t('adminUsers.estado.ativo')}</span>
                        : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t('adminUsers.estado.inativo')}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => abrir(u)} className="text-muted hover:text-brand" aria-label={t('adminUsers.ariaEditar')}><Pencil size={16} /></button>
                        <button onClick={() => setConfirmar(u)} className="text-muted hover:text-red-600" aria-label={t('adminUsers.ariaDesativar')}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={guardar} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">{editing.id ? t('adminUsers.modal.editar') : t('adminUsers.modal.adicionar')}</h2>
            {erroForm && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroForm}</div>}
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">{t('adminUsers.modal.nome')}</span>
                <input value={form.nome || ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">{t('adminUsers.modal.email')}</span>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </label>
              {!editing.id && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">{t('adminUsers.modal.password')}</span>
                  <input value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">{t('adminUsers.modal.papel')}</span>
                <select value={form.role || 'Consultor'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              {form.role === 'ServiceLineLeader' && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">{t('adminUsers.modal.serviceLine')}</span>
                  <select
                    value={form.serviceLineId || ''}
                    onChange={(e) => setForm({ ...form, serviceLineId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    <option value="">{t('adminUsers.modal.serviceLineEscolher')}</option>
                    {serviceLineOptions.map((sl) => <option key={sl.id} value={sl.id}>{sl.nome}</option>)}
                  </select>
                </label>
              )}
              {editing.id && (
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> {t('adminUsers.modal.ativo')}
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={fechar}>{t('adminUsers.modal.cancelar')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('adminUsers.modal.guardando') : t('adminUsers.modal.guardar')}</Button>
            </div>
          </form>
        </div>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <p className="mt-3 font-semibold text-ink">{t('adminUsers.desativar.titulo', { nome: confirmar.nome })}</p>
            <p className="mt-1 text-sm text-muted">{t('adminUsers.desativar.desc')}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setConfirmar(null)}>{t('adminUsers.modal.cancelar')}</Button>
              <button onClick={apagar} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">{t('adminUsers.desativar.botao')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}