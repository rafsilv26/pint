import Logo from '../Logo'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Moldura das páginas de autenticação (login / registo / recuperar password).
// Painel azul com a marca à esquerda, formulário centrado à direita.
export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useTranslation() // <-- Inicializa a tradução

  return (
    <div className="d-flex min-vh-100">
      {/* Painel da marca (escondido em ecrãs pequenos) */}
      <div className="position-relative d-none d-lg-flex align-items-center justify-content-center overflow-hidden bg-gradient-brand w-50">
        <div className="text-center text-white">
          <Logo height={48} className="mx-auto" textClassName="fs-1" />
          <p className="mt-3 text-white-50">{t('authShell.plataforma')}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4">
        <div className="w-100" style={{ maxWidth: '24rem' }}>
          <div className="mb-4 text-center">
            <h1 className="fs-3 fw-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 small text-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-4 text-center small text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
