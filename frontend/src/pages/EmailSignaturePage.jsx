import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, ArrowLeft, Copy, Download, Award, Phone, MapPin, Info } from 'lucide-react'
import { Card, Toggle } from '../components/ui'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

const escapeHtml = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function gerarHTML(d, badges = [], baseUrl = '') {
  return `<table style="font-family:Arial,sans-serif;color:#1f2330">
  <tr>
    <td style="padding-right:16px;border-right:2px solid #1e6cab">
      <div style="width:48px;height:48px;border-radius:8px;background:#1e6cab;color:#fff;font-weight:bold;font-size:24px;text-align:center;line-height:48px">${escapeHtml(d.nome[0] || 'S')}</div>
    </td>
    <td style="padding-left:16px">
      <strong>${escapeHtml(d.nome)}</strong><br/>
      <span style="color:#6b7280">${escapeHtml(d.cargo)}</span><br/>
      ${escapeHtml(d.email)} · ${escapeHtml(d.telefone)}<br/>
      <span style="color:#6b7280">${escapeHtml(d.localizacao)}</span>
      ${badges.length ? `<div style="margin-top:8px">${badges.map((badge) => `<a href="${escapeHtml(`${baseUrl}/badge/${badge.publicToken || ''}`)}" style="display:inline-block;margin-right:6px;text-decoration:none;color:#1e6cab" title="${escapeHtml(badge.title)}">${badge.imagePath ? `<img src="${escapeHtml(badge.imagePath)}" alt="${escapeHtml(badge.title)}" width="28" height="28" style="border:0;border-radius:4px;vertical-align:middle"/>` : `<span style="display:inline-block;padding:3px 6px;border:1px solid #dbeafe;border-radius:4px;font-size:11px">${escapeHtml(badge.title)}</span>`}</a>`).join('')}</div>` : ''}
    </td>
  </tr>
</table>`
}

function Campo({ label, value, onChange }) {
  return (
    <label className="d-block">
      <span className="mb-2 d-block small fw-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-control"
      />
    </label>
  )
}

