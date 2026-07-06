import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Bell, Eye, Shield, Sun, Moon, Monitor, Info, ArrowLeft } from 'lucide-react'
import { Card, Toggle } from '../components/ui'
import { useTranslation } from 'react-i18next'

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition ${
            value === o.value
              ? 'border-brand bg-brand-light text-brand'
              : 'border-gray-200 text-muted hover:border-gray-300'
          }`}
        >
          {o.icon && <o.icon size={16} />} {o.label}
        </button>
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
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('preferencias.voltar')}
      </Link>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Settings className="text-brand" /> {t('preferencias.titulo')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('preferencias.subtitulo')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Notificações */}
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
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
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
              <Eye size={18} className="text-brand" /> {t('preferencias.visualizacao.titulo')}
            </h2>

            {/* Seletor de Idioma */}
            <p className="mb-2 text-sm font-medium text-ink">{t('preferencias.visualizacao.idioma')}</p>
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
            <p className="mb-2 mt-5 text-sm font-medium text-ink">{t('preferencias.visualizacao.tema')}</p>
            <Segmented
              options={[
                { value: 'claro', label: t('preferencias.visualizacao.claro'), icon: Sun },
                { value: 'escuro', label: t('preferencias.visualizacao.escuro'), icon: Moon },
                { value: 'auto', label: t('preferencias.visualizacao.auto'), icon: Monitor },
              ]}
              value={tema}
              onChange={setTema}
            />

            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{t('preferencias.visualizacao.badgesPorPagina')}</span>
                <span className="text-muted">{badgesPorPagina}</span>
              </div>
              <input
                type="range" min="6" max="24" step="6"
                value={badgesPorPagina}
                onChange={(e) => setBadgesPorPagina(Number(e.target.value))}
                className="w-full accent-[var(--color-brand)]"
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
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <Shield size={18} className="text-brand" /> {t('preferencias.privacidade.titulo')}
            </h2>
            <ToggleRow label={t('preferencias.privacidade.perfilPublico')} desc={t('preferencias.privacidade.perfilPublicoDesc')} checked={priv.publico} onChange={upd(priv, setPriv, 'publico')} />
            <ToggleRow label={t('preferencias.privacidade.diretorio')} desc={t('preferencias.privacidade.diretorioDesc')} checked={priv.diretorio} onChange={upd(priv, setPriv, 'diretorio')} />
            <ToggleRow label={t('preferencias.privacidade.badges')} desc={t('preferencias.privacidade.badgesDesc')} checked={priv.badges} onChange={upd(priv, setPriv, 'badges')} />
            <ToggleRow label={t('preferencias.privacidade.pontos')} desc={t('preferencias.privacidade.pontosDesc')} checked={priv.pontos} onChange={upd(priv, setPriv, 'pontos')} />
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <Card className="bg-brand-50">
            <h3 className="font-semibold text-ink">{t('preferencias.resumo.titulo')}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.resumo.notifEmail')}</dt>
                <dd className="font-medium text-ink">
                  {notif.email ? t('preferencias.resumo.ativadas') : t('preferencias.resumo.desativadas')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.resumo.idioma')}</dt>
                <dd className="font-medium text-ink">
                  {i18n.language.startsWith('pt') ? '🇵🇹 Português' : i18n.language.startsWith('en') ? '🇬🇧 English' : '🇪🇸 Español'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.resumo.tema')}</dt>
                <dd className="font-medium text-ink capitalize">
                  {/* Busca a tradução do tema atual dinamicamente */}
                  {t(`preferencias.visualizacao.${tema}`)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.resumo.perfilPublico')}</dt>
                <dd className="font-medium text-ink">
                  {priv.publico ? t('preferencias.resumo.sim') : t('preferencias.resumo.nao')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink">{t('preferencias.estatisticas.titulo')}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.estatisticas.pontos')}</dt>
                <dd className="font-semibold text-brand">1250</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.estatisticas.badges')}</dt>
                <dd className="font-semibold text-ink">8</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('preferencias.estatisticas.ranking')}</dt>
                <dd className="font-semibold text-brand">#12</dd>
              </div>
            </dl>
          </Card>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Info size={15} /> {t('preferencias.dica.titulo')}
            </p>
            <p className="mt-1 text-xs text-amber-800/80">{t('preferencias.dica.texto')}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }}
        className="mt-6 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        {guardado ? t('preferencias.guardado') : t('preferencias.guardar')}
      </button>
    </div>
  )
}