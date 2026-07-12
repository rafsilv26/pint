import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, UploadCloud, Send, CheckCircle2, Info, Trash2,
  FileText, AlertTriangle, ClipboardCheck,
} from 'lucide-react'
import { Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

const TIPOS_ACEITES = ['application/pdf', 'image/jpeg', 'image/png']

export default function SubmitApplicationPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: badges, loading, error, reload } = useAsync(() => api.getBadges())

  const [badgeId, setBadgeId] = useState(searchParams.get('badge') || '')
  // Evidências anexadas, indexadas pelo id do requisito: { [requisitoId]: File }
  const [evidencias, setEvidencias] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erroSubmit, setErroSubmit] = useState(null)
  const [erroFicheiro, setErroFicheiro] = useState('')

  // Requisitos do nível do badge selecionado
  const { data: badgeDetalhe, loading: loadingBadge } = useAsync(
    () => (badgeId ? api.getBadge(badgeId) : Promise.resolve(null)),
    [badgeId]
  )
  const requisitos = badgeDetalhe?.requisitos || []
  const obrigatorios = requisitos.filter((r) => r.obrigatorio !== false)
  const obrigatoriosFeitos = obrigatorios.filter((r) => evidencias[r.id]).length
  const podeSubmeter =
    requisitos.length > 0 && obrigatorios.every((r) => evidencias[r.id]) && Object.keys(evidencias).length > 0

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />

  function anexar(requisitoId, file) {
    setErroFicheiro('')
    if (!file) return
    if (!TIPOS_ACEITES.includes(file.type)) {
      setErroFicheiro(t('submeterCandidatura.erroFicheiroTipo'))
      return
    }
    setEvidencias((atual) => ({ ...atual, [requisitoId]: file }))
  }

  function remover(requisitoId) {
    setEvidencias((atual) => {
      const proximo = { ...atual }
      delete proximo[requisitoId]
      return proximo
    })
  }

  function trocarBadge(novo) {
    setBadgeId(novo)
    setEvidencias({})
    setErroSubmit(null)
    setErroFicheiro('')
  }

  async function submeter() {
    setEnviando(true)
    setErroSubmit(null)
    try {
      const ficheiros = Object.entries(evidencias).map(([requisitoId, file]) => ({
        requisitoId: Number(requisitoId),
        file,
      }))
      await api.submeterCandidatura({ badgeId: Number(badgeId), descricao: '', ficheiros })
      setSucesso(true)
      setTimeout(() => navigate('/candidaturas'), 1600)
    } catch (err) {
      setErroSubmit(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="mx-auto mt-5 rounded-4 border bg-white p-5 text-center shadow-sm" style={{ maxWidth: '28rem' }}>
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <h2 className="mt-3 fs-5 fw-bold text-ink">{t('submeterCandidatura.sucessoTitulo')}</h2>
        <p className="mt-1 small text-muted">{t('submeterCandidatura.sucessoDesc')}</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/catalogo" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('submeterCandidatura.voltar')}
      </Link>

      {/* Hero */}
      <div className="rounded-4 bg-gradient-brand p-4 text-white shadow-sm">
        <h1 className="d-flex align-items-center gap-2 fs-4 fw-bold mb-0">
          <ClipboardCheck size={22} /> {t('submeterCandidatura.tituloHero')}
        </h1>
        <div className="mt-2 d-flex flex-wrap align-items-center gap-2 small text-white">
          <span>{t('submeterCandidatura.badgeLabel')}</span>
          <select
            value={badgeId}
            onChange={(e) => trocarBadge(e.target.value)}
            className="form-select form-select-sm text-ink fw-medium border-0 shadow-sm"
            style={{ maxWidth: '20rem', width: 'auto' }}
          >
            <option value="">{t('submeterCandidatura.selecionaBadge')}</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>{b.nome}{b.nivel ? ` — ${b.nivel}` : ''}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 d-flex align-items-center gap-2 rounded-3 bg-white bg-opacity-10 px-3 py-2 fs-xs text-white-50 mb-0">
          <Info size={14} /> {t('submeterCandidatura.dicaHero')}
        </p>
      </div>

      {!badgeId ? (
        <div className="mt-4 rounded-4 border border-dashed bg-white p-5 text-center text-muted">
          {t('submeterCandidatura.semBadge')}
        </div>
      ) : loadingBadge ? (
        <div className="mt-4"><Spinner /></div>
      ) : (
        <div className="mt-4 row g-4">
          {/* Requisitos */}
          <div className="col-lg-8">
            <div className="rounded-4 border bg-white p-4 shadow-sm">
              <h2 className="d-flex align-items-center gap-2 fw-semibold text-ink mb-1">
                <ClipboardCheck size={18} className="text-brand" /> {t('submeterCandidatura.requisitosTitulo')}
              </h2>
              <p className="small text-muted">{t('submeterCandidatura.requisitosIntro')}</p>

              {requisitos.length === 0 ? (
                <div className="rounded-3 border border-warning-subtle bg-warning-subtle p-3 d-flex align-items-center gap-2 small text-warning-emphasis mb-0">
                  <AlertTriangle size={16} /> {t('submeterCandidatura.semRequisitos')}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {requisitos.map((req) => {
                    const file = evidencias[req.id]
                    const isObrigatorio = req.obrigatorio !== false
                    return (
                      <div key={req.id} className={`rounded-3 border p-3 ${file ? 'border-success border-opacity-50 bg-success-subtle bg-opacity-25' : ''}`}>
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="min-w-0">
                            <p className="fw-semibold text-ink mb-1 d-flex align-items-center gap-2">
                              {file && <CheckCircle2 size={16} className="text-success flex-shrink-0" />}
                              {req.titulo}
                            </p>
                            {req.descricao && <p className="small text-muted mb-0">{req.descricao}</p>}
                          </div>
                          <span className={`badge rounded-pill flex-shrink-0 ${isObrigatorio ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                            {isObrigatorio ? t('submeterCandidatura.obrigatorio') : t('submeterCandidatura.opcional')}
                          </span>
                        </div>

                        {file ? (
                          <div className="mt-3 d-flex align-items-center justify-content-between gap-2 rounded-3 bg-white border px-3 py-2 small">
                            <span className="d-flex align-items-center gap-2 min-w-0 text-ink">
                              <FileText size={15} className="text-brand flex-shrink-0" />
                              <span className="text-truncate">{file.name}</span>
                            </span>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                              <label className="btn btn-link btn-sm p-0 text-muted text-decoration-none">
                                {t('submeterCandidatura.trocar')}
                                <input type="file" className="d-none" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => anexar(req.id, e.target.files?.[0])} />
                              </label>
                              <button onClick={() => remover(req.id)} className="btn btn-link btn-sm p-0 text-danger" title={t('submeterCandidatura.remover')}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="mt-3 d-flex cursor-pointer align-items-center justify-content-center gap-2 rounded-3 border border-dashed py-3 small text-muted">
                            <UploadCloud size={18} /> {t('submeterCandidatura.anexar')}
                            <input type="file" className="d-none" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => anexar(req.id, e.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {erroFicheiro && <p className="mt-3 mb-0 fs-xs text-danger">{erroFicheiro}</p>}
              <p className="mt-3 mb-0 fs-xs text-secondary">{t('submeterCandidatura.suporta')}</p>
            </div>
          </div>

          {/* Resumo / submeter */}
          <div className="col-lg-4">
            <div className="rounded-4 border bg-white p-4 shadow-sm" style={{ position: 'sticky', top: '1rem' }}>
              <h2 className="fw-semibold text-ink mb-3">{t('submeterCandidatura.resumoTitulo')}</h2>

              {obrigatorios.length > 0 && (
                <>
                  <div className="d-flex justify-content-between align-items-center small text-muted mb-1">
                    <span>{t('submeterCandidatura.progresso', { feitos: obrigatoriosFeitos, total: obrigatorios.length })}</span>
                    <span className="fw-semibold text-ink">{Math.round((obrigatoriosFeitos / obrigatorios.length) * 100)}%</span>
                  </div>
                  <div className="progress mb-3" style={{ height: '0.5rem' }} role="progressbar" aria-valuenow={obrigatoriosFeitos} aria-valuemin={0} aria-valuemax={obrigatorios.length}>
                    <div className="progress-bar bg-brand" style={{ width: `${(obrigatoriosFeitos / obrigatorios.length) * 100}%` }} />
                  </div>
                </>
              )}

              <p className={`d-flex align-items-start gap-2 rounded-3 px-3 py-2 fs-xs mb-3 ${podeSubmeter ? 'bg-success-subtle text-success-emphasis' : 'bg-light text-muted'}`}>
                {podeSubmeter ? <CheckCircle2 size={14} className="flex-shrink-0 mt-1" /> : <Info size={14} className="flex-shrink-0 mt-1" />}
                {podeSubmeter ? t('submeterCandidatura.prontoSubmeter') : t('submeterCandidatura.avisoObrigatorios')}
              </p>

              {erroSubmit && <p className="rounded-3 bg-danger-subtle px-3 py-2 fs-xs text-danger">{erroSubmit}</p>}

              <button
                onClick={submeter}
                disabled={!podeSubmeter || enviando}
                className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <Send size={16} /> {enviando ? t('submeterCandidatura.botaoSubmetendo') : t('submeterCandidatura.botaoSubmeter')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