export default function EmailSignaturePage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const location = useLocation()
  const backTo = location.pathname.startsWith('/tm') ? '/tm/conta' : '/perfil'

  const [d, setD] = useState({
    nome: '',
    cargo: t('assinatura.campos.consultorDefault'), // Tradução aplicada ao valor por defeito
    email: '',
    telefone: '',
    localizacao: '',
  })
  const [mostrarBadges, setMostrarBadges] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [badges, setBadges] = useState([])
  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState('')

  // Carrega a assinatura guardada (popula os campos)
  useEffect(() => {
    api.getEmailSignature()
      .then((s) => {
        setD((cur) => ({
          ...cur,
          nome: s.nome || cur.nome,
          cargo: s.cargo || cur.cargo,
          email: s.email || cur.email,
          telefone: s.telefone || cur.telefone,
          localizacao: s.localizacao || cur.localizacao,
        }))
        setBadges(s.badges || [])
        setSelected((s.badges || []).filter((badge) => badge.selected).map((badge) => badge.id))
      })
      .catch((error) => setMessage(error.message))
  }, [])

  const set = (k) => (v) => setD({ ...d, [k]: v })
  const iniciais = (d.nome[0] || 'S').toUpperCase()

  async function copiarHTML() {
    const chosen = mostrarBadges ? badges.filter((badge) => selected.includes(badge.id)) : []
    const html = gerarHTML(d, chosen, window.location.origin)
    const plainText = [d.nome, d.cargo, d.email, d.telefone, d.localizacao].filter(Boolean).join('\n')
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        })])
      } else {
        await navigator.clipboard?.writeText(html)
      }
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      setMessage(error.message)
      return
    }
    // Persiste a assinatura no backend (quando ligado à API real)
    if (chosen.length === 0) {
      setMessage(t('tmWorkspace.signature.persistenceRequiresBadge'))
      return
    }
    api.saveEmailSignature({ templateHtml: html, badgeIds: chosen.map((badge) => badge.id) })
      .then((result) => setMessage(result?.mensagem || t('api.mensagens.assinaturaGuardada')))
      .catch((error) => setMessage(error.message))
  }

  function descarregarHTML() {
    const chosen = mostrarBadges ? badges.filter((badge) => selected.includes(badge.id)) : []
    const blob = new Blob([gerarHTML(d, chosen, window.location.origin)], { type: 'text/html;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = 'assinatura-softinsa.html'
    link.click()
    URL.revokeObjectURL(href)
  }

  return (
    <div>
      <Link to={backTo} className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('assinatura.voltar')}
      </Link>

      <div className="mb-4">
        <h1 className="d-flex align-items-center gap-2 fs-2 fw-bold text-ink">
          <Mail className="text-brand" /> {t('assinatura.titulo')}
        </h1>
        <p className="mt-1 small text-muted">{t('assinatura.subtitulo')}</p>
      </div>

      <div className="row g-4">
        {/* Esquerda — formulário */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('assinatura.infoPessoais')}</h2>
            <div className="d-flex flex-column gap-3">
              <Campo label={t('assinatura.campos.nome')} value={d.nome} onChange={set('nome')} />
              <Campo label={t('assinatura.campos.cargo')} value={d.cargo} onChange={set('cargo')} />
              <Campo label={t('assinatura.campos.email')} value={d.email} onChange={set('email')} />
              <Campo label={t('assinatura.campos.telefone')} value={d.telefone} onChange={set('telefone')} />
              <Campo label={t('assinatura.campos.localizacao')} value={d.localizacao} onChange={set('localizacao')} />
            </div>
          </Card>

          <Card>
            <div className="d-flex align-items-center justify-content-between">
              <h2 className="d-flex align-items-center gap-2 fw-semibold text-ink mb-0">
                <Award size={18} className="text-brand" /> {t('assinatura.badgesTitulo')}
              </h2>
              <Toggle checked={mostrarBadges} onChange={setMostrarBadges} />
            </div>
            <p className="mt-1 small text-muted mb-0">{t('assinatura.badgesDesc')}</p>
            {mostrarBadges && badges.length > 0 && <div className="mt-3 d-flex flex-column gap-2">{badges.map((badge) => <label className="d-flex align-items-center gap-2 small" key={badge.id}><input type="checkbox" className="form-check-input mt-0" checked={selected.includes(badge.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, badge.id].slice(0, 4) : current.filter((id) => id !== badge.id))} />{badge.title}</label>)}</div>}
            {mostrarBadges && badges.length === 0 && <p className="mt-3 fs-xs text-muted mb-0">{t('tmWorkspace.signature.noBadges')}</p>}
          </Card>

          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('assinatura.exportarTitulo')}</h2>
            <button
              onClick={copiarHTML}
              className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <Copy size={16} /> {copiado ? t('assinatura.copiado') : t('assinatura.copiar')}
            </button>
            <button onClick={descarregarHTML} className="mt-2 btn btn-outline-secondary bg-white w-100 d-flex align-items-center justify-content-center gap-2">
              <Download size={16} /> {t('assinatura.baixar')}
            </button>
            {message && <p className="mt-2 small text-muted mb-0">{message}</p>}
            <div className="mt-3 d-flex align-items-start gap-2 rounded-3 bg-brand-light p-3 fs-xs text-muted">
              <Info size={14} className="mt-1 flex-shrink-0 text-brand" />
              {t('assinatura.dicaCopia')}
            </div>
          </Card>
        </div>

        {/* Direita — pré-visualização + instruções */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('assinatura.preview')}</h2>
            <div className="d-flex align-items-start gap-3 rounded-3 border p-3">
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 bg-brand fs-3 fw-bold text-white" style={{ height: '3.5rem', width: '3.5rem' }}>
                {iniciais}
              </div>
              <div className="border-start border-brand ps-3 small" style={{ borderLeftWidth: '2px' }}>
                <p className="fw-semibold text-ink mb-0">{d.nome}</p>
                <p className="text-muted mb-0">{d.cargo}</p>
                <p className="mt-1 d-flex align-items-center gap-1 text-muted mb-0"><Mail size={12} /> {d.email}</p>
                <p className="d-flex align-items-center gap-1 text-muted mb-0"><Phone size={12} /> {d.telefone}</p>
                <p className="d-flex align-items-center gap-1 text-muted mb-0"><MapPin size={12} /> {d.localizacao}</p>
                {mostrarBadges && selected.length > 0 && (
                  <div className="mt-2 d-flex gap-1">
                    {badges.filter((badge) => selected.includes(badge.id)).map((badge) => <span key={badge.id} title={badge.title} className="d-flex align-items-center justify-content-center rounded-2 bg-brand-light text-brand" style={{ height: '1.5rem', width: '1.5rem' }}><Award size={13} /></span>)}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 fw-semibold text-ink">{t('assinatura.instrucoes.titulo')}</h2>
            <div className="d-flex flex-column gap-3 small">
              <div>
                <p className="fw-semibold text-ink mb-0">Outlook</p>
                <ol className="mt-1 mb-0 fs-xs text-muted" style={{ paddingLeft: '1.1rem' }}>
                  <li>{t('assinatura.instrucoes.passoCopiar')}</li>
                  <li>{t('assinatura.instrucoes.out1')}</li>
                  <li>{t('assinatura.instrucoes.out2')}</li>
                  <li>{t('assinatura.instrucoes.out3')}</li>
                </ol>
              </div>
              <div>
                <p className="fw-semibold text-ink mb-0">Gmail</p>
                <ol className="mt-1 mb-0 fs-xs text-muted" style={{ paddingLeft: '1.1rem' }}>
                  <li>{t('assinatura.instrucoes.passoCopiar')}</li>
                  <li>{t('assinatura.instrucoes.gm1')}</li>
                  <li>{t('assinatura.instrucoes.gm2')}</li>
                  <li>{t('assinatura.instrucoes.gm3')}</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
