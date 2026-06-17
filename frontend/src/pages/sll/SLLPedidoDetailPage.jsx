import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Check, X, Undo2 } from 'lucide-react'
import { Card, Spinner, ErrorState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'

const TINT = {
  salmon: 'bg-gradient-to-br from-orange-200 to-red-200',
  sky: 'bg-gradient-to-br from-sky-200 to-blue-200',
  emerald: 'bg-gradient-to-br from-emerald-200 to-green-200',
  violet: 'bg-gradient-to-br from-violet-200 to-purple-200',
}

export default function SLLPedidoDetailPage() {
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
  if (!c) return <p className="text-muted">Pedido não encontrado.</p>

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

  const evid = typeof tab === 'number' ? c.evidencias[tab] : null

  return (
    <div>
      <Link to="/sll/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">Candidatura {c.numero}</h1>
            <StatusPill status={c.estado} />
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-light text-[10px] font-semibold text-brand">{(c.consultor || 'C')[0]}</span>
            {c.consultor} · Submissão: {c.submissao}
          </p>

          {!aprovando ? (
            <button
              onClick={() => setAprovando(true)}
              className="mt-4 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-500"
            >
              Iniciar Aprovação
            </button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => decidir('APROVAR')} disabled={submitting} className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">Aprovar</button>
              <button onClick={() => setAcao('REJEITAR')} disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">Rejeitar</button>
              <button onClick={() => setAcao('SEND_BACK')} disabled={submitting} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"><Undo2 size={15} /> Devolver</button>
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
            {acao === 'REJEITAR' ? 'Motivo da rejeição' : 'Comentário para o consultor (devolução)'}
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={acao === 'REJEITAR' ? 'Indica o motivo da rejeição…' : 'Indica o que o consultor deve corrigir…'}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAcao(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">Cancelar</button>
            <button
              onClick={() => decidir(acao)}
              disabled={submitting}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60 ${acao === 'REJEITAR' ? 'bg-red-600' : 'bg-amber-500'}`}
            >
              {acao === 'REJEITAR' ? 'Confirmar Rejeição' : 'Confirmar Devolução'}
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200">
        {c.evidencias.map((e, i) => (
          <button key={e.id} onClick={() => setTab(i)} className={`rounded-t-lg px-3 py-2 text-sm font-medium ${tab === i ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}>
            Evidência #{i + 1}
          </button>
        ))}
        <button onClick={() => setTab('hist')} className={`rounded-t-lg px-3 py-2 text-sm font-medium ${tab === 'hist' ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}>
          Histórico
        </button>
      </div>

      {tab === 'hist' ? (
        <Card className="mt-4">
          <h2 className="mb-3 font-semibold text-ink">Histórico</h2>
          {c.historico.length === 0 ? (
            <p className="text-sm text-muted">Sem histórico.</p>
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
            <h2 className="mb-2 font-semibold text-ink">Evidência</h2>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <span className="flex items-center gap-3 text-sm text-ink">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-500"><FileText size={20} /></span>
                {evid.nome}
              </span>
              <a href={evid.url} target="_blank" rel="noreferrer" className="text-muted hover:text-brand"><Download size={18} /></a>
            </div>
            {aprovando && (
              <div className="mt-3 flex justify-center gap-2">
                <button className="flex items-center gap-1 rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white"><X size={13} /> Rejeitar</button>
                <button className="flex items-center gap-1 rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white"><Check size={13} /> Aprovar</button>
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-ink">Requisito Associado</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-muted">{evid.requisito}</div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Sem evidências neste pedido.</p>
      )}
    </div>
  )
}
