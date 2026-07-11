import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, EmptyState, Button } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { getAdminResources } from '../../config/adminResources';
import { useTranslation } from 'react-i18next';

export default function AdminResourcePage({ resourceKey, readOnly = false, variants = null }) {
  const { t } = useTranslation();

  const allResources = getAdminResources(t);
  const [activeKey, setActiveKey] = useState(resourceKey)
  const cfg = allResources[activeKey]
  const { data, loading, error, reload } = useAsync(() => api.listResource(cfg.resource), [activeKey])

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
    row?.policyId ?? row?.noticeId ?? row?.infoId ?? row?.areaId ?? row?.badgePremiumId ?? row?.id ?? null;

  useEffect(() => {
    async function loadOptions() {
      const newOptions = {}

      let areasMap = {};
      try {
        const areas = await api.listResource('areas');
        areas.forEach(a => areasMap[a.id] = a.nome);
      } catch { console.error("Erro ao carregar áreas para dropdown"); }

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
        // Carregar a lista de consultores (utilizadores com o perfil Consultor)
        // para o seletor de destinatário dos avisos.
        if (f.type === 'select' && f.optionsLoader === 'consultores') {
          try {
            const users = await api.getUsers();
            newOptions[f.key] = (users || [])
              .filter(u => (u.roles || []).includes('Consultor'))
              .map(u => ({ value: u.id, label: u.email ? `${u.nome} (${u.email})` : u.nome }));
          } catch (err) { console.error('Erro ao carregar consultores para dropdown:', err); }
        }
      }
      setDropdownOptions(newOptions);
    }
    loadOptions();
  }, [activeKey, cfg.campos]);

  function trocarVariante(key) {
    if (key === activeKey) return
    setActiveKey(key)
    setEditing(null)
    setForm({})
    setErroForm(null)
    setConfirmar(null)
    setErroDelete(null)
  }

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
      // Campos de data vazios seguem como null (string vazia rebenta na BD)
      const payload = { ...form }
      cfg.campos.forEach((f) => {
        if (f.type === 'date' && payload[f.key] === '') payload[f.key] = null
      })
      if (editing?.id) await api.updateResource(cfg.resource, editing.id, payload)
      else await api.createResource(cfg.resource, payload)
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
    } catch {
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

      {variants && variants.length > 1 && (
        <div className="d-inline-flex rounded-3 bg-white p-1 border mb-3">
          {variants.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => trocarVariante(v.key)}
              className={`btn btn-sm rounded-2 fw-medium ${activeKey === v.key ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-4"><Spinner /></div> : error ? <div className="p-4"><ErrorState onRetry={reload} /></div> : rows.length === 0 ? (
          <div className="p-4"><EmptyState title={t('adminResource.semRegistos', { titulo: tituloTraduzido.toLowerCase() })} description={t('adminResource.adicionaPrimeiro')} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr className="fs-xs fw-medium text-muted">
                  {cfg.colunas.map((c) => <th key={c.key} className="px-3 py-2">{t(c.label)}</th>)}
                  {!readOnly && <th className="px-3 py-2 text-end">{t('adminResource.acoes')}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={getPrimaryKey(r)}>
                    {cfg.colunas.map((c) => {
                      let valor = r[c.key]
                      if (typeof valor === 'boolean') {
                        return (
                          <td key={c.key} className="px-3 py-2">
                            <span className={`badge rounded-pill ${valor ? 'text-bg-success' : 'text-bg-secondary'}`}>
                              {valor ? 'Sim' : 'Não'}
                            </span>
                          </td>
                        )
                      }
                      // Datas da BD (ISO) mostradas em formato local
                      if (c.type === 'date' && valor) {
                        valor = new Date(valor).toLocaleDateString()
                      }
                      // Se a coluna corresponde a um campo select com opções carregadas
                      // (ex: userId -> nome do consultor), mostra o label em vez do id.
                      const opcoes = dropdownOptions[c.key]
                      if (opcoes && valor != null) {
                        valor = opcoes.find((o) => String(o.value) === String(valor))?.label ?? valor
                      }
                      return (
                        <td key={c.key} className="text-truncate px-3 py-2 text-ink" style={{ maxWidth: '20rem' }}>
                          {String(valor ?? '—')}
                        </td>
                      )
                    })}
                    {!readOnly && (
                      <td className="px-3 py-2 text-end">
                        <button onClick={() => abrir(r)} className="btn btn-link p-0 me-3 text-muted"><Pencil size={16} /></button>
                        <button onClick={() => setConfirmar({ id: getPrimaryKey(r) })} className="btn btn-link p-0 text-muted"><Trash2 size={16} /></button>
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
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <form onSubmit={guardar} className="w-100 rounded-4 bg-white p-4 shadow-lg" style={{ maxWidth: '32rem' }}>
            <h2 className="mb-3 fs-5 fw-bold">{editing.id ? t('adminResource.editar', { singular: singularTraduzido }) : t('adminResource.adicionar', { singular: singularTraduzido })}</h2>
            {erroForm && <div className="mb-3 rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erroForm}</div>}
            {cfg.campos.map((f) => (
              <label key={f.key} className="d-block mb-3">
                <span className="d-block small fw-medium mb-1">{t(f.label)}</span>
                {f.type === 'select' ? (
                  <select value={form[f.key] ?? ''} onChange={(e) => setForm({...form, [f.key]: e.target.value})} className="form-select">
                    <option value="">{t('adminResource.selecione')}</option>
                    {f.allOption && <option value="__ALL__">{f.allOption}</option>}
                    {(f.options || dropdownOptions[f.key] || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={f.type === 'date' ? String(form[f.key] ?? '').substring(0, 10) : (form[f.key] ?? '')}
                    onChange={(e) => setForm({...form, [f.key]: e.target.value})}
                    className="form-control"
                  />
                )}
              </label>
            ))}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={fechar}>{t('adminResource.cancelar')}</Button>
              <Button type="submit">{saving ? t('adminResource.guardando') : t('adminResource.guardar')}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmar && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white p-4 rounded-4 w-100 text-center" style={{ maxWidth: '24rem' }}>
            <p>{t('adminResource.eliminarTitulo')}</p>
            <p className="small text-muted mt-1">{t('adminResource.eliminarAviso')}</p>
            {erroDelete && <p className="text-danger small mt-2">{erroDelete}</p>}
            <div className="d-flex justify-content-center gap-2 mt-3">
              <Button variant="secondary" onClick={() => setConfirmar(null)}>{t('adminResource.cancelar')}</Button>
              <button onClick={apagar} className="btn btn-danger px-4 py-2">{t('adminResource.eliminar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
