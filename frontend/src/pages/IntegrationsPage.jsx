import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Hash,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Toggle } from '../components/ui'
import * as api from '../services/api'

const PLATFORMS = {
  slack: {
    icon: Hash,
    name: 'Slack',
    docs: 'https://api.slack.com/messaging/webhooks',
  },
  teams: {
    icon: MessageSquare,
    name: 'Microsoft Teams',
    docs: 'https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
  },
}

export default function IntegrationsPage() {
  const { t } = useTranslation()
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [platform, setPlatform] = useState('slack')
  const [label, setLabel] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [feedback, setFeedback] = useState(null)

  const current = useMemo(
    () => integrations.find((item) => item.platform === platform),
    [integrations, platform],
  )

  async function loadIntegrations() {
    try {
      setIntegrations(await api.getIntegrations())
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    api.getIntegrations()
      .then((rows) => {
        if (cancelled) return
        setIntegrations(rows)
        setLabel(rows.find((item) => item.platform === 'slack')?.label || '')
      })
      .catch((error) => {
        if (!cancelled) setFeedback({ type: 'danger', message: error.message })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function selectPlatform(value) {
    setPlatform(value)
    setLabel(integrations.find((item) => item.platform === value)?.label || '')
    setWebhookUrl('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await api.saveIntegration({
        platform,
        label,
        ...(webhookUrl.trim() ? { webhookUrl: webhookUrl.trim() } : {}),
      })
      setFeedback({ type: 'success', message: t('integracoes.feedback.guardada') })
      setWebhookUrl('')
      await loadIntegrations()
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function test(integration) {
    setBusyId(integration.id)
    setFeedback(null)
    try {
      const result = await api.testIntegration(integration.id)
      setFeedback({ type: 'success', message: result.mensagem || t('integracoes.feedback.teste') })
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message })
    } finally {
      setBusyId(null)
    }
  }

  async function toggle(integration, active) {
    setBusyId(integration.id)
    setFeedback(null)
    try {
      await api.updateIntegration(integration.id, { active })
      await loadIntegrations()
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message })
    } finally {
      setBusyId(null)
    }
  }

  async function remove(integration) {
    if (!window.confirm(t('integracoes.confirmarRemocao', { platform: PLATFORMS[integration.platform]?.name }))) return
    setBusyId(integration.id)
    setFeedback(null)
    try {
      await api.deleteIntegration(integration.id)
      setFeedback({ type: 'success', message: t('integracoes.feedback.removida') })
      if (integration.platform === platform) setLabel('')
      await loadIntegrations()
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <Link to="/perfil" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
          <ArrowLeft size={16} /> {t('integracoes.voltar')}
        </Link>
        <h1 className="d-flex align-items-center gap-2 fs-2 fw-bold text-ink">
          <MessageSquare className="text-brand" /> {t('integracoes.titulo')}
        </h1>
        <p className="mt-1 small text-muted">{t('integracoes.subtitulo')}</p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} mb-0`} role="alert">
          {feedback.message}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('integracoes.configurar')}</h2>

            <div className="row g-2 mb-4">
              {Object.entries(PLATFORMS).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div className="col-sm-6" key={key}>
                    <button
                      type="button"
                      onClick={() => selectPlatform(key)}
                      className={`w-100 rounded-3 border p-3 d-flex align-items-center gap-3 text-start ${
                        platform === key ? 'border-brand bg-brand-light text-brand' : 'bg-white text-ink'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="fw-semibold">{config.name}</span>
                      {integrations.some((item) => item.platform === key) && (
                        <CheckCircle2 className="ms-auto text-success" size={18} />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            <form onSubmit={save} className="d-flex flex-column gap-3">
              <label>
                <span className="mb-2 d-block small fw-medium text-ink">{t('integracoes.nomeCanal')}</span>
                <input
                  className="form-control"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder={t('integracoes.nomeCanalPlaceholder')}
                  maxLength={500}
                />
              </label>

              <label>
                <span className="mb-2 d-block small fw-medium text-ink">{t('integracoes.webhook')}</span>
                <input
                  className="form-control"
                  type="url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://..."
                  autoComplete="off"
                  required={!current?.configured}
                />
                <span className="mt-1 d-block fs-xs text-muted">
                  {current ? t('integracoes.webhookAtualizar') : t('integracoes.webhookAjuda')}
                </span>
              </label>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                <a
                  href={PLATFORMS[platform].docs}
                  target="_blank"
                  rel="noreferrer"
                  className="small text-brand text-decoration-none d-inline-flex align-items-center gap-1"
                >
                  {t('integracoes.criarWebhook', { platform: PLATFORMS[platform].name })}
                  <ExternalLink size={14} />
                </a>
                <button type="submit" className="btn btn-brand" disabled={saving}>
                  {saving ? (
                    <span className="d-inline-flex align-items-center gap-2"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {t('integracoes.aGuardar')}</span>
                  ) : current ? t('integracoes.atualizar') : t('integracoes.ligar')}
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="col-lg-5 d-flex flex-column gap-4">
          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('integracoes.ligacoes')}</h2>
            {loading ? (
              <p className="small text-muted mb-0">{t('common.carregando')}</p>
            ) : integrations.length === 0 ? (
              <p className="small text-muted mb-0">{t('integracoes.vazio')}</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {integrations.map((integration) => {
                  const config = PLATFORMS[integration.platform] || PLATFORMS.slack
                  const Icon = config.icon
                  const busy = busyId === integration.id
                  return (
                    <div className="rounded-3 border p-3" key={integration.id}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-3 bg-brand-light p-2 text-brand"><Icon size={20} /></div>
                        <div className="min-w-0 flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <p className="fw-semibold text-ink mb-0">{config.name}</p>
                            <Toggle
                              checked={integration.active}
                              onChange={(value) => toggle(integration, value)}
                              disabled={busy}
                            />
                          </div>
                          <p className="small text-muted mb-1">{integration.label}</p>
                          <p className="fs-xs text-muted text-truncate mb-0" title={integration.webhookMasked}>
                            {integration.webhookMasked}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                          onClick={() => test(integration)}
                          disabled={busy || !integration.active}
                        >
                          <Send size={14} /> {t('integracoes.testar')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(integration)}
                          disabled={busy}
                          aria-label={t('integracoes.remover')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="rounded-3 border bg-light p-3 small text-muted">
            <p className="d-flex align-items-center gap-2 fw-semibold text-ink mb-1">
              <ShieldCheck size={17} className="text-success" /> {t('integracoes.segurancaTitulo')}
            </p>
            <p className="mb-0 fs-xs">{t('integracoes.segurancaTexto')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
