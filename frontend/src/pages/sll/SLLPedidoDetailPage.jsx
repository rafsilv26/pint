import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Check, X, Undo2 } from 'lucide-react'
import { Card, Spinner, ErrorState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const TINT = {
  salmon: 'bg-gradient-to-br from-orange-200 to-red-200',
  sky: 'bg-gradient-to-br from-sky-200 to-blue-200',
  emerald: 'bg-gradient-to-br from-emerald-200 to-green-200',
  violet: 'bg-gradient-to-br from-violet-200 to-purple-200',
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

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('sllPedidoDetail.naoEncontrado')}</p>

  async function decidir(decisao) {
    setSubmitting(true)
    setMsg(null)
    try {
      await api.validarServiceLine(c.id, { decisao, comentario })
      navigate('/sll/pedidos')
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
      <Link to="/sll/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('sllPedidoDetail.voltar')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">
              {t('sllPedidoDetail.candidatura', { numero: c.numero })}
            </h1>
            <StatusPill status={c.estado} />
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-light text-[10px] font-semibold text-brand">
              {(c.consultor || 'C')[0]}
            </span>
            {c.consultor} · {t('sllPedidoDetail.submissao')}: {c.submissao}
          </p>

          {!podeDecidir ? (
            <p className="mt-4 text-sm text-muted">{t('sllPedidoDetail.semAcaoDisponivel')}</p>
          ) : !aprovando ? (
            <button
              onClick={() => setAprovando(true)}
              className="mt-4 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-500"
            >
              {t('sllPedidoDetail.iniciarAprovacao')}
            </button>
          ) : (
            <div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => decidir('APROVAR')} disabled={submitting} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                  {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {submitting ? t('sllPedidoDetail.aProcessar') : t('sllPedidoDetail.aprovar')}
                </button>
                <button onClick={() => setAcao('REJEITAR')} disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                  {t('sllPedidoDetail.rejeitar')}
                </button>
                <button onClick={() => setAcao('SEND_BACK')} disabled={submitting} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60">
                  <Undo2 size={15} /> {t('sllPedidoDetail.devolver')}
                </button>
              </div>
              {submitting && (
                <p className="mt-2 text-xs text-muted">{t('sllPedidoDetail.aProcessarDemora')}</p>
              )}
            </div>
          )}
          {msg && <p className="mt-2 text-sm text-red-700">{msg}</p>}
        </div>

        <div className={`w-44 rounded-2xl p-5 text-center ${TINT[c.badge.tint] || TINT.salmon}`}>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-2xl font-bold text-ink shadow">{c.badge.nome[0]}</div>
          <p className="mt-2 text-sm font-semibold text-ink">{c.badge.nome}</p>
          <p className="text-xs text-ink/70">{c.badge.nivel}</p>
        </div>
      </div>

      {acao && (
        <Card className={`mt-4 ${acao === 'REJEITAR' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <label className="block text-sm font-medium text-ink">
            {acao === 'REJEITAR' ? t('sllPedidoDetail.labels.motivoRejeicao') : t('sllPedidoDetail.labels.comentarioDevolucao')}
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={acao === 'REJEITAR' ? t('sllPedidoDetail.placeholders.motivoRejeicao') : t('sllPedidoDetail.placeholders.comentarioDevolucao')}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAcao(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
              {t('sllPedidoDetail.cancelar')}
            </button>
            <button
              onClick={() => decidir(acao)}
              disabled={submitting}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60 ${acao === 'REJEITAR' ? 'bg-red-600' : 'bg-amber-500'}`}
            >
              {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {submitting ? t('sllPedidoDetail.aProcessar') : (acao === 'REJEITAR' ? t('sllPedidoDetail.confirmarRejeicao') : t('sllPedidoDetail.confirmarDevolucao'))}
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200">
        {c.evidencias.map((e, i) => (
          <button key={e.id} onClick={() => setTab(i)} className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium ${tab === i ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}>
            {t('sllPedidoDetail.evidenciaTab', { numero: i + 1 })}
            {e.validado === true && <Check size={13} className="text-green-600" />}
            {e.validado === false && <X size={13} className="text-red-600" />}
          </button>
        ))}
        <button onClick={() => setTab('hist')} className={`rounded-t-lg px-3 py-2 text-sm font-medium ${tab === 'hist' ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}>
          {t('sllPedidoDetail.historicoTab')}
        </button>
      </div>

      {tab === 'hist' ? (
        <Card className="mt-4">
          <h2 className="mb-3 font-semibold text-ink">{t('sllPedidoDetail.historicoTitulo')}</h2>
          {c.historico.length === 0 ? (
            <p className="text-sm text-muted">{t('sllPedidoDetail.semHistorico')}</p>
          ) : (
            <ol className="space-y-3">
              {c.historico.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p className="text-sm font-medium text-ink">{h.motivo || h.estado}</p>
                    <p className="text-xs text-muted">{h.data}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ) : evid ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 font-semibold text-ink">{t('sllPedidoDetail.evidenciaTitulo')}</h2>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <span className="flex items-center gap-3 text-sm text-ink">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-500"><FileText size={20} /></span>
                {evid.nome}
              </span>
              <a href={evid.url} target="_blank" rel="noreferrer" className="text-muted hover:text-brand"><Download size={18} /></a>
            </div>
            {/* A validação de cada evidência é feita pelo Talent Manager antes de
                chegar ao Service Line Leader — aqui mostra-se apenas o resultado
                dessa validação, em modo leitura. */}
            {evid.validado === true && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700">
                <Check size={13} /> {t('sllPedidoDetail.evidenciaValidadaPeloTM')}
              </p>
            )}
            {evid.validado === false && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-red-700">
                <X size={13} /> {t('sllPedidoDetail.evidenciaRejeitadaPeloTM')}
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-ink">{t('sllPedidoDetail.requisitoAssociado')}</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-muted">{evid.requisito}</div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{t('sllPedidoDetail.semEvidencias')}</p>
      )}
    </div>
  )
}