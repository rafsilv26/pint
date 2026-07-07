import Logo from '../Logo'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Moldura das páginas de autenticação (login / registo / recuperar password).
// Painel azul com a marca à esquerda, formulário centrado à direita.
export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useTranslation() // <-- Inicializa a tradução

  return (
    <div className="flex min-h-screen">
      {/* Painel da marca (escondido em ecrãs pequenos) */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-r from-brand-dark via-brand to-brand-accent lg:flex">
        <div className="text-center text-white">
          <Logo className="mx-auto h-12 w-auto" textClassName="text-5xl" />
          <p className="mt-3 text-white/70">{t('authShell.plataforma')}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}