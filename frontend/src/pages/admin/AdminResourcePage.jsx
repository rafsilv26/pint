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
  const [dropdownOptions, setDropdownOptions] = useState({})

  const rows = data || []

  // Função auxiliar para detetar a chave primária real
  const getPrimaryKey = (row) =>
    row?.policyId ?? row?.noticeId ?? row?.infoId ?? row?.areaId ?? row?.id ?? null;

  useEffect(() => {
    async function loadOptions() {
      const newOptions = {}
      
      let areasMap = {};
      try {
        const areas = await api.listResource('areas');
        areas.forEach(a => areasMap[a.id] = a.nome);
      } catch (e) { console.error("Erro ao carregar áreas para dropdown"); }

      for (const f of cfg.campos) {
        if (f.type === 'select' && f.optionsResource) {
          try {
            const res = await api.listResource(f.optionsResource);
            newOptions[f.key] = res.map(item => ({
              value: item.id ?? item.policyId ?? item.areaId,
              label: f.optionLabel ? f.optionLabel(item, areasMap) : (item.nome || item.titulo || item.title || `ID: ${item.id}`)
            }));
          } catch (err) { console.error(`Erro ao carregar opções para ${f.key}:`, err); }
        }
      }
      setDropdownOptions(newOptions);
    }
    loadOptions();
  }, [resourceKey, cfg.campos]);

  function abrir(row) {
    const id = row ? getPrimaryKey(row) : null;
    setEditing(row ? { ...row, id } : {})
    setForm(row ? { ...row } : {})
    setErroForm(null)
  }
  
  function fechar() { setEditing(null); setForm({}); }

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
      const msg = err.response?.data?.details || err.response?.data?.message || err.message;
      setErroForm(msg);
    } finally { setSaving(false) }
  }

  async function apagar() {
    setErroDelete(null)
    try {
      await api.deleteResource(cfg.resource, confirmar.id)
      setConfirmar(null)
      reload()
    } catch (err) {
      setErroDelete(t('adminResource.erroEliminar'))
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
        {loading ? <div className="p-6"><Spinner /></div> : error ? <div className="p-6"><ErrorState onRetry={reload} /></div> : rows.length === 0 ? (
          <div className="p-6"><EmptyState title={t('adminResource.semRegistos', { titulo: tituloTraduzido.toLowerCase() })} description={t('adminResource.adicionaPrimeiro')} /></div>
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
                  <tr key={getPrimaryKey(r)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    {cfg.colunas.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3 text-ink">{String(r[c.key] ?? '—')}</td>
                    ))}
                    {!readOnly && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => abrir(r)} className="mr-3 text-muted hover:text-brand"><Pencil size={16} /></button>
                        <button onClick={() => setConfirmar({ id: getPrimaryKey(r) })} className="text-muted hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={guardar} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing.id ? t('adminResource.editar', { singular: singularTraduzido }) : t('adminResource.adicionar', { singular: singularTraduzido })}</h2>
            {erroForm && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroForm}</div>}
            {cfg.campos.map((f) => (
              <label key={f.key} className="block mb-3">
                <span className="block text-sm font-medium mb-1">{t(f.label)}</span>
                {f.type === 'select' ? (
                  <select value={form[f.key] ?? ''} onChange={(e) => setForm({...form, [f.key]: e.target.value})} className="w-full border p-2 rounded-lg">
                    <option value="">{t('adminResource.selecione')}</option>
                    {(f.options || dropdownOptions[f.key] || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({...form, [f.key]: e.target.value})} className="w-full border p-2 rounded-lg" />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={fechar}>{t('adminResource.cancelar')}</Button>
              <Button type="submit">{saving ? t('adminResource.guardando') : t('adminResource.guardar')}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center">
            <p>{t('adminResource.eliminarTitulo')}</p>
            <p className="text-sm text-muted mt-1">{t('adminResource.eliminarAviso')}</p>
            {erroDelete && <p className="text-red-600 text-sm mt-2">{erroDelete}</p>}
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="secondary" onClick={() => setConfirmar(null)}>{t('adminResource.cancelar')}</Button>
              <button onClick={apagar} className="bg-red-600 text-white px-4 py-2 rounded-lg">{t('adminResource.eliminar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}