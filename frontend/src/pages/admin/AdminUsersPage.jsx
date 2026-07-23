import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Search, Trash2 } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, Button } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import ExportButtons from '../../components/ExportButtons'
import { useTranslation } from 'react-i18next'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, loading, error, reload } = useAsync(() => api.getUsers())
  const { data: serviceLines } = useAsync(() => api.listResource('service-lines'))
  const { data: areas } = useAsync(() => api.listResource('areas'))
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const rows = data || []
  const search = searchParams.get('search') || ''
  const normalizedSearch = search.trim().toLowerCase()
  const filteredRows = normalizedSearch
    ? rows.filter((user) => `${user.nome} ${user.email} ${(user.roles || []).join(' ')}`.toLowerCase().includes(normalizedSearch))
    : rows
  const serviceLineOptions = serviceLines || []
  const areaOptions = areas || []

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
      ? { nome: u.nome, email: u.email, role: (u.roles || [])[0] || 'Consultor', ativo: u.ativo, serviceLineId: u.serviceLineId || '', areaId: u.areaId || '' }
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
        const areaId = form.role === 'Consultor' ? Number(form.areaId) : undefined
        await api.updateUser(editing.id, { nome: form.nome, email: form.email, roles: [form.role], ativo: form.ativo, serviceLineId, areaId })
      } else {
        const criado = await api.createUser({ nome: form.nome, email: form.email, password: form.password, roles: [form.role], serviceLineId })
        if (criado && criado.emailEnviado === false) {
          setErroForm(t('adminUsers.emailFalhou', { motivo: criado.emailErro || '—' }))
          setSaving(false)
          reload()
          return
        }
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
          <div className="d-flex gap-2">
            <ExportButtons data={filteredRows} />
            <Button onClick={() => abrir(null)}><Plus size={16} /> {t('adminUsers.adicionar')}</Button>
          </div>
        }
      />

      <div className="position-relative mb-4" style={{ maxWidth: '28rem' }}>
        <Search size={18} className="position-absolute text-secondary" style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(event) => setSearchParams(event.target.value ? { search: event.target.value } : {}, { replace: true })}
          placeholder={t('managerLayout.procurar')}
          className="form-control rounded-pill ps-5"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><ErrorState onRetry={reload} /></div>
        ) : filteredRows.length === 0 ? (
          <div className="p-4"><EmptyState title={t('adminUsers.vazioTitulo')} description={t('adminUsers.vazioDesc')} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  <th className="px-3 py-2">{t('adminUsers.tabela.nome')}</th>
                  <th className="px-3 py-2">{t('adminUsers.tabela.email')}</th>
                  <th className="px-3 py-2">{t('adminUsers.tabela.papel')}</th>
                  <th className="px-3 py-2">{t('adminUsers.tabela.estado')}</th>
                  <th className="px-3 py-2 text-end">{t('adminUsers.tabela.acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 fw-medium">
                      <Link to={`/admin/utilizadores/${u.id}`} className="text-brand text-decoration-none">{u.nome}</Link>
                    </td>
                    <td className="px-3 py-2 text-muted">{u.email}</td>
                    <td className="px-3 py-2 text-ink">{(u.roles || []).map(roleLabel).join(', ') || '—'}</td>
                    <td className="px-3 py-2">
                      {u.ativo
                        ? <span className="rounded-pill text-bg-success px-2 py-1 fs-xs fw-medium">{t('adminUsers.estado.ativo')}</span>
                        : <span className="rounded-pill text-bg-secondary px-2 py-1 fs-xs fw-medium">{t('adminUsers.estado.inativo')}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="d-flex justify-content-end gap-2">
                        <button onClick={() => abrir(u)} className="btn btn-link p-0 text-muted" aria-label={t('adminUsers.ariaEditar')}><Pencil size={16} /></button>
                        <button onClick={() => setConfirmar(u)} className="btn btn-link p-0 text-muted" aria-label={t('adminUsers.ariaDesativar')}><Trash2 size={16} /></button>
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
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <form onSubmit={guardar} className="w-100 rounded-4 bg-white p-4 shadow-lg" style={{ maxWidth: '32rem' }}>
            <h2 className="mb-3 fs-5 fw-bold text-ink">{editing.id ? t('adminUsers.modal.editar') : t('adminUsers.modal.adicionar')}</h2>
            {erroForm && <div className="mb-3 rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erroForm}</div>}
            <div className="d-flex flex-column gap-3">
              <label className="d-block">
                <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.nome')}</span>
                <input value={form.nome || ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="form-control" />
              </label>
              <label className="d-block">
                <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.email')}</span>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="form-control" />
              </label>
              {!editing.id && (
                <label className="d-block">
                  <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.password')}</span>
                  <input value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="form-control" />
                </label>
              )}
              <label className="d-block">
                <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.papel')}</span>
                <select value={form.role || 'Consultor'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-select">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              {form.role === 'ServiceLineLeader' && (
                <label className="d-block">
                  <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.serviceLine')}</span>
                  <select
                    value={form.serviceLineId || ''}
                    onChange={(e) => setForm({ ...form, serviceLineId: e.target.value })}
                    required
                    className="form-select"
                  >
                    <option value="">{t('adminUsers.modal.serviceLineEscolher')}</option>
                    {serviceLineOptions.map((sl) => <option key={sl.id} value={sl.id}>{sl.nome}</option>)}
                  </select>
                </label>
              )}
              {editing.id && form.role === 'Consultor' && (
                <label className="d-block">
                  <span className="mb-1 d-block small fw-medium text-ink">{t('adminUsers.modal.area')} <span className="text-muted fw-normal">({t('adminUsers.modal.areaOpcional')})</span></span>
                  <select
                    value={form.areaId || ''}
                    onChange={(e) => setForm({ ...form, areaId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">{t('adminUsers.modal.areaEscolher')}</option>
                    {areaOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </label>
              )}
              {editing.id && (
                <label className="d-flex align-items-center gap-2 small text-ink">
                  <input type="checkbox" className="form-check-input mt-0" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> {t('adminUsers.modal.ativo')}
                </label>
              )}
            </div>
            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button type="button" variant="secondary" onClick={fechar}>{t('adminUsers.modal.cancelar')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('adminUsers.modal.guardando') : t('adminUsers.modal.guardar')}</Button>
            </div>
          </form>
        </div>
      )}

      {confirmar && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-100 rounded-4 bg-white p-4 text-center shadow-lg" style={{ maxWidth: '24rem' }}>
            <Trash2 size={32} className="mx-auto text-danger" />
            <p className="mt-3 fw-semibold text-ink">{t('adminUsers.desativar.titulo', { nome: confirmar.nome })}</p>
            <p className="mt-1 small text-muted">{t('adminUsers.desativar.desc')}</p>
            <div className="mt-4 d-flex justify-content-center gap-2">
              <Button variant="secondary" onClick={() => setConfirmar(null)}>{t('adminUsers.modal.cancelar')}</Button>
              <button onClick={apagar} className="btn btn-danger fw-semibold">{t('adminUsers.desativar.botao')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
