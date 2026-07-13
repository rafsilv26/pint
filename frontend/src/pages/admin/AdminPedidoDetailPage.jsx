import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, User, FileText, Clock, CheckCircle2, XCircle, RotateCcw, Send, Download } from 'lucide-react'
import { PageHeader, Card, Spinner, ErrorState, StatusPill } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

const linkFicheiro = (url) => {
  if (!url || url === '#') return null
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url
}

const FASE = {
  OPEN: { cor: '#9ca3af', icon: RotateCcw },
  SUBMITTED: { cor: '#3b82f6', icon: Send },
  IN_VALIDATION: { cor: '#f59e0b', icon: Clock },
  VALIDATED: { cor: '#6366f1', icon: CheckCircle2 },
  IN_APPROVAL: { cor: '#f59e0b', icon: Clock },
  APPROVED: { cor: '#16a34a', icon: CheckCircle2 },
  REJECTED: { cor: '#dc2626', icon: XCircle },
}

export default function AdminPedidoDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data: c, loading, error, reload } = useAsync(() => api.getCandidatura(id), [id])

  const voltar = (
    <Link to="/admin/pedidos" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
      <ArrowLeft size={16} /> {t('adminPedidoDetail.voltar')}
    </Link>
  )

  if (loading) return <Spinner />
  if (error) return <div>{voltar}<ErrorState onRetry={reload} /></div>
  if (!c) return <div>{voltar}<p className="mt-3 text-muted">{t('adminPedidoDetail.naoEncontrado')}</p></div>

  const timeline = c.timeline || []

  return (
    <div>
      {voltar}
      <PageHeader title={`${c.badge?.nome || 'Badge'} · ${c.numero}`} subtitle={t('adminPedidoDetail.subtitulo')} />

      <div className="row g-4">
        <div className="col-lg-5 d-flex flex-column gap-4">
          <Card>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="fw-semibold text-ink mb-0 d-flex align-items-center gap-2">
                <Award size={18} className="text-brand" /> {t('adminPedidoDetail.pedido')}
              </h2>
              <StatusPill status={c.estado} />
            </div>
            <dl className="mb-0 small">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <dt className="text-muted fw-normal d-flex align-items-center gap-1"><User size={13} /> {t('adminPedidoDetail.consultor')}</dt>
                <dd className="fw-medium text-ink mb-0">{c.consultor}</dd>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <dt className="text-muted fw-normal">{t('adminPedidoDetail.nivel')}</dt>
                <dd className="fw-medium text-ink mb-0">{c.badge?.nivel}</dd>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <dt className="text-muted fw-normal">{t('adminPedidoDetail.pontos')}</dt>
                <dd className="fw-medium text-ink mb-0">{c.badge?.pontos}</dd>
              </div>
              <div className="d-flex justify-content-between py-2">
                <dt className="text-muted fw-normal">{t('adminPedidoDetail.submissao')}</dt>
                <dd className="fw-medium text-ink mb-0">{c.submissao}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="fw-semibold text-ink mb-3 d-flex align-items-center gap-2">
              <FileText size={18} className="text-brand" /> {t('adminPedidoDetail.evidencias')}
            </h2>
            {(c.evidencias || []).length === 0 ? (
              <p className="small text-muted mb-0">{t('adminPedidoDetail.semEvidencias')}</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {c.evidencias.map((e) => {
                  const href = linkFicheiro(e.url)
                  return (
                    <a
                      key={e.id}
                      href={href || undefined}
                      download
                      rel="noopener noreferrer"
                      className={`d-flex align-items-center gap-2 rounded-3 border px-3 py-2 small text-decoration-none ${href ? '' : 'pe-none opacity-50'}`}
                    >
                      <span className="d-flex align-items-center gap-2 flex-grow-1 min-w-0 text-ink">
                        <FileText size={14} className="text-brand flex-shrink-0" />
                        <span className="text-truncate min-w-0">{e.nome}</span>
                      </span>
                      <span className="d-flex align-items-center gap-2 flex-shrink-0">
                        {e.validado === true && <CheckCircle2 size={14} className="text-success" />}
                        {e.validado === false && <XCircle size={14} className="text-danger" />}
                        <Download size={13} className="text-muted" />
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="col-lg-7">
          <Card>
            <h2 className="fw-semibold text-ink mb-4 d-flex align-items-center gap-2">
              <Clock size={18} className="text-brand" /> {t('adminPedidoDetail.historico')}
            </h2>
            {timeline.length === 0 ? (
              <p className="small text-muted mb-0">{t('adminPedidoDetail.semHistorico')}</p>
            ) : (
              <div className="d-flex flex-column">
                {timeline.map((h, i) => {
                  const fase = FASE[h.code] || FASE.OPEN
                  const Icon = fase.icon
                  const ultimo = i === timeline.length - 1
                  return (
                    <div key={h.id ?? i} className="d-flex gap-3">
                      <div className="d-flex flex-column align-items-center flex-shrink-0">
                        <span
                          className="d-flex align-items-center justify-content-center rounded-circle text-white"
                          style={{ height: '1.75rem', width: '1.75rem', backgroundColor: fase.cor }}
                        >
                          <Icon size={13} />
                        </span>
                        {!ultimo && <span className="flex-grow-1 bg-light" style={{ width: '2px', minHeight: '1rem' }} />}
                      </div>
                      <div className={ultimo ? '' : 'pb-4'}>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-semibold text-ink">{h.estado}</span>
                          {h.estadoAnterior && <span className="fs-xs text-muted">← {h.estadoAnterior}</span>}
                        </div>
                        <p className="fs-xs text-muted mb-1">
                          {h.autor && <span className="fw-medium">{h.autor}</span>}
                          {h.autor && ' · '}{h.data}
                        </p>
                        {h.motivo && (
                          <p className="small text-ink mb-0 rounded-3 bg-light px-3 py-2">{h.motivo}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
