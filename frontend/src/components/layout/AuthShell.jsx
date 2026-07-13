import { Award, Trophy, ShieldCheck } from 'lucide-react'
import Logo from '../Logo'
import { useTranslation } from 'react-i18next'

// Moldura das páginas de autenticação (login / registo / recuperar password).
// Painel de marca à esquerda com destaques da plataforma; formulário à direita.
export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useTranslation()

  const destaques = [
    { icon: Award, texto: t('authShell.features.credenciais') },
    { icon: Trophy, texto: t('authShell.features.gamificacao') },
    { icon: ShieldCheck, texto: t('authShell.features.verificavel') },
  ]

  return (
    <div className="d-flex min-vh-100">
      {/* Painel da marca (escondido em ecrãs pequenos) */}
      <div className="position-relative d-none d-lg-flex flex-column justify-content-center overflow-hidden bg-gradient-brand w-50 px-5">
        {/* Círculos decorativos translúcidos para dar profundidade */}
        <span className="position-absolute rounded-circle bg-white" style={{ opacity: 0.06, width: '22rem', height: '22rem', top: '-6rem', right: '-6rem' }} />
        <span className="position-absolute rounded-circle bg-white" style={{ opacity: 0.05, width: '14rem', height: '14rem', bottom: '-3rem', left: '-3rem' }} />

        <div className="position-relative text-white" style={{ maxWidth: '26rem' }}>
          <Logo height={52} textClassName="fs-1" />
          <h2 className="mt-4 fw-bold" style={{ lineHeight: 1.25 }}>{t('authShell.headline')}</h2>
          <p className="mt-2 text-white-50">{t('authShell.plataforma')}</p>

          <ul className="list-unstyled mt-4 mb-0 d-flex flex-column gap-3">
            {destaques.map((d) => (
              <li key={d.texto} className="d-flex align-items-center gap-3">
                <span className="d-flex align-items-center justify-content-center rounded-3 bg-white bg-opacity-10 flex-shrink-0" style={{ height: '2.5rem', width: '2.5rem' }}>
                  <d.icon size={18} />
                </span>
                <span className="small fw-medium">{d.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Formulário */}
      <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
        <div className="w-100 rounded-4 bg-white border shadow-sm p-4 p-sm-5" style={{ maxWidth: '26rem' }}>
          {/* Marca em ecrãs pequenos (painel de marca escondido) */}
          <p className="d-lg-none text-center fw-bold text-brand fs-4 mb-3">SOFTINSA</p>
          <div className="mb-4 text-center">
            <h1 className="fs-3 fw-bold text-ink mb-0">{title}</h1>
            {subtitle && <p className="mt-1 small text-muted mb-0">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-4 text-center small text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
