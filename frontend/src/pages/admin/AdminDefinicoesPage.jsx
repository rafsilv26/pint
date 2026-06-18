import { useState } from 'react'
import { Settings, Clock, Bell } from 'lucide-react'
import { PageHeader, Card, Toggle } from '../../components/ui'

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

export default function AdminDefinicoesPage() {
  const [sla, setSla] = useState({ dias: 5, alertas: true })
  const [notif, setNotif] = useState({ email: true, push: false })
  const [guardado, setGuardado] = useState(false)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Definições" subtitle="Configurações gerais da plataforma." />

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink"><Clock size={18} className="text-brand" /> SLA</h2>
        <label className="block py-3">
          <span className="mb-1 block text-sm font-medium text-ink">Dias de resposta</span>
          <input
            type="number"
            value={sla.dias}
            onChange={(e) => setSla({ ...sla, dias: Number(e.target.value) })}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <ToggleRow label="Alertas de SLA" desc="Enviar avisos quando um pedido se aproxima do prazo" checked={sla.alertas} onChange={(v) => setSla({ ...sla, alertas: v })} />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink"><Bell size={18} className="text-brand" /> Notificações da plataforma</h2>
        <ToggleRow label="Notificações por Email" checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
        <ToggleRow label="Notificações Push" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
      </Card>

      <button
        onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) }}
        className="mt-6 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        {guardado ? 'Definições guardadas ✓' : 'Guardar Definições'}
      </button>
    </div>
  )
}
