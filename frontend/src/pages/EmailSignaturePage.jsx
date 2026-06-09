import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Copy, Download, Award, Phone, MapPin, Info } from 'lucide-react'
import { Card, Toggle } from '../components/ui'
import * as api from '../services/api'

function gerarHTML(d) {
  return `<table style="font-family:Arial,sans-serif;color:#1f2330">
  <tr>
    <td style="padding-right:16px;border-right:2px solid #1e6cab">
      <div style="width:48px;height:48px;border-radius:8px;background:#1e6cab;color:#fff;font-weight:bold;font-size:24px;text-align:center;line-height:48px">${(d.nome[0] || 'S')}</div>
    </td>
    <td style="padding-left:16px">
      <strong>${d.nome}</strong><br/>
      <span style="color:#6b7280">${d.cargo}</span><br/>
      ${d.email} · ${d.telefone}<br/>
      <span style="color:#6b7280">${d.localizacao}</span>
    </td>
  </tr>
</table>`
}

function Campo({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  )
}

export default function EmailSignaturePage() {
  const [d, setD] = useState({
    nome: 'Rafael Silva',
    cargo: 'Consultor',
    email: 'rafael@softinsa.pt',
    telefone: '+351 912 345 678',
    localizacao: 'Santa Maria da Feira, Portugal',
  })
  const [mostrarBadges, setMostrarBadges] = useState(true)
  const [copiado, setCopiado] = useState(false)

  // Carrega a assinatura guardada (popula os campos)
  useEffect(() => {
    api.getEmailSignature()
      .then((s) =>
        setD((cur) => ({
          ...cur,
          nome: s.nome || cur.nome,
          cargo: s.cargo || cur.cargo,
          email: s.email || cur.email,
          telefone: s.telefone || cur.telefone,
          localizacao: s.localizacao || cur.localizacao,
        }))
      )
      .catch(() => {})
  }, [])

  const set = (k) => (v) => setD({ ...d, [k]: v })
  const iniciais = (d.nome[0] || 'S').toUpperCase()

  function copiarHTML() {
    const html = gerarHTML(d)
    navigator.clipboard?.writeText(html).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
    // Persiste a assinatura no backend (quando ligado à API real)
    api.saveEmailSignature({ templateHtml: html }).catch(() => {})
  }

  return (
    <div>
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Perfil
      </Link>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Mail className="text-brand" /> Assinatura de Email
        </h1>
        <p className="mt-1 text-sm text-muted">Cria a tua assinatura profissional com badges</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Esquerda — formulário */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-ink">Informações Pessoais</h2>
            <div className="space-y-4">
              <Campo label="Nome Completo" value={d.nome} onChange={set('nome')} />
              <Campo label="Cargo" value={d.cargo} onChange={set('cargo')} />
              <Campo label="Email" value={d.email} onChange={set('email')} />
              <Campo label="Telefone" value={d.telefone} onChange={set('telefone')} />
              <Campo label="Localização" value={d.localizacao} onChange={set('localizacao')} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <Award size={18} className="text-brand" /> Badges e Certificações
              </h2>
              <Toggle checked={mostrarBadges} onChange={setMostrarBadges} />
            </div>
            <p className="mt-1 text-sm text-muted">Mostrar os badges conquistados na assinatura</p>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-ink">Exportar Assinatura</h2>
            <button
              onClick={copiarHTML}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <Copy size={16} /> {copiado ? 'Copiado ✓' : 'Copiar HTML'}
            </button>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-50">
              <Download size={16} /> Baixar Ficheiro
            </button>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0 text-brand" />
              Copia o HTML e cola-o na configuração de assinatura do teu cliente de email (Gmail, Outlook, etc.).
            </div>
          </Card>
        </div>

        {/* Direita — pré-visualização + instruções */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-ink">Pré-visualização</h2>
            <div className="flex items-start gap-4 rounded-xl border border-gray-200 p-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-brand text-2xl font-bold text-white">
                {iniciais}
              </div>
              <div className="border-l-2 border-brand pl-4 text-sm">
                <p className="font-semibold text-ink">{d.nome}</p>
                <p className="text-muted">{d.cargo}</p>
                <p className="mt-1 flex items-center gap-1 text-muted"><Mail size={12} /> {d.email}</p>
                <p className="flex items-center gap-1 text-muted"><Phone size={12} /> {d.telefone}</p>
                <p className="flex items-center gap-1 text-muted"><MapPin size={12} /> {d.localizacao}</p>
                {mostrarBadges && (
                  <div className="mt-2 flex gap-1.5">
                    <span className="grid h-6 w-6 place-items-center rounded bg-sky-100 text-sky-600"><Award size={13} /></span>
                    <span className="grid h-6 w-6 place-items-center rounded bg-emerald-100 text-emerald-600"><Award size={13} /></span>
                    <span className="grid h-6 w-6 place-items-center rounded bg-orange-100 text-orange-600"><Award size={13} /></span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">Como adicionar ao teu email</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-ink">Outlook</p>
                <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-muted">
                  <li>Clica em "Copiar HTML" acima</li>
                  <li>Abre Outlook → Ficheiro → Opções → Email → Assinaturas</li>
                  <li>Cria uma nova e cola (Ctrl+V)</li>
                  <li>Clica em "OK" para guardar</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-ink">Gmail</p>
                <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-muted">
                  <li>Clica em "Copiar HTML" acima</li>
                  <li>Abre Gmail → Definições → Ver todas as definições</li>
                  <li>Na secção "Assinatura", cria uma nova e cola</li>
                  <li>Guarda as alterações ao fundo</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
