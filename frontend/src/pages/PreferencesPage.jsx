import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Bell, Eye, Shield, Sun, Moon, Monitor, Info, ArrowLeft } from 'lucide-react'
import { Card, Toggle } from '../components/ui'

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
            value === o.value ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-muted hover:border-gray-300'
          }`}
        >
          {o.icon && <o.icon size={16} />} {o.label}
        </button>
      ))}
    </div>
  )
}

export default function PreferencesPage() {
  const [notif, setNotif] = useState({ email: true, aprovado: true, rejeitado: true, novos: true, ranking: false, semanal: true, mensal: false })
  const [priv, setPriv] = useState({ publico: true, diretorio: true, badges: true, pontos: true })
  const [idioma, setIdioma] = useState('pt')
  const [tema, setTema] = useState('claro')
  const [mostrarImagens, setMostrarImagens] = useState(true)
  const [badgesPorPagina, setBadgesPorPagina] = useState(12)
  const [guardado, setGuardado] = useState(false)

  const upd = (obj, setter, key) => (v) => setter({ ...obj, [key]: v })

  return (
    <div>
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Perfil
      </Link>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Settings className="text-brand" /> Preferências
        </h1>
        <p className="mt-1 text-sm text-muted">Personaliza a tua experiência na plataforma</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Notificações */}
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <Bell size={18} className="text-brand" /> Notificações
            </h2>
            <ToggleRow label="Notificações por Email" desc="Recebe notificações no teu email" checked={notif.email} onChange={upd(notif, setNotif, 'email')} />
            <ToggleRow label="Badge Aprovado" desc="Quando uma candidatura é aprovada" checked={notif.aprovado} onChange={upd(notif, setNotif, 'aprovado')} />
            <ToggleRow label="Badge Rejeitado ou Send Back" desc="Quando uma candidatura é rejeitada ou devolvida" checked={notif.rejeitado} onChange={upd(notif, setNotif, 'rejeitado')} />
            <ToggleRow label="Novos Badges Disponíveis" desc="Quando há novos badges para te candidatares" checked={notif.novos} onChange={upd(notif, setNotif, 'novos')} />
            <ToggleRow label="Atualizações de Ranking" desc="Mudanças significativas na tua posição" checked={notif.ranking} onChange={upd(notif, setNotif, 'ranking')} />
            <ToggleRow label="Resumo Semanal" desc="Email semanal com o teu progresso" checked={notif.semanal} onChange={upd(notif, setNotif, 'semanal')} />
            <ToggleRow label="Relatório Mensal" desc="Relatório detalhado das tuas conquistas" checked={notif.mensal} onChange={upd(notif, setNotif, 'mensal')} />
          </Card>

          {/* Visualização */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
              <Eye size={18} className="text-brand" /> Visualização
            </h2>
            <p className="mb-2 text-sm font-medium text-ink">Idioma</p>
            <Segmented
              options={[
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
              value={idioma}
              onChange={setIdioma}
            />
            <p className="mb-2 mt-5 text-sm font-medium text-ink">Tema</p>
            <Segmented
              options={[
                { value: 'claro', label: 'Claro', icon: Sun },
                { value: 'escuro', label: 'Escuro', icon: Moon },
                { value: 'auto', label: 'Automático', icon: Monitor },
              ]}
              value={tema}
              onChange={setTema}
            />
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">Badges por Página</span>
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
              <ToggleRow label="Mostrar imagens dos Badges" checked={mostrarImagens} onChange={setMostrarImagens} />
            </div>
          </Card>

          {/* Privacidade */}
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <Shield size={18} className="text-brand" /> Privacidade
            </h2>
            <ToggleRow label="Perfil Público" desc="Permite que outros consultores vejam o teu perfil" checked={priv.publico} onChange={upd(priv, setPriv, 'publico')} />
            <ToggleRow label="Aparecer no Diretório" desc="Surge na lista de consultores" checked={priv.diretorio} onChange={upd(priv, setPriv, 'diretorio')} />
            <ToggleRow label="Mostrar Badges Publicamente" desc="Exibe os teus badges no perfil público" checked={priv.badges} onChange={upd(priv, setPriv, 'badges')} />
            <ToggleRow label="Mostrar Pontos Publicamente" desc="Exibe a tua pontuação no ranking" checked={priv.pontos} onChange={upd(priv, setPriv, 'pontos')} />
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <Card className="bg-brand-50">
            <h3 className="font-semibold text-ink">Resumo das Configurações</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Notificações Email</dt><dd className="font-medium text-ink">{notif.email ? 'Ativadas' : 'Desativadas'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Idioma</dt><dd className="font-medium text-ink">{idioma === 'pt' ? 'Português' : idioma === 'en' ? 'English' : 'Español'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tema</dt><dd className="font-medium text-ink capitalize">{tema}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Perfil Público</dt><dd className="font-medium text-ink">{priv.publico ? 'Sim' : 'Não'}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink">As tuas Estatísticas</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Pontos</dt><dd className="font-semibold text-brand">1250</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Badges</dt><dd className="font-semibold text-ink">8</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Ranking</dt><dd className="font-semibold text-brand">#12</dd></div>
            </dl>
          </Card>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-amber-900"><Info size={15} /> Dica</p>
            <p className="mt-1 text-xs text-amber-800/80">As preferências são guardadas e aplicadas em todos os dispositivos onde acederes à plataforma.</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }}
        className="mt-6 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        {guardado ? 'Preferências guardadas ✓' : 'Guardar Preferências'}
      </button>
    </div>
  )
}
