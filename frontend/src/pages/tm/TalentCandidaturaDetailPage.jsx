import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Check, X } from 'lucide-react'
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

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />
  if (!c) return <p className="text-muted">{t('talentCandidaturaDetail.naoEncontrada')}</p>

  // Só é possível validar/rejeitar uma candidatura enquanto esta aguarda
  // decisão do Talent Manager. Já validada, rejeitada ou aprovada -> sem ações.
  const podeValidar = c.estado?.code === 'SUBMITTED'
  const todasEvidenciasValidadas = c.evidencias.length === 0 || c.evidencias.every((e) => e.validado === true)

  async function decidir(decisao) {
    setSubmitting(true)
    setMsg(null)
    try {
      await api.validarTalentManager(c.id, { decisao, comentario })
      navigate('/tm/candidaturas')
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
      <Link to="/tm/candidaturas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('talentCandidaturaDetail.voltar')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">
              {t('talentCandidaturaDetail.titulo', { numero: c.numero })}
            </h1>
            <StatusPill status={c.estado} />
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-light text-[10px] font-semibold text-brand">
              {(c.consultor || 'C')[0]}
            </span>
            {c.consultor} · {t('talentCandidaturaDetail.submissao')}: {c.submissao}
          </p>

          {podeValidar && (
            !validando ? (
              <button
                onClick={() => setValidando(true)}
                className="mt-4 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-500"
              >
                {t('talentCandidaturaDetail.botoes.iniciarValidacao')}
              </button>
            ) : (
              <div className="mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => decidir('APROVAR')}
                    disabled={submitting || !todasEvidenciasValidadas}
                    title={!todasEvidenciasValidadas ? t('talentCandidaturaDetail.avisos.evidenciasPorValidar') : undefined}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    {submitting ? t('talentCandidaturaDetail.botoes.aProcessar') : t('talentCandidaturaDetail.botoes.validar')}
                  </button>
                  <button
                    onClick={() => setAcao('rejeitar')}
                    disabled={submitting}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {t('talentCandidaturaDetail.botoes.rejeitarCand')}
                  </button>
                </div>
                {!todasEvidenciasValidadas && (
                  <p className="mt-2 text-xs text-amber-700">{t('talentCandidaturaDetail.avisos.evidenciasPorValidar')}</p>
                )}
                {submitting && (
                  <p className="mt-2 text-xs text-muted">{t('talentCandidaturaDetail.avisos.aProcessarDemora')}</p>
                )}
              </div>
            )
          )}
          {msg && <p className="mt-2 text-sm text-red-700">{msg}</p>}
        </div>

        {/* Badge */}
        <div className={`w-44 rounded-2xl p-5 text-center ${TINT[c.badge.tint] || TINT.salmon}`}>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-2xl font-bold text-ink shadow">
            {c.badge.nome[0]}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{c.badge.nome}</p>
          <p className="text-xs text-ink/70">{c.badge.nivel}</p>
        </div>
      </div>

      {acao === 'rejeitar' && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <label className="block text-sm font-medium text-ink">
            {t('talentCandidaturaDetail.labels.motivoRejeicao')}
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder={t('talentCandidaturaDetail.placeholders.motivoRejeicao')}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAcao(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
              {t('talentCandidaturaDetail.botoes.cancelar')}
            </button>
            <button
              onClick={() => decidir('REJEITAR')}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {submitting ? t('talentCandidaturaDetail.botoes.aProcessar') : t('talentCandidaturaDetail.botoes.confirmarRejeicao')}
            </button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200">
        {c.evidencias.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setTab(i)}
            className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium ${tab === i ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}
          >
            {t('talentCandidaturaDetail.tabs.evidencia', { numero: i + 1 })}
            {e.validado === true && <Check size={13} className="text-green-600" />}
            {e.validado === false && <X size={13} className="text-red-600" />}
          </button>
        ))}
        <button
          onClick={() => setTab('hist')}
          className={`rounded-t-lg px-3 py-2 text-sm font-medium ${tab === 'hist' ? 'bg-white text-brand ring-1 ring-gray-200' : 'text-muted hover:text-ink'}`}
        >
          {t('talentCandidaturaDetail.tabs.historico')}
        </button>
      </div>

      {tab === 'hist' ? (
        <Card className="mt-4">
          <h2 className="mb-3 font-semibold text-ink">{t('talentCandidaturaDetail.secoes.historicoTitulo')}</h2>
          {c.historico.length === 0 ? (
            <p className="text-sm text-muted">{t('talentCandidaturaDetail.secoes.semHistorico')}</p>
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
            <h2 className="mb-2 font-semibold text-ink">{t('talentCandidaturaDetail.secoes.evidenciaTitulo')}</h2>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <span className="flex items-center gap-3 text-sm text-ink">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-500"><FileText size={20} /></span>
                {evid.nome}
              </span>
              <a href={evid.url} target="_blank" rel="noreferrer" className="text-muted hover:text-brand"><Download size={18} /></a>
            </div>
            {podeValidar && validando && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => validarEvidenciaAtual(false)}
                    disabled={evidSubmittingId === evid.id}
                    className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60 ${evid.validado === false ? 'bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {evidSubmittingId === evid.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <X size={13} />
                    )}
                    {t('talentCandidaturaDetail.botoes.rejeitar')}
                  </button>
                  <button
                    onClick={() => validarEvidenciaAtual(true)}
                    disabled={evidSubmittingId === evid.id}
                    className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60 ${evid.validado === true ? 'bg-green-800' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {evidSubmittingId === evid.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Check size={13} />
                    )}
                    {t('talentCandidaturaDetail.botoes.aprovar')}
                  </button>
                </div>
                {evidSubmittingId === evid.id && (
                  <p className="text-xs text-muted">{t('talentCandidaturaDetail.avisos.aProcessarDemora')}</p>
                )}
                {evid.validado === true && evidSubmittingId !== evid.id && (
                  <p className="text-xs font-medium text-green-700">{t('talentCandidaturaDetail.avisos.evidenciaValidada')}</p>
                )}
                {evid.validado === false && evidSubmittingId !== evid.id && (
                  <p className="text-xs font-medium text-red-700">{t('talentCandidaturaDetail.avisos.evidenciaRejeitada')}</p>
                )}
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-ink">{t('talentCandidaturaDetail.secoes.requisitoAssociado')}</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-muted">{evid.requisito}</div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{t('talentCandidaturaDetail.secoes.semEvidencias')}</p>
      )}
    </div>
  )
}