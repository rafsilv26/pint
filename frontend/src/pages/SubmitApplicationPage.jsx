import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, UploadCloud, FileText, Image, Video, Link2,
  Plus, Send, CheckCircle2, Info, Trash2,
} from 'lucide-react'
import { Spinner, ErrorState } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function SubmitApplicationPage() {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: badges, loading, error, reload } = useAsync(() => api.getBadges())

  const [badgeId, setBadgeId] = useState(searchParams.get('badge') || '')
  const [tipo, setTipo] = useState('Ficheiro')
  const [titulo, setTitulo] = useState('')
  const [requisitoId, setRequisitoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ficheiro, setFicheiro] = useState(null)
  const [link, setLink] = useState('')
  const [prontas, setProntas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erroSubmit, setErroSubmit] = useState(null)

  // Mover TIPOS para dentro permite traduzir o label mantendo a key constante para a lógica
  const TIPOS = [
    { key: 'Ficheiro', label: t('submeterCandidatura.tipos.Ficheiro'), icon: FileText },
    { key: 'Imagem', label: t('submeterCandidatura.tipos.Imagem'), icon: Image },
    { key: 'Vídeo', label: t('submeterCandidatura.tipos.Vídeo'), icon: Video },
    { key: 'Link', label: t('submeterCandidatura.tipos.Link'), icon: Link2 },
  ]

  // Carrega os requisitos do badge selecionado
  const { data: badgeDetalhe } = useAsync(
    () => (badgeId ? api.getBadge(badgeId) : Promise.resolve(null)),
    [badgeId]
  )
  const requisitos = badgeDetalhe?.requisitos || []

  if (loading) return <Spinner />
  if (error) return <ErrorState onRetry={reload} />

  function adicionar() {
    const ehLink = tipo === 'Link'
    if (!titulo || (ehLink ? !link : !ficheiro)) return
    setProntas((atual) => [
      ...atual,
      {
        id: Date.now(),
        tipo,
        titulo,
        requisitoId,
        descricao,
        file: ehLink ? null : ficheiro,
        ref: ehLink ? link : ficheiro?.name,
      },
    ])
    setTitulo('')
    setRequisitoId('')
    setDescricao('')
    setFicheiro(null)
    setLink('')
  }

  async function submeter() {
    setEnviando(true)
    setErroSubmit(null)
    try {
      await api.submeterCandidatura({ badgeId: Number(badgeId), descricao: '', ficheiros: prontas })
      setSucesso(true)
      setTimeout(() => navigate('/candidaturas'), 1600)
    } catch (err) {
      setErroSubmit(err.message)
    } finally {
      setEnviando(false)
    }
  }

  // Função auxiliar para traduzir o tipo já adicionado na lista
  const getTipoLabel = (k) => TIPOS.find((tItem) => tItem.key === k)?.label || k

  if (sucesso) {
    return (
      <div className="mx-auto mt-5 rounded-4 border bg-white p-5 text-center shadow-sm" style={{ maxWidth: '28rem' }}>
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <h2 className="mt-3 fs-5 fw-bold text-ink">{t('submeterCandidatura.sucessoTitulo')}</h2>
        <p className="mt-1 small text-muted">{t('submeterCandidatura.sucessoDesc')}</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/catalogo" className="mb-3 d-inline-flex align-items-center gap-1 small text-muted text-decoration-none">
        <ArrowLeft size={16} /> {t('submeterCandidatura.voltar')}
      </Link>

      {/* Hero */}
      <div className="rounded-4 bg-gradient-brand p-4 text-white shadow-sm">
        <h1 className="d-flex align-items-center gap-2 fs-4 fw-bold">
          <UploadCloud size={22} /> {t('submeterCandidatura.tituloHero')}
        </h1>
        <div className="mt-1 d-flex flex-wrap align-items-center gap-2 small text-white-50">
          <span>{t('submeterCandidatura.badgeLabel')}</span>
          <select
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            className="rounded-2 bg-white bg-opacity-15 text-white border-0 px-2 py-1 small"
          >
            <option value="" className="text-dark">{t('submeterCandidatura.selecionaBadge')}</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id} className="text-dark">{b.nome} - {b.nivel}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 d-flex align-items-center gap-2 rounded-3 bg-white bg-opacity-10 px-3 py-2 fs-xs text-white-50 mb-0">
          <Info size={14} /> {t('submeterCandidatura.dicaHero')}
        </p>
      </div>

      <div className="mt-4 row g-4">
        {/* Evidências prontas */}
        <div className="col-lg-4 d-flex flex-column gap-3">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="d-flex align-items-center gap-2 fw-semibold text-ink">
              <CheckCircle2 size={18} className="text-brand" /> {t('submeterCandidatura.prontasTitulo')}
            </h2>
            {prontas.length === 0 ? (
              <div className="mt-3 rounded-3 border border-dashed py-4 text-center">
                <UploadCloud size={28} className="mx-auto text-secondary" />
                <p className="mt-2 small text-muted mb-0">{t('submeterCandidatura.vazioProntas')}</p>
              </div>
            ) : (
              <ul className="mt-3 d-flex flex-column gap-2 list-unstyled mb-0">
                {prontas.map((e) => (
                  <li key={e.id} className="d-flex align-items-start justify-content-between gap-2 rounded-3 bg-light px-3 py-2 small">
                    <div className="min-w-0">
                      <p className="text-truncate fw-medium text-ink mb-0">{e.titulo}</p>
                      <p className="text-truncate fs-xs text-muted mb-0">{getTipoLabel(e.tipo)} · {e.ref}</p>
                    </div>
                    <button onClick={() => setProntas((a) => a.filter((x) => x.id !== e.id))} className="btn btn-link p-0 text-secondary">
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {erroSubmit && <p className="mt-3 rounded-3 bg-danger-subtle px-3 py-2 fs-xs text-danger mb-0">{erroSubmit}</p>}
            <button
              onClick={submeter}
              disabled={prontas.length === 0 || !badgeId || enviando}
              className="mt-3 btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <Send size={16} /> {enviando ? t('submeterCandidatura.botaoSubmetendo') : t('submeterCandidatura.botaoSubmeter')}
            </button>
          </div>
        </div>

        {/* Nova evidência */}
        <div className="col-lg-8">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="mb-3 d-flex align-items-center gap-2 fw-semibold text-ink">
              <Plus size={18} /> {t('submeterCandidatura.novaTitulo')}
            </h2>

            <p className="mb-2 small fw-medium text-ink">{t('submeterCandidatura.tipoLabel')}</p>
            <div className="row row-cols-2 row-cols-sm-4 g-2">
              {TIPOS.map(({ key, label, icon: Icon }) => (
                <div className="col" key={key}>
                  <button
                    onClick={() => setTipo(key)}
                    className={`w-100 d-flex flex-column align-items-center gap-2 rounded-3 border p-3 small fw-medium ${
                      tipo === key ? 'border-brand bg-brand-light text-brand' : 'text-muted'
                    }`}
                  >
                    <Icon size={22} />
                    {label}
                  </button>
                </div>
              ))}
            </div>

            {tipo === 'Link' ? (
              <div className="mt-4">
                <label className="mb-2 d-block small fw-medium text-ink">{t('submeterCandidatura.urlLabel')}</label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  className="form-control"
                />
              </div>
            ) : (
              <label className="mt-4 d-flex cursor-pointer flex-column align-items-center justify-content-center rounded-3 border border-dashed px-4 py-4 text-center">
                <UploadCloud size={28} className="text-secondary" />
                <p className="mt-2 small text-muted mb-0">{t('submeterCandidatura.arrasteLabel')}</p>
                <p className="mt-1 fs-xs text-secondary mb-0">{t('submeterCandidatura.suportaLabel')}</p>
                <span className="mt-2 btn btn-brand btn-sm">{t('submeterCandidatura.escolherFicheiro')}</span>
                <input type="file" className="d-none" onChange={(e) => setFicheiro(e.target.files?.[0] || null)} />
                {ficheiro && <p className="mt-2 fs-xs fw-medium text-brand mb-0">{ficheiro.name}</p>}
              </label>
            )}

            <div className="mt-4">
              <label className="mb-2 d-block small fw-medium text-ink">{t('submeterCandidatura.tituloLabel')}</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={t('submeterCandidatura.tituloPlaceholder')}
                className="form-control"
              />
            </div>

            {requisitos.length > 0 && (
              <div className="mt-4">
                <label className="mb-2 d-block small fw-medium text-ink">{t('submeterCandidatura.selecionarRequisito')}</label>
                <div className="d-flex flex-column gap-2">
                  {requisitos.map((req) => (
                    <label
                      key={req.id}
                      className={`d-flex cursor-pointer align-items-center gap-2 rounded-3 border px-3 py-2 small ${
                        requisitoId === req.id ? 'border-brand bg-brand-light text-brand' : 'text-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requisito"
                        checked={requisitoId === req.id}
                        onChange={() => setRequisitoId(req.id)}
                        className="form-check-input mt-0"
                      />
                      {req.titulo}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-2 d-block small fw-medium text-ink">{t('submeterCandidatura.descricaoLabel')}</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder={t('submeterCandidatura.descricaoPlaceholder')}
                className="form-control"
              />
            </div>

            <button
              onClick={adicionar}
              disabled={!titulo || (tipo === 'Link' ? !link : !ficheiro)}
              className="mt-4 btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <Plus size={16} /> {t('submeterCandidatura.botaoAdicionar')}
            </button>
          </div>

          <div className="mt-3 rounded-3 border border-warning-subtle bg-warning-subtle p-3">
            <p className="d-flex align-items-center gap-2 small fw-semibold text-warning-emphasis mb-0">
              <Info size={16} /> {t('submeterCandidatura.dicasTitulo')}
            </p>
            <ul className="mt-2 mb-0 fs-xs text-warning-emphasis" style={{ paddingLeft: '1.1rem' }}>
              <li>{t('submeterCandidatura.dica1')}</li>
              <li>{t('submeterCandidatura.dica2')}</li>
              <li>{t('submeterCandidatura.dica3')}</li>
              <li>{t('submeterCandidatura.dica4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
