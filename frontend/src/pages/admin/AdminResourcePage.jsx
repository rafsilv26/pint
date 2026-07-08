import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, Button } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { getAdminResources } from '../../config/adminResources'; 
import { useTranslation } from 'react-i18next';

export default function AdminResourcePage({ resourceKey, readOnly = false }) {
  const { t } = useTranslation();
  
  const allResources = getAdminResources(t);
  const cfg = allResources[resourceKey];
  const { data, loading, error, reload } = useAsync(() => api.listResource(cfg.resource), [resourceKey])

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [erroForm, setErroForm] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [erroDelete, setErroDelete] = useState(null) 

  // Estado para guardar as opções dos dropdowns (ex: listas de Learning Paths)
  const [dropdownOptions, setDropdownOptions] = useState({})

  const rows = data || []

  // EFEITO MÁGICO: Carrega as opções dos dropdowns automaticamente da API
  useEffect(() => {
      async function loadOptions() {
        const newOptions = {}
        for (const f of cfg.campos) {
          if (f.type === 'select' && f.optionsResource) {
            try {
              const res = await api.listResource(f.optionsResource)
              newOptions[f.key] = res.map(item => ({
                value: item.id,
                
                // A MAGIA NOVA ESTÁ AQUI:
                // Se a configuração tiver um 'optionLabel' feito por nós, usa-o.
                // Caso contrário, tenta adivinhar o nome como fazia antes.
                label: f.optionLabel 
                  ? f.optionLabel(item) 
                  : (item.nome || item.titulo || item.title || `ID: ${item.id}`)
                  
              }))
            } catch (err) {
              console.error(`Erro ao carregar opções para ${f.key}:`, err)
            }
          }
        }
        setDropdownOptions(newOptions)
      }
      loadOptions()
    }, [resourceKey])

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
      console.log("ERRO COMPLETO DA API:", err);
      setErroForm(err.response?.data?.message || err.message || "Erro ao guardar")
    } finally {
      setSaving(false)
    }
  }

  async function apagar() {
    setErroDelete(null)
    try {
      await api.deleteResource(cfg.resource, confirmar.id)
      setConfirmar(null)
      reload()
    } catch (err) {
      console.error("ERRO COMPLETO AO APAGAR:", err);
      setErroDelete(err.response?.data?.message || err.message || "Não foi possível eliminar este registo.")
    }
  }

  const tituloTraduzido = t(cfg.titulo)
  const singularTraduzido = t(cfg.singular)

  return (
    <div>
      <PageHeader
        title={tituloTraduzido}
        action={readOnly ? null : (
          <Button onClick={() => abrir(null)}>
            <Plus size={16} /> {t('adminResource.adicionar', { singular: singularTraduzido })}
          </Button>
        )}
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><Spinner /></div>
        ) : error ? (
          <div className="p-6"><ErrorState onRetry={reload} /></div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState 
              title={t('adminResource.semRegistos', { titulo: tituloTraduzido.toLowerCase() })} 
              description={t('adminResource.adicionaPrimeiro')} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-muted">
                <tr>
                  {cfg.colunas.map((c) => <th key={c.key} className="px-4 py-3">{t(c.label)}</th>)}
                  {!readOnly && <th className="px-4 py-3 text-right">{t('adminResource.acoes')}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    {cfg.colunas.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3 text-ink">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                    {!readOnly && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => abrir(r)} className="text-muted hover:text-brand" aria-label="Editar"><Pencil size={16} /></button>
                          <button onClick={() => { setConfirmar(r); setErroDelete(null); }} className="text-muted hover:text-red-600" aria-label="Eliminar"><Trash2 size={16} /></button>
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

      {/* MODAL ADICIONAR/EDITAR */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={guardar} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">
              {editing.id 
                ? t('adminResource.editar', { singular: singularTraduzido }) 
                : t('adminResource.adicionar', { singular: singularTraduzido })
              }
            </h2>
            {erroForm && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroForm}</div>}
            
            <div className="space-y-3">
              {cfg.campos.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">{t(f.label)}</span>
                  
                  {/* === LÓGICA DO DROPDOWN (SELECT) === */}
                  {f.type === 'select' ? (
                    <select
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value ? Number(e.target.value) : null })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 bg-white"
                      required={!f.optional}
                    >
                      <option value="">Selecione uma opção...</option>
                      {(f.options || dropdownOptions[f.key] || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                  /* === LÓGICA DA TEXTAREA === */
                  ) : f.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      required={!f.optional}
                    />
                    
                  /* === LÓGICA DO INPUT NORMAL === */
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      required={!f.optional}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={fechar}>{t('adminResource.cancelar')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('adminResource.guardando') : t('adminResource.guardar')}</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <p className="mt-3 font-semibold text-ink">{t('adminResource.eliminarTitulo')}</p>
            <p className="mt-1 text-sm text-muted">{t('adminResource.eliminarAviso')}</p>
            
            {erroDelete && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {erroDelete}
              </div>
            )}

            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => { setConfirmar(null); setErroDelete(null); }}>{t('adminResource.cancelar')}</Button>
              <button onClick={apagar} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                {t('adminResource.eliminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}