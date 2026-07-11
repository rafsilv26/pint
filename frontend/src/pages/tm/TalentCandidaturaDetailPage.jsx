import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Check, X } from 'lucide-react'
import { Card, Spinner, ErrorState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { getEvidenceCoverage } from '../../services/talentWorkspace'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const TINT = {
  salmon: 'tint-salmon',
  sky: 'tint-sky',
  emerald: 'tint-emerald',
  violet: 'tint-violet',
}

export default function TalentCandidaturaDetailPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: c, loading, error, reload } = useAsync(() => api.getCandidatura(id), [id])

  const [validando, setValidando] = useState(false)
  const [tab, setTab] = useState(0)
  const [acao, setAcao] = useState(null)
  const [comentario, setComentario] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [evidSubmittingId, setEvidSubmittingId] = useState(null)
  useAutoRefresh(reload, 30_000, !validando && !submitting && evidSubmittingId == null)

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('talentCandidaturaDetail.naoEncontrada')}</p>

  // Só é possível validar/rejeitar uma candidatura enquanto esta aguarda
  // decisão do Talent Manager. Já validada, rejeitada ou aprovada -> sem ações.
  const podeValidar = c.estado?.code === 'SUBMITTED'
  const evidenceCoverage = getEvidenceCoverage(c.badge.requisitos, c.evidencias)
  const requisitosObrigatorios = evidenceCoverage.required
  const requisitosEmFalta = evidenceCoverage.missing
  const todasEvidenciasValidadas = evidenceCoverage.complete

  async function decidir(decisao) {
    setSubmitting(true)
    setMsg(null)
    try {
      const result = await api.validarTalentManager(c.id, { decisao, comentario })
      const validada = decisao === 'APROVAR'
      navigate('/tm/candidaturas', {
        replace: true,
        state: {
          tab: validada ? 'validadas' : 'rejeitadas',
          feedback: {
            type: validada ? 'success' : 'danger',
            title: t(validada
              ? 'talentCandidaturas.feedback.validadaTitulo'
              : 'talentCandidaturas.feedback.rejeitadaTitulo', { badge: c.badge.nome }),
            message: result?.mensagem || result?.message || t(validada
              ? 'talentCandidaturas.feedback.validadaDescricao'
              : 'talentCandidaturas.feedback.rejeitadaDescricao'),
          },
        },
      })
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function validarEvidenciaAtual(validado) {
    if (!evid) return
    setEvidSubmittingId(evid.id)
    setMsg(null)
    try {
      await api.validarEvidencia(evid.id, validado)
      await reload()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setEvidSubmittingId(null)
    }
  }

  const evid = typeof tab === 'number' ? c.evidencias[tab] : null

  return (
    <div>
      <Link to="/tm/candidaturas" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('talentCandidaturaDetail.voltar')}
      </Link>

      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="fs-2 fw-bold text-ink mb-0">
              {t('talentCandidaturaDetail.titulo', { numero: c.numero })}
            </h1>
            <StatusPill status={c.estado} />
          </div>
          <p className="mt-1 d-flex align-items-center gap-2 small text-muted">
            <span className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-semibold text-brand" style={{ height: '1.5rem', width: '1.5rem', fontSize: '0.625rem' }}>
              {(c.consultor || 'C')[0]}
            </span>
            {c.consultor} · {t('talentCandidaturaDetail.submissao')}: {c.submissao}
          </p>

          {podeValidar && (
            !validando ? (
              <button
                onClick={() => setValidando(true)}
                className="mt-3 btn btn-warning px-4 py-2 fw-semibold"
              >
                {t('talentCandidaturaDetail.botoes.iniciarValidacao')}
              </button>
            ) : (
              <div className="mt-3">
                <div className="d-flex gap-2">
                  <button
                    onClick={() => decidir('APROVAR')}
                    disabled={submitting || !todasEvidenciasValidadas}
                    title={!todasEvidenciasValidadas ? t('talentCandidaturaDetail.avisos.evidenciasPorValidar') : undefined}
                    className="btn btn-success d-flex align-items-center gap-2 fw-semibold"
                  >
                    {submitting && <span className="spinner-border spinner-border-sm text-white" />}
                    {submitting ? t('talentCandidaturaDetail.botoes.aProcessar') : t('talentCandidaturaDetail.botoes.validar')}
                  </button>
                  <button
                    onClick={() => setAcao('rejeitar')}
                    disabled={submitting}
                    className="btn btn-danger fw-semibold"
                  >
                    {t('talentCandidaturaDetail.botoes.rejeitarCand')}
                  </button>
                </div>
                {!todasEvidenciasValidadas && (
                  <p className="mt-2 fs-xs text-warning-emphasis">{t('talentCandidaturaDetail.avisos.evidenciasPorValidar')}</p>
                )}
                {submitting && (
                  <p className="mt-2 fs-xs text-muted">{t('talentCandidaturaDetail.avisos.aProcessarDemora')}</p>
                )}
              </div>
            )
          )}
          {msg && <p className="mt-2 small text-danger">{msg}</p>}
        </div>

        {/* Badge */}
        <div className={`rounded-4 p-4 text-center ${TINT[c.badge.tint] || TINT.salmon}`} style={{ width: '11rem' }}>
          <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-white fs-3 fw-bold text-ink shadow" style={{ height: '3.5rem', width: '3.5rem' }}>
            {c.badge.nome[0]}
          </div>
          <p className="mt-2 small fw-semibold text-ink mb-0">{c.badge.nome}</p>
          <p className="fs-xs text-ink mb-0">{c.badge.nivel}</p>
        </div>
      </div>

      {acao === 'rejeitar' && (
        <Card className="mt-3 border-danger-subtle bg-danger-subtle">
          <label className="d-block small fw-medium text-ink">
            {t('talentCandidaturaDetail.labels.motivoRejeicao')}
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={t('talentCandidaturaDetail.placeholders.motivoRejeicao')}
            className="form-control mt-2"
          />
          <div className="mt-2 d-flex justify-content-end gap-2">
            <button onClick={() => setAcao(null)} className="btn btn-outline-secondary bg-white btn-sm">
              {t('talentCandidaturaDetail.botoes.cancelar')}
            </button>
            <button
              onClick={() => decidir('REJEITAR')}
              disabled={submitting || !comentario.trim()}
              className="btn btn-danger btn-sm d-flex align-items-center gap-2 fw-semibold"
            >
              {submitting && <span className="spinner-border spinner-border-sm text-white" />}
              {submitting ? t('talentCandidaturaDetail.botoes.aProcessar') : t('talentCandidaturaDetail.botoes.confirmarRejeicao')}
            </button>
          </div>
        </Card>
      )}

      {podeValidar && requisitosObrigatorios.length > 0 && (
        <Card className={`mt-4 ${requisitosEmFalta.length ? 'border-warning-subtle bg-warning-subtle' : 'border-success-subtle bg-success-subtle'}`}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h2 className="h6 fw-bold mb-1">{t('tmWorkspace.evidenceCoverage.title')}</h2>
              <p className="small text-muted mb-0">{t('tmWorkspace.evidenceCoverage.summary', { covered: requisitosObrigatorios.length - requisitosEmFalta.length, total: requisitosObrigatorios.length })}</p>
            </div>
            <span className={`badge ${requisitosEmFalta.length ? 'text-bg-warning' : 'text-bg-success'}`}>{requisitosEmFalta.length ? t('tmWorkspace.evidenceCoverage.missing', { count: requisitosEmFalta.length }) : t('tmWorkspace.evidenceCoverage.complete')}</span>
          </div>
          {requisitosEmFalta.length > 0 && <ul className="mt-3 mb-0 small text-warning-emphasis">{requisitosEmFalta.map((requisito) => <li key={requisito.id}>{requisito.titulo}</li>)}</ul>}
        </Card>
      )}

      {/* Tabs */}
      <div className="mt-4 d-flex flex-wrap gap-1 border-bottom">
        {c.evidencias.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setTab(i)}
            className={`btn rounded-bottom-0 d-flex align-items-center gap-1 px-3 py-2 small fw-medium ${tab === i ? 'bg-white text-brand border border-bottom-0' : 'btn-link text-muted text-decoration-none'}`}
          >
            {t('talentCandidaturaDetail.tabs.evidencia', { numero: i + 1 })}
            {e.validado === true && <Check size={13} className="text-success" />}
            {e.validado === false && <X size={13} className="text-danger" />}
          </button>
        ))}
        <button
          onClick={() => setTab('hist')}
          className={`btn rounded-bottom-0 px-3 py-2 small fw-medium ${tab === 'hist' ? 'bg-white text-brand border border-bottom-0' : 'btn-link text-muted text-decoration-none'}`}
        >
          {t('talentCandidaturaDetail.tabs.historico')}
        </button>
      </div>

      {tab === 'hist' ? (
        <Card className="mt-3">
          <h2 className="mb-3 fw-semibold text-ink">{t('talentCandidaturaDetail.secoes.historicoTitulo')}</h2>
          {c.historico.length === 0 ? (
            <p className="small text-muted mb-0">{t('talentCandidaturaDetail.secoes.semHistorico')}</p>
          ) : (
            <ol className="d-flex flex-column gap-3 list-unstyled mb-0">
              {c.historico.map((h, i) => (
                <li key={i} className="d-flex gap-3">
                  <span className="flex-shrink-0 rounded-circle bg-brand mt-1" style={{ height: '0.5rem', width: '0.5rem' }} />
                  <div>
                    <p className="small fw-medium text-ink mb-0">{h.motivo || h.estado}</p>
                    <p className="fs-xs text-muted mb-0">{[h.estado, h.autor, h.data].filter(Boolean).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ) : evid ? (
        <div className="mt-3 row g-4">
          <div className="col-lg-6">
            <h2 className="mb-2 fw-semibold text-ink">{t('talentCandidaturaDetail.secoes.evidenciaTitulo')}</h2>
            <div className="d-flex align-items-center justify-content-between rounded-3 border bg-white p-3">
              <span className="d-flex align-items-center gap-3 small text-ink">
                <span className="d-flex align-items-center justify-content-center rounded-3 bg-light text-secondary" style={{ height: '2.5rem', width: '2.5rem' }}><FileText size={20} /></span>
                {evid.nome}
              </span>
              <a href={evid.url} target="_blank" rel="noreferrer" className="text-muted"><Download size={18} /></a>
            </div>
            {podeValidar && validando && (
              <div className="mt-3 d-flex flex-column align-items-center gap-2">
                <div className="d-flex justify-content-center gap-2">
                  <button
                    onClick={() => validarEvidenciaAtual(false)}
                    disabled={evidSubmittingId === evid.id}
                    className={`btn rounded-pill d-flex align-items-center gap-1 px-3 py-1 fs-xs fw-semibold text-white ${evid.validado === false ? 'btn-danger' : 'btn-danger'}`}
                  >
                    {evidSubmittingId === evid.id ? (
                      <span className="spinner-border spinner-border-sm text-white" style={{ height: '0.75rem', width: '0.75rem' }} />
                    ) : (
                      <X size={13} />
                    )}
                    {t('talentCandidaturaDetail.botoes.rejeitar')}
                  </button>
                  <button
                    onClick={() => validarEvidenciaAtual(true)}
                    disabled={evidSubmittingId === evid.id}
                    className={`btn rounded-pill d-flex align-items-center gap-1 px-3 py-1 fs-xs fw-semibold text-white ${evid.validado === true ? 'btn-success' : 'btn-success'}`}
                  >
                    {evidSubmittingId === evid.id ? (
                      <span className="spinner-border spinner-border-sm text-white" style={{ height: '0.75rem', width: '0.75rem' }} />
                    ) : (
                      <Check size={13} />
                    )}
                    {t('talentCandidaturaDetail.botoes.aprovar')}
                  </button>
                </div>
                {evidSubmittingId === evid.id && (
                  <p className="fs-xs text-muted mb-0">{t('talentCandidaturaDetail.avisos.aProcessarDemora')}</p>
                )}
                {evid.validado === true && evidSubmittingId !== evid.id && (
                  <p className="fs-xs fw-medium text-success mb-0">{t('talentCandidaturaDetail.avisos.evidenciaValidada')}</p>
                )}
                {evid.validado === false && evidSubmittingId !== evid.id && (
                  <p className="fs-xs fw-medium text-danger mb-0">{t('talentCandidaturaDetail.avisos.evidenciaRejeitada')}</p>
                )}
              </div>
            )}
          </div>
          <div className="col-lg-6">
            <h2 className="mb-2 fw-semibold text-ink">{t('talentCandidaturaDetail.secoes.requisitoAssociado')}</h2>
            <div className="rounded-3 border bg-white p-3 small text-muted" style={{ lineHeight: 1.6 }}>{evid.requisito}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 small text-muted">{t('talentCandidaturaDetail.secoes.semEvidencias')}</p>
      )}
    </div>
  )
}
