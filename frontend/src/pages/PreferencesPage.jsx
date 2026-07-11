import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Bell, Eye, Shield, Sun, Moon, Monitor, Info, ArrowLeft } from 'lucide-react'
import { Card, Toggle } from '../components/ui'
import { useTranslation } from 'react-i18next'

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 border-bottom py-3">
      <div>
        <p className="small fw-medium text-ink mb-0">{label}</p>
        {desc && <p className="fs-xs text-muted mb-0">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="row row-cols-3 g-2">
      {options.map((o) => (
        <div className="col" key={o.value}>
          <button
            onClick={() => onChange(o.value)}
            className={`w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 border py-2 small fw-medium ${
              value === o.value ? 'border-brand bg-brand-light text-brand' : 'text-muted'
            }`}
          >
            {o.icon && <o.icon size={16} />} {o.label}
          </button>
        </div>
      ))}
    </div>
  )
}

export default function PreferencesPage() {
  const { t, i18n } = useTranslation()

  const [notif, setNotif] = useState({
    email: true, aprovado: true, rejeitado: true,
    novos: true, ranking: false, semanal: true, mensal: false
  })
  const [priv, setPriv] = useState({
    publico: true, diretorio: true, badges: true, pontos: true
  })
  const [tema, setTema] = useState('claro')
  const [mostrarImagens, setMostrarImagens] = useState(true)
  const [badgesPorPagina, setBadgesPorPagina] = useState(12)
  const [guardado, setGuardado] = useState(false)

  const upd = (obj, setter, key) => (v) => setter({ ...obj, [key]: v })

  // Muda o idioma e guarda no localStorage
  const mudarIdioma = (novoIdioma) => {
    i18n.changeLanguage(novoIdioma)
  }

  return (
    <div>
      <Link to="/perfil" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('preferencias.voltar')}
      </Link>

      <div className="mb-4">
        <h1 className="d-flex align-items-center gap-2 fs-2 fw-bold text-ink">
          <Settings className="text-brand" /> {t('preferencias.titulo')}
        </h1>
        <p className="mt-1 small text-muted">{t('preferencias.subtitulo')}</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">

          {/* Notificações */}
          <Card>
            <h2 className="mb-2 d-flex align-items-center gap-2 fw-semibold text-ink">
              <Bell size={18} className="text-brand" /> {t('preferencias.notificacoes.titulo')}
            </h2>
            <ToggleRow label={t('preferencias.notificacoes.email')} desc={t('preferencias.notificacoes.emailDesc')} checked={notif.email} onChange={upd(notif, setNotif, 'email')} />
            <ToggleRow label={t('preferencias.notificacoes.aprovado')} desc={t('preferencias.notificacoes.aprovadoDesc')} checked={notif.aprovado} onChange={upd(notif, setNotif, 'aprovado')} />
            <ToggleRow label={t('preferencias.notificacoes.rejeitado')} desc={t('preferencias.notificacoes.rejeitadoDesc')} checked={notif.rejeitado} onChange={upd(notif, setNotif, 'rejeitado')} />
            <ToggleRow label={t('preferencias.notificacoes.novos')} desc={t('preferencias.notificacoes.novosDesc')} checked={notif.novos} onChange={upd(notif, setNotif, 'novos')} />
            <ToggleRow label={t('preferencias.notificacoes.ranking')} desc={t('preferencias.notificacoes.rankingDesc')} checked={notif.ranking} onChange={upd(notif, setNotif, 'ranking')} />
            <ToggleRow label={t('preferencias.notificacoes.semanal')} desc={t('preferencias.notificacoes.semanalDesc')} checked={notif.semanal} onChange={upd(notif, setNotif, 'semanal')} />
            <ToggleRow label={t('preferencias.notificacoes.mensal')} desc={t('preferencias.notificacoes.mensalDesc')} checked={notif.mensal} onChange={upd(notif, setNotif, 'mensal')} />
          </Card>

          {/* Visualização */}
          <Card>
            <h2 className="mb-3 d-flex align-items-center gap-2 fw-semibold text-ink">
              <Eye size={18} className="text-brand" /> {t('preferencias.visualizacao.titulo')}
            </h2>

            {/* Seletor de Idioma */}
            <p className="mb-2 small fw-medium text-ink">{t('preferencias.visualizacao.idioma')}</p>
            <Segmented
              options={[
                { value: 'pt', label: '🇵🇹 Português' },
                { value: 'en', label: '🇬🇧 English' },
                { value: 'es', label: '🇪🇸 Español' },
              ]}
              value={i18n.language.substring(0, 2)}
              onChange={mudarIdioma}
            />

            {/* Tema */}
            <p className="mb-2 mt-4 small fw-medium text-ink">{t('preferencias.visualizacao.tema')}</p>
            <Segmented
              options={[
                { value: 'claro', label: t('preferencias.visualizacao.claro'), icon: Sun },
                { value: 'escuro', label: t('preferencias.visualizacao.escuro'), icon: Moon },
                { value: 'auto', label: t('preferencias.visualizacao.auto'), icon: Monitor },
              ]}
              value={tema}
              onChange={setTema}
            />

            <div className="mt-4">
              <div className="mb-1 d-flex align-items-center justify-content-between small">
                <span className="fw-medium text-ink">{t('preferencias.visualizacao.badgesPorPagina')}</span>
                <span className="text-muted">{badgesPorPagina}</span>
              </div>
              <input
                type="range" min="6" max="24" step="6"
                value={badgesPorPagina}
                onChange={(e) => setBadgesPorPagina(Number(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="mt-3">
              <ToggleRow
                label={t('preferencias.visualizacao.mostrarImagens')}
                checked={mostrarImagens}
                onChange={setMostrarImagens}
              />
            </div>
          </Card>

          {/* Privacidade */}
          <Card>
            <h2 className="mb-2 d-flex align-items-center gap-2 fw-semibold text-ink">
              <Shield size={18} className="text-brand" /> {t('preferencias.privacidade.titulo')}
            </h2>
            <ToggleRow label={t('preferencias.privacidade.perfilPublico')} desc={t('preferencias.privacidade.perfilPublicoDesc')} checked={priv.publico} onChange={upd(priv, setPriv, 'publico')} />
            <ToggleRow label={t('preferencias.privacidade.diretorio')} desc={t('preferencias.privacidade.diretorioDesc')} checked={priv.diretorio} onChange={upd(priv, setPriv, 'diretorio')} />
            <ToggleRow label={t('preferencias.privacidade.badges')} desc={t('preferencias.privacidade.badgesDesc')} checked={priv.badges} onChange={upd(priv, setPriv, 'badges')} />
            <ToggleRow label={t('preferencias.privacidade.pontos')} desc={t('preferencias.privacidade.pontosDesc')} checked={priv.pontos} onChange={upd(priv, setPriv, 'pontos')} />
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="col-lg-4 d-flex flex-column gap-4">
          <Card className="bg-brand-light">
            <h3 className="fw-semibold text-ink">{t('preferencias.resumo.titulo')}</h3>
            <dl className="mt-2 d-flex flex-column gap-2 small mb-0">
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.resumo.notifEmail')}</dt>
                <dd className="fw-medium text-ink mb-0">
                  {notif.email ? t('preferencias.resumo.ativadas') : t('preferencias.resumo.desativadas')}
                </dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.resumo.idioma')}</dt>
                <dd className="fw-medium text-ink mb-0">
                  {i18n.language.startsWith('pt') ? '🇵🇹 Português' : i18n.language.startsWith('en') ? '🇬🇧 English' : '🇪🇸 Español'}
                </dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.resumo.tema')}</dt>
                <dd className="fw-medium text-ink text-capitalize mb-0">
                  {/* Busca a tradução do tema atual dinamicamente */}
                  {t(`preferencias.visualizacao.${tema}`)}
                </dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.resumo.perfilPublico')}</dt>
                <dd className="fw-medium text-ink mb-0">
                  {priv.publico ? t('preferencias.resumo.sim') : t('preferencias.resumo.nao')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="fw-semibold text-ink">{t('preferencias.estatisticas.titulo')}</h3>
            <dl className="mt-2 d-flex flex-column gap-2 small mb-0">
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.estatisticas.pontos')}</dt>
                <dd className="fw-semibold text-brand mb-0">1250</dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.estatisticas.badges')}</dt>
                <dd className="fw-semibold text-ink mb-0">8</dd>
              </div>
              <div className="d-flex justify-content-between">
                <dt className="text-muted fw-normal">{t('preferencias.estatisticas.ranking')}</dt>
                <dd className="fw-semibold text-brand mb-0">#12</dd>
              </div>
            </dl>
          </Card>

          <div className="rounded-3 border border-warning-subtle bg-warning-subtle p-3 small">
            <p className="d-flex align-items-center gap-2 fw-semibold text-warning-emphasis mb-0">
              <Info size={15} /> {t('preferencias.dica.titulo')}
            </p>
            <p className="mt-1 fs-xs text-warning-emphasis mb-0">{t('preferencias.dica.texto')}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }}
        className="mt-4 btn btn-brand w-100 py-2 fw-semibold"
      >
        {guardado ? t('preferencias.guardado') : t('preferencias.guardar')}
      </button>
    </div>
  )
}
