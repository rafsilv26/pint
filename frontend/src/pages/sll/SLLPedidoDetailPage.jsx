import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Check, X, Undo2 } from 'lucide-react'
import { Card, Spinner, ErrorState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const TINT = {
  salmon: 'tint-salmon',
  sky: 'tint-sky',
  emerald: 'tint-emerald',
  violet: 'tint-violet',
}

export default function SLLPedidoDetailPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: c, loading, error, reload } = useAsync(() => api.getCandidatura(id), [id])

  const [aprovando, setAprovando] = useState(false)
  const [tab, setTab] = useState(0)
  const [acao, setAcao] = useState(null) // 'REJEITAR' | 'SEND_BACK'
  const [comentario, setComentario] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)
  useAutoRefresh(reload, 30_000, !aprovando && !submitting)

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('sllPedidoDetail.naoEncontrado')}</p>

  async function decidir(decisao) {
    setSubmitting(true)
    setMsg(null)
    try {
      const result = await api.validarServiceLine(c.id, { decisao, comentario })
      const config = {
        APROVAR: { tab: 'APPROVED', type: 'success', title: t('sllPedidoDetail.feedback.aprovada', { pedido: c.numero, badge: c.badge.nome }) },
        REJEITAR: { tab: 'REJECTED', type: 'danger', title: t('sllPedidoDetail.feedback.rejeitada', { pedido: c.numero, badge: c.badge.nome }) },
        SEND_BACK: { tab: 'OPEN', type: 'warning', title: t('sllPedidoDetail.feedback.devolvida', { pedido: c.numero, badge: c.badge.nome }) },
      }[decisao]
      navigate('/sll/pedidos', { replace: true, state: { tab: config.tab, feedback: { type: config.type, title: config.title, message: result?.mensagem || result?.message || t('sllPedidoDetail.feedback.registada') } } })
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Só faz sentido decidir sobre candidaturas que o Talent Manager já validou
  // (estado VALIDATED) e que ainda não têm decisão final do SLL — sem este
  // filtro, a página mostrava sempre o botão "Iniciar Aprovação", mesmo em
  // pedidos já aprovados/rejeitados ou ainda por validar pelo TM (o backend
  // já recusa (400) essas decisões, mas a UI não devia sequer oferecê-las).
  const podeDecidir = c.estado?.code === 'VALIDATED'

  const evid = typeof tab === 'number' ? c.evidencias[tab] : null

  return (
    <div>
      <Link to="/sll/pedidos" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('sllPedidoDetail.voltar')}
      </Link>

      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="fs-2 fw-bold text-ink mb-0">
              {t('sllPedidoDetail.candidatura', { numero: c.numero })}
            </h1>
            <StatusPill status={c.estado} />
          </div>
          <p className="mt-1 d-flex align-items-center gap-2 small text-muted">
            <span className="d-flex align-items-center justify-content-center rounded-circle bg-brand-light fw-semibold text-brand" style={{ height: '1.5rem', width: '1.5rem', fontSize: '0.625rem' }}>
              {(c.consultor || 'C')[0]}
            </span>
            {c.consultor} · {t('sllPedidoDetail.submissao')}: {c.submissao}
          </p>

          {!podeDecidir ? (
            <p className="mt-3 small text-muted">{t('sllPedidoDetail.semAcaoDisponivel')}</p>
          ) : !aprovando ? (
            <button
              onClick={() => setAprovando(true)}
              className="mt-3 btn btn-warning px-4 py-2 fw-semibold"
            >
              {t('sllPedidoDetail.iniciarAprovacao')}
            </button>
          ) : (
            <div>
              <div className="mt-3 d-flex flex-wrap gap-2">
                <button onClick={() => decidir('APROVAR')} disabled={submitting} className="btn btn-success d-flex align-items-center gap-2 fw-semibold">
                  {submitting && <span className="spinner-border spinner-border-sm text-white" />}
                  {submitting ? t('sllPedidoDetail.aProcessar') : t('sllPedidoDetail.aprovar')}
                </button>
                <button onClick={() => { setAcao('REJEITAR'); setComentario('') }} disabled={submitting} className="btn btn-danger fw-semibold">
                  {t('sllPedidoDetail.rejeitar')}
                </button>
                <button onClick={() => { setAcao('SEND_BACK'); setComentario('') }} disabled={submitting} className="btn btn-outline-warning bg-warning-subtle d-flex align-items-center gap-1 fw-semibold">
                  <Undo2 size={15} /> {t('sllPedidoDetail.devolver')}
                </button>
              </div>
              {submitting && (
                <p className="mt-2 fs-xs text-muted">{t('sllPedidoDetail.aProcessarDemora')}</p>
              )}
            </div>
          )}
          {msg && <p className="mt-2 small text-danger">{msg}</p>}
        </div>

        <div className={`rounded-4 p-4 text-center ${TINT[c.badge.tint] || TINT.salmon}`} style={{ width: '11rem' }}>
          <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-white fs-3 fw-bold text-ink shadow" style={{ height: '3.5rem', width: '3.5rem' }}>{c.badge.nome[0]}</div>
          <p className="mt-2 small fw-semibold text-ink mb-0">{c.badge.nome}</p>
          <p className="fs-xs text-ink mb-0">{c.badge.nivel}</p>
        </div>
      </div>

      {acao && (
        <Card className={`mt-3 ${acao === 'REJEITAR' ? 'border-danger-subtle bg-danger-subtle' : 'border-warning-subtle bg-warning-subtle'}`}>
          <label className="d-block small fw-medium text-ink">
            {acao === 'REJEITAR' ? t('sllPedidoDetail.labels.motivoRejeicao') : t('sllPedidoDetail.labels.comentarioDevolucao')}
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={acao === 'REJEITAR' ? t('sllPedidoDetail.placeholders.motivoRejeicao') : t('sllPedidoDetail.placeholders.comentarioDevolucao')}
            className="form-control mt-2"
          />
          <div className="mt-2 d-flex justify-content-end gap-2">
            <button onClick={() => setAcao(null)} className="btn btn-outline-secondary bg-white btn-sm">
              {t('sllPedidoDetail.cancelar')}
            </button>
            <button
              onClick={() => decidir(acao)}
              disabled={submitting || !comentario.trim()}
              className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold text-white ${acao === 'REJEITAR' ? 'btn-danger' : 'btn-warning'}`}
            >
              {submitting && <span className="spinner-border spinner-border-sm text-white" />}
              {submitting ? t('sllPedidoDetail.aProcessar') : (acao === 'REJEITAR' ? t('sllPedidoDetail.confirmarRejeicao') : t('sllPedidoDetail.confirmarDevolucao'))}
            </button>
          </div>
        </Card>
      )}

      <div className="mt-4 d-flex flex-wrap gap-1 border-bottom">
        {c.evidencias.map((e, i) => (
          <button key={e.id} onClick={() => setTab(i)} className={`btn rounded-bottom-0 d-flex align-items-center gap-1 px-3 py-2 small fw-medium ${tab === i ? 'bg-white text-brand border border-bottom-0' : 'btn-link text-muted text-decoration-none'}`}>
            {t('sllPedidoDetail.evidenciaTab', { numero: i + 1 })}
            {e.validado === true && <Check size={13} className="text-success" />}
            {e.validado === false && <X size={13} className="text-danger" />}
          </button>
        ))}
        <button onClick={() => setTab('hist')} className={`btn rounded-bottom-0 px-3 py-2 small fw-medium ${tab === 'hist' ? 'bg-white text-brand border border-bottom-0' : 'btn-link text-muted text-decoration-none'}`}>
          {t('sllPedidoDetail.historicoTab')}
        </button>
      </div>

      {tab === 'hist' ? (
        <Card className="mt-3">
          <h2 className="mb-3 fw-semibold text-ink">{t('sllPedidoDetail.historicoTitulo')}</h2>
          {c.historico.length === 0 ? (
            <p className="small text-muted mb-0">{t('sllPedidoDetail.semHistorico')}</p>
          ) : (
            <ol className="d-flex flex-column gap-3 list-unstyled mb-0">
              {c.historico.map((h, i) => (
                <li key={i} className="d-flex gap-3">
                  <span className="flex-shrink-0 rounded-circle bg-brand mt-1" style={{ height: '0.5rem', width: '0.5rem' }} />
                  <div>
                    <p className="small fw-medium text-ink mb-0">{h.estadoAnterior ? `${h.estadoAnterior} → ${h.estado}` : h.estado}</p>
                    {h.motivo && <p className="mt-1 small text-muted mb-0">{h.motivo}</p>}
                    <p className="fs-xs text-muted mb-0">{[h.autor, h.data].filter(Boolean).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ) : evid ? (
        <div className="mt-3 row g-4">
          <div className="col-lg-6">
            <h2 className="mb-2 fw-semibold text-ink">{t('sllPedidoDetail.evidenciaTitulo')}</h2>
            <div className="d-flex align-items-center justify-content-between rounded-3 border bg-white p-3">
              <span className="d-flex align-items-center gap-3 small text-ink">
                <span className="d-flex align-items-center justify-content-center rounded-3 bg-light text-secondary" style={{ height: '2.5rem', width: '2.5rem' }}><FileText size={20} /></span>
                {evid.nome}
              </span>
              <a href={evid.url} target="_blank" rel="noreferrer" className="text-muted"><Download size={18} /></a>
            </div>
            {/* A validação de cada evidência é feita pelo Talent Manager antes de
                chegar ao Service Line Leader — aqui mostra-se apenas o resultado
                dessa validação, em modo leitura. */}
            {evid.validado === true && (
              <p className="mt-3 d-flex align-items-center justify-content-center gap-1 fs-xs fw-medium text-success">
                <Check size={13} /> {t('sllPedidoDetail.evidenciaValidadaPeloTM')}
              </p>
            )}
            {evid.validado === false && (
              <p className="mt-3 d-flex align-items-center justify-content-center gap-1 fs-xs fw-medium text-danger">
                <X size={13} /> {t('sllPedidoDetail.evidenciaRejeitadaPeloTM')}
              </p>
            )}
          </div>
          <div className="col-lg-6">
            <h2 className="mb-2 fw-semibold text-ink">{t('sllPedidoDetail.requisitoAssociado')}</h2>
            <div className="rounded-3 border bg-white p-3 small text-muted" style={{ lineHeight: 1.6 }}>{evid.requisito}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 small text-muted">{t('sllPedidoDetail.semEvidencias')}</p>
      )}
    </div>
  )
}
