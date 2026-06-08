// Pequenos componentes reutilizáveis de UI (estilo Softinsa).

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Spinner({ label = 'A carregar…' }) {
  return (
    <div className="flex items-center gap-3 py-10 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
      {label}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
      {Icon && <Icon size={36} className="mb-3 text-gray-400" />}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    </div>
  )
}

const STATUS_CORES = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-800',
  indigo: 'bg-indigo-100 text-indigo-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
}

export function StatusPill({ status }) {
  const cor = STATUS_CORES[status?.cor] || STATUS_CORES.gray
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cor}`}>
      {status?.name || '—'}
    </span>
  )
}

export function Field({ label, hint, icon: Icon, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <span className="relative block">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          className={`w-full rounded-lg border border-gray-300 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            Icon ? 'pl-10 pr-3.5' : 'px-3.5'
          }`}
          {...props}
        />
      </span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantes = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-gray-300 bg-white text-ink hover:bg-gray-50',
    ghost: 'text-brand hover:bg-brand-light',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
