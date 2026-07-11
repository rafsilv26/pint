import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="d-flex flex-column align-items-center justify-content-center rounded-3 border border-danger-subtle bg-danger-subtle py-5 text-center">
      <AlertCircle size={36} className="mb-3 text-danger" />
      <p className="fw-semibold text-ink mb-0">{message || t('ui.error.defaultMessage')}</p>
      <p className="mt-1 mb-0 text-muted small" style={{ maxWidth: '24rem' }}>{t('ui.error.hint')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm mt-3">
          {t('ui.error.retry')}
        </button>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 d-flex flex-wrap align-items-end justify-content-between gap-3">
      <div>
        <h1 className="h3 fw-bold text-ink mb-0">{title}</h1>
        {subtitle && <p className="mt-1 mb-0 text-muted small">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`card border rounded-3 shadow-sm p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Spinner({ label }) {
  const { t } = useTranslation()
  return (
    <div className="d-flex align-items-center gap-3 py-5 text-muted">
      <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
      {label || t('ui.spinner.loading')}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center rounded-3 border border-dashed bg-white py-5 text-center">
      {Icon && <Icon size={36} className="mb-3 text-secondary" />}
      <p className="fw-semibold text-ink mb-0">{title}</p>
      {description && <p className="mt-1 mb-0 text-muted small" style={{ maxWidth: '24rem' }}>{description}</p>}
    </div>
  )
}

const STATUS_CORES = {
  gray: 'text-bg-secondary',
  blue: 'text-bg-primary',
  amber: 'text-bg-warning',
  indigo: 'text-bg-info',
  green: 'text-bg-success',
  red: 'text-bg-danger',
}

export function StatusPill({ status }) {
  const cor = STATUS_CORES[status?.cor] || STATUS_CORES.gray
  return (
    <span className={`badge rounded-pill fw-medium ${cor}`}>
      {status?.name || '—'}
    </span>
  )
}

export function Field({ label, hint, icon: Icon, ...props }) {
  return (
    <label className="d-block">
      {label && <span className="mb-1 d-block small fw-medium text-ink">{label}</span>}
      {Icon ? (
        <div className="input-group">
          <span className="input-group-text bg-white">
            <Icon size={16} className="text-secondary" />
          </span>
          <input className="form-control" {...props} />
        </div>
      ) : (
        <input className="form-control" {...props} />
      )}
      {hint && <span className="mt-1 d-block fs-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantes = {
    primary: 'btn-primary',
    secondary: 'btn-outline-secondary bg-white',
    ghost: 'btn-link text-decoration-none',
    danger: 'btn-outline-danger bg-white',
  }
  return (
    <button
      className={`btn d-inline-flex align-items-center justify-content-center gap-2 fw-semibold ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <div className="form-check form-switch mb-0">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}
