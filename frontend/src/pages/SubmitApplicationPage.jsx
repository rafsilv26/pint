import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, UploadCloud, Send, CheckCircle2, Info, Trash2,
  FileText, AlertTriangle, ClipboardCheck, Save, Plus,
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

  const [evidencias, setEvidencias] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [okMsg, setOkMsg] = useState('')
  const [erroSubmit, setErroSubmit] = useState(null)
  const [erroFicheiro, setErroFicheiro] = useState('')

  const { data: badgeDetalhe, loading: loadingBadge } = useAsync(
    () => (badgeId ? api.getBadge(badgeId) : Promise.resolve(null)),
    [badgeId]
  )

  const { data: rascunho, reload: reloadRascunho } = useAsync(
    () => (badgeId ? api.getRascunho(badgeId) : Promise.resolve(null)),
    [badgeId]
  )

  const requisitos = badgeDetalhe?.requisitos || []
  const obrigatorios = requisitos.filter((r) => r.obrigatorio !== false)
  const submetida = rascunho?.estado === 'SUBMITTED'

  const existentesMap = {}
  ;(rascunho?.evidencias || []).forEach((e) => {
    ;(existentesMap[e.requisitoId] = existentesMap[e.requisitoId] || []).push(e)
  })

  const localArr = (id) => evidencias[id] || []
  const existArr = (id) => existentesMap[id] || []
  const coberto = (id) => localArr(id).length + existArr(id).length > 0
  const totalNovos = Object.values(evidencias).reduce((s, arr) => s + arr.length, 0)

  const obrigatoriosFeitos = obrigatorios.filter((r) => coberto(r.id)).length
  const podeSubmeter = !submetida && obrigatorios.length > 0 && obrigatorios.every((r) => coberto(r.id))
  const podeGuardar = totalNovos > 0

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />

  function anexar(requisitoId, file) {
    setErroFicheiro('')
    setOkMsg('')
    if (!file) return
    if (!TIPOS_ACEITES.includes(file.type)) {
      setErroFicheiro(t('submeterCandidatura.erroFicheiroTipo'))
      return
    }
    setEvidencias((atual) => ({ ...atual, [requisitoId]: [...(atual[requisitoId] || []), file] }))
  }

  function removerLocal(requisitoId, idx) {
    setEvidencias((atual) => {
      const arr = [...(atual[requisitoId] || [])]
      arr.splice(idx, 1)
      const proximo = { ...atual, [requisitoId]: arr }
      if (arr.length === 0) delete proximo[requisitoId]
      return proximo
    })
  }

  async function removerExistente(evId) {
    setErroSubmit(null)
    try {
      await api.apagarEvidencia(evId)
      reloadRascunho()
    } catch (err) {
      setErroSubmit(err.message)
    }
  }

  function trocarBadge(novo) {
    setBadgeId(novo)
    setEvidencias({})
    setErroSubmit(null)
    setErroFicheiro('')
    setOkMsg('')
  }

  const novosFicheiros = () =>
    Object.entries(evidencias).flatMap(([requisitoId, arr]) =>
      arr.map((file) => ({ requisitoId: Number(requisitoId), file }))
    )

  async function guardar() {
    setGuardando(true)
    setErroSubmit(null)
    setOkMsg('')
    try {
      await api.submeterCandidatura({ badgeId: Number(badgeId), ficheiros: novosFicheiros(), rascunho: true })
      setEvidencias({})
      reloadRascunho()
      setOkMsg(submetida ? t('submeterCandidatura.evidenciasAdicionadas') : t('submeterCandidatura.rascunhoGuardado'))
    } catch (err) {
      setErroSubmit(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function submeter() {
    setEnviando(true)
    setErroSubmit(null)
    try {
      await api.submeterCandidatura({ badgeId: Number(badgeId), ficheiros: novosFicheiros(), rascunho: false })
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

  const linhaFicheiro = (nome, corIcone, acao) => (
    <div className="d-flex align-items-center justify-content-between gap-2 rounded-3 bg-white border px-3 py-2 small">
      <span className="d-flex align-items-center gap-2 min-w-0 text-ink">
        <FileText size={15} className={`${corIcone} flex-shrink-0`} />
        <span className="text-truncate">{nome}</span>
      </span>
      {acao}
    </div>
  )

  return (
    <div>
      <Link to="/catalogo" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('submeterCandidatura.voltar')}
      </Link>

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
          <div className="col-lg-8">
            <div className="rounded-4 border bg-white p-4 shadow-sm">
              <h2 className="d-flex align-items-center gap-2 fw-semibold text-ink mb-1">
                <ClipboardCheck size={18} className="text-brand" /> {t('submeterCandidatura.requisitosTitulo')}
              </h2>
              <p className="small text-muted">{t('submeterCandidatura.requisitosIntro')}</p>

              {submetida ? (
                <p className="d-flex align-items-center gap-2 rounded-3 bg-warning-subtle text-warning-emphasis px-3 py-2 fs-xs">
                  <Info size={14} className="flex-shrink-0" /> {t('submeterCandidatura.submetidaInfo')}
                </p>
              ) : rascunho ? (
                <p className="d-flex align-items-center gap-2 rounded-3 bg-brand-light text-brand px-3 py-2 fs-xs">
                  <Info size={14} className="flex-shrink-0" /> {t('submeterCandidatura.retomarInfo')}
                </p>
              ) : null}

              {requisitos.length === 0 ? (
                <div className="rounded-3 border border-warning-subtle bg-warning-subtle p-3 d-flex align-items-center gap-2 small text-warning-emphasis mb-0">
                  <AlertTriangle size={16} /> {t('submeterCandidatura.semRequisitos')}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {requisitos.map((req) => {
                    const locais = localArr(req.id)
                    const jaGuardadas = existArr(req.id)
                    const isObrigatorio = req.obrigatorio !== false
                    const feito = locais.length + jaGuardadas.length > 0
                    return (
                      <div key={req.id} className={`rounded-3 border p-3 ${feito ? 'border-success border-opacity-50 bg-success-subtle bg-opacity-25' : ''}`}>
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="min-w-0">
                            <p className="fw-semibold text-ink mb-1 d-flex align-items-center gap-2">
                              {feito && <CheckCircle2 size={16} className="text-success flex-shrink-0" />}
                              {req.titulo}
                            </p>
                            {req.descricao && <p className="small text-muted mb-0">{req.descricao}</p>}
                          </div>
                          <span className={`badge rounded-pill flex-shrink-0 ${isObrigatorio ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                            {isObrigatorio ? t('submeterCandidatura.obrigatorio') : t('submeterCandidatura.opcional')}
                          </span>
                        </div>

                        {(jaGuardadas.length > 0 || locais.length > 0) && (
                          <div className="mt-3 d-flex flex-column gap-2">
                            {jaGuardadas.map((ev) => linhaFicheiro(
                              <>{ev.nomeFicheiro} <span className="badge rounded-pill text-bg-success ms-1">{t('submeterCandidatura.jaAnexada')}</span></>,
                              'text-success',
                              <button onClick={() => removerExistente(ev.id)} className="btn btn-link btn-sm p-0 text-danger flex-shrink-0" title={t('submeterCandidatura.remover')}>
                                <Trash2 size={15} />
                              </button>
                            ))}
                            {locais.map((f, idx) => linhaFicheiro(
                              f.name,
                              'text-brand',
                              <button onClick={() => removerLocal(req.id, idx)} className="btn btn-link btn-sm p-0 text-danger flex-shrink-0" title={t('submeterCandidatura.remover')}>
                                <Trash2 size={15} />
                              </button>
                            ))}
                          </div>
                        )}

                        <label className="mt-2 d-inline-flex cursor-pointer align-items-center gap-2 btn btn-link btn-sm p-0 text-brand text-decoration-none">
                          {feito ? <Plus size={15} /> : <UploadCloud size={16} />}
                          {feito ? t('submeterCandidatura.adicionarMais') : t('submeterCandidatura.anexar')}
                          <input type="file" className="d-none" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { anexar(req.id, e.target.files?.[0]); e.target.value = '' }} />
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}

              {erroFicheiro && <p className="mt-3 mb-0 fs-xs text-danger">{erroFicheiro}</p>}
              <p className="mt-3 mb-0 fs-xs text-secondary">{t('submeterCandidatura.suporta')}</p>
            </div>
          </div>

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

              {!submetida && (
                <p className={`d-flex align-items-start gap-2 rounded-3 px-3 py-2 fs-xs mb-3 ${podeSubmeter ? 'bg-success-subtle text-success-emphasis' : 'bg-light text-muted'}`}>
                  {podeSubmeter ? <CheckCircle2 size={14} className="flex-shrink-0 mt-1" /> : <Info size={14} className="flex-shrink-0 mt-1" />}
                  {podeSubmeter ? t('submeterCandidatura.prontoSubmeter') : t('submeterCandidatura.avisoObrigatorios')}
                </p>
              )}

              {okMsg && <p className="rounded-3 bg-success-subtle px-3 py-2 fs-xs text-success-emphasis">{okMsg}</p>}
              {erroSubmit && <p className="rounded-3 bg-danger-subtle px-3 py-2 fs-xs text-danger">{erroSubmit}</p>}

              {submetida ? (
                <button
                  onClick={guardar}
                  disabled={!podeGuardar || guardando}
                  className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <Plus size={16} /> {guardando ? t('submeterCandidatura.guardando') : t('submeterCandidatura.botaoAdicionar')}
                </button>
              ) : (
                <>
                  <button
                    onClick={guardar}
                    disabled={!podeGuardar || guardando || enviando}
                    className="btn btn-outline-secondary bg-white w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
                  >
                    <Save size={16} /> {guardando ? t('submeterCandidatura.guardando') : t('submeterCandidatura.botaoGuardar')}
                  </button>
                  <button
                    onClick={submeter}
                    disabled={!podeSubmeter || enviando || guardando}
                    className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Send size={16} /> {enviando ? t('submeterCandidatura.botaoSubmetendo') : t('submeterCandidatura.botaoSubmeter')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
