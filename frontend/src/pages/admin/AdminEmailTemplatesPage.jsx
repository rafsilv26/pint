import { useState } from 'react'
import { Mail, Save, RotateCcw, Send, Eye, ChevronRight } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

// Gestão real de templates de email (guião — bónus Consultor 23 / req. Admin 7):
// o Admin edita o assunto e o corpo de cada tipo de email da plataforma, com
// pré-visualização e envio de teste. Repor volta ao template padrão do código.
export default function AdminEmailTemplatesPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.getEmailTemplates())

  const [selecionado, setSelecionado] = useState(null)
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState('')
  const [mensagem, setMensagem] = useState(null)

  const templates = data || []
  const template = templates.find((tpl) => tpl.code === selecionado) || null

  function abrir(tpl) {
    setSelecionado(tpl.code)
    setAssunto(tpl.assunto)
    setCorpo(tpl.corpo)
    setPreview(null)
    setMensagem(null)
  }

  const alterado = template && (assunto !== template.assunto || corpo !== template.corpo)

  async function executar(acao, fn) {
    setBusy(acao)
    setMensagem(null)
    try {
      const resultado = await fn()
      return resultado
    } catch (err) {
      setMensagem({ ok: false, texto: err.message })
      return null
    } finally {
      setBusy('')
    }
  }

  async function guardar() {
    const r = await executar('guardar', () => api.saveEmailTemplate(template.code, { assunto, corpo }))
    if (r) {
      setMensagem({ ok: true, texto: t('adminEmailTemplates.guardado') })
      reload()
    }
  }

  async function repor() {
    const r = await executar('repor', () => api.resetEmailTemplate(template.code))
    if (r) {
      setAssunto(r.assunto)
      setCorpo(r.corpo)
      setPreview(null)
      setMensagem({ ok: true, texto: t('adminEmailTemplates.reposto') })
      reload()
    }
  }

  async function preVisualizar() {
    const r = await executar('preview', () => api.previewEmailTemplate(template.code, { assunto, corpo }))
    if (r) setPreview(r)
  }

  async function enviarTeste() {
    const r = await executar('teste', () => api.testEmailTemplate(template.code))
    if (r) setMensagem({ ok: true, texto: t('adminEmailTemplates.testeEnviado', { para: r.para }) })
  }

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div>
      <PageHeader title={t('adminEmailTemplates.titulo')} subtitle={t('adminEmailTemplates.subtitulo')} />

      <div className="row g-4">
        <div className="col-lg-4">
          <Card className="p-0 overflow-hidden">
            {templates.map((tpl) => (
              <button
                key={tpl.code}
                onClick={() => abrir(tpl)}
                className={`w-100 border-0 border-bottom text-start d-flex align-items-center gap-2 px-3 py-3 ${tpl.code === selecionado ? 'bg-brand-light' : 'bg-white'}`}
              >
                <Mail size={16} className="text-brand flex-shrink-0" />
                <span className="flex-grow-1 min-w-0">
                  <span className="d-block small fw-semibold text-ink text-truncate">{tpl.nome}</span>
                  <span className={`d-block fs-xs ${tpl.personalizado ? 'text-brand fw-semibold' : 'text-muted'}`}>
                    {tpl.personalizado ? t('adminEmailTemplates.personalizado') : t('adminEmailTemplates.padrao')}
                  </span>
                </span>
                <ChevronRight size={14} className="text-muted flex-shrink-0" />
              </button>
            ))}
          </Card>
        </div>

        <div className="col-lg-8">
          {!template ? (
            <Card>
              <p className="small text-muted mb-0">{t('adminEmailTemplates.escolhe')}</p>
            </Card>
          ) : (
            <Card>
              <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-1">
                <h2 className="h6 fw-bold mb-0">{template.nome}</h2>
                {template.personalizado && <span className="badge rounded-pill text-bg-info">{t('adminEmailTemplates.personalizado')}</span>}
              </div>
              <p className="fs-xs text-muted mb-3">{template.descricao}</p>

              <label className="d-block mb-3">
                <span className="mb-1 d-block small fw-medium text-ink">{t('adminEmailTemplates.assunto')}</span>
                <input value={assunto} onChange={(e) => setAssunto(e.target.value)} className="form-control" />
              </label>

              <label className="d-block mb-2">
                <span className="mb-1 d-block small fw-medium text-ink">{t('adminEmailTemplates.corpo')}</span>
                <textarea rows={10} value={corpo} onChange={(e) => setCorpo(e.target.value)} className="form-control font-monospace" style={{ fontSize: '0.8rem' }} />
              </label>

              <div className="mb-3">
                <span className="d-block fs-xs fw-medium text-muted mb-1">{t('adminEmailTemplates.variaveis')}</span>
                <div className="d-flex flex-wrap gap-1">
                  {Object.entries(template.variaveis || {}).map(([nome, desc]) => (
                    <code key={nome} title={desc} className="rounded-2 bg-light border px-2 py-1 fs-xs">{`{{${nome}}}`}</code>
                  ))}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 border-top pt-3">
                <button onClick={guardar} disabled={busy !== '' || !alterado || !assunto.trim() || !corpo.trim()} className="btn btn-brand btn-sm d-inline-flex align-items-center gap-1">
                  <Save size={14} /> {busy === 'guardar' ? t('adminEmailTemplates.aGuardar') : t('adminEmailTemplates.guardar')}
                </button>
                <button onClick={preVisualizar} disabled={busy !== ''} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-1">
                  <Eye size={14} /> {t('adminEmailTemplates.preVisualizar')}
                </button>
                <button onClick={enviarTeste} disabled={busy !== ''} className="btn btn-outline-secondary bg-white btn-sm d-inline-flex align-items-center gap-1">
                  <Send size={14} /> {busy === 'teste' ? t('adminEmailTemplates.aEnviar') : t('adminEmailTemplates.enviarTeste')}
                </button>
                {template.personalizado && (
                  <button onClick={repor} disabled={busy !== ''} className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 ms-auto">
                    <RotateCcw size={14} /> {t('adminEmailTemplates.repor')}
                  </button>
                )}
              </div>

              {mensagem && (
                <p className={`mt-3 mb-0 rounded-3 px-3 py-2 small ${mensagem.ok ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger'}`}>
                  {mensagem.texto}
                </p>
              )}

              {preview && (
                <div className="mt-3 border-top pt-3">
                  <p className="small fw-medium text-ink mb-1">{t('adminEmailTemplates.previewAssunto')}: <span className="fw-normal">{preview.assunto}</span></p>
                  <iframe
                    title={t('adminEmailTemplates.previewTitulo')}
                    srcDoc={preview.html}
                    sandbox=""
                    className="w-100 rounded-3 border"
                    style={{ height: '24rem', backgroundColor: 'white' }}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
