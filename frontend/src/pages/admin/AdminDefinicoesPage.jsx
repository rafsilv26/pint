import { useState } from 'react'
import { Settings, Clock, Bell } from 'lucide-react'
import { PageHeader, Card, Toggle } from '../../components/ui'
import { useTranslation } from 'react-i18next' // <-- Import do hook

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

export default function AdminDefinicoesPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [sla, setSla] = useState({ dias: 5, alertas: true })
  const [notif, setNotif] = useState({ email: true, push: false })
  const [guardado, setGuardado] = useState(false)

  return (
    <div className="mx-auto" style={{ maxWidth: '42rem' }}>
      <PageHeader
        title={t('adminDefinicoes.titulo')}
        subtitle={t('adminDefinicoes.subtitulo')}
      />

      <Card>
        <h2 className="mb-2 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Clock size={18} className="text-brand" /> {t('adminDefinicoes.sla.titulo')}
        </h2>
        <label className="d-block py-3">
          <span className="mb-2 d-block small fw-medium text-ink">{t('adminDefinicoes.sla.dias')}</span>
          <input
            type="number"
            value={sla.dias}
            onChange={(e) => setSla({ ...sla, dias: Number(e.target.value) })}
            className="form-control"
            style={{ width: '8rem' }}
          />
        </label>
        <ToggleRow
          label={t('adminDefinicoes.sla.alertasLabel')}
          desc={t('adminDefinicoes.sla.alertasDesc')}
          checked={sla.alertas}
          onChange={(v) => setSla({ ...sla, alertas: v })}
        />
      </Card>

      <Card className="mt-4">
        <h2 className="mb-2 d-flex align-items-center gap-2 fw-semibold text-ink">
          <Bell size={18} className="text-brand" /> {t('adminDefinicoes.notificacoes.titulo')}
        </h2>
        <ToggleRow
          label={t('adminDefinicoes.notificacoes.email')}
          checked={notif.email}
          onChange={(v) => setNotif({ ...notif, email: v })}
        />
        <ToggleRow
          label={t('adminDefinicoes.notificacoes.push')}
          checked={notif.push}
          onChange={(v) => setNotif({ ...notif, push: v })}
        />
      </Card>

      <button
        onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }}
        className="mt-4 btn btn-brand w-100 py-2 fw-semibold"
      >
        {guardado ? t('adminDefinicoes.botoes.guardado') : t('adminDefinicoes.botoes.guardar')}
      </button>
    </div>
  )
}
