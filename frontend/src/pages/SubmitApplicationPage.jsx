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
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 size={48} className="mx-auto text-green-600" />
        <h2 className="mt-3 text-lg font-bold text-ink">{t('submeterCandidatura.sucessoTitulo')}</h2>
        <p className="mt-1 text-sm text-muted">{t('submeterCandidatura.sucessoDesc')}</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> {t('submeterCandidatura.voltar')}
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-accent p-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <UploadCloud size={22} /> {t('submeterCandidatura.tituloHero')}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span>{t('submeterCandidatura.badgeLabel')}</span>
          <select
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            className="rounded-md bg-white/15 px-2 py-1 text-sm text-white outline-none [&>option]:text-ink"
          >
            <option value="">{t('submeterCandidatura.selecionaBadge')}</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>{b.nome} - {b.nivel}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
          <Info size={14} /> {t('submeterCandidatura.dicaHero')}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Evidências prontas */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <CheckCircle2 size={18} className="text-brand" /> {t('submeterCandidatura.prontasTitulo')}
            </h2>
            {prontas.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 py-8 text-center">
                <UploadCloud size={28} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-muted">{t('submeterCandidatura.vazioProntas')}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {prontas.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{e.titulo}</p>
                      <p className="truncate text-xs text-muted">{getTipoLabel(e.tipo)} · {e.ref}</p>
                    </div>
                    <button onClick={() => setProntas((a) => a.filter((x) => x.id !== e.id))} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {erroSubmit && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erroSubmit}</p>}
            <button
              onClick={submeter}
              disabled={prontas.length === 0 || !badgeId || enviando}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Send size={16} /> {enviando ? t('submeterCandidatura.botaoSubmetendo') : t('submeterCandidatura.botaoSubmeter')}
            </button>
          </div>
        </div>

        {/* Nova evidência */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
              <Plus size={18} /> {t('submeterCandidatura.novaTitulo')}
            </h2>

            <p className="mb-2 text-sm font-medium text-ink">{t('submeterCandidatura.tipoLabel')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIPOS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTipo(key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                    tipo === key ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-muted hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} />
                  {label}
                </button>
              ))}
            </div>

            {tipo === 'Link' ? (
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('submeterCandidatura.urlLabel')}</label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            ) : (
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-brand hover:bg-brand-50">
                <UploadCloud size={28} className="text-gray-400" />
                <p className="mt-2 text-sm text-muted">{t('submeterCandidatura.arrasteLabel')}</p>
                <p className="mt-1 text-xs text-gray-400">{t('submeterCandidatura.suportaLabel')}</p>
                <span className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">{t('submeterCandidatura.escolherFicheiro')}</span>
                <input type="file" className="hidden" onChange={(e) => setFicheiro(e.target.files?.[0] || null)} />
                {ficheiro && <p className="mt-2 text-xs font-medium text-brand">{ficheiro.name}</p>}
              </label>
            )}

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('submeterCandidatura.tituloLabel')}</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={t('submeterCandidatura.tituloPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {requisitos.length > 0 && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-ink">{t('submeterCandidatura.selecionarRequisito')}</label>
                <div className="space-y-2">
                  {requisitos.map((req) => (
                    <label
                      key={req.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        requisitoId === req.id ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-ink hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requisito"
                        checked={requisitoId === req.id}
                        onChange={() => setRequisitoId(req.id)}
                        className="text-brand focus:ring-brand"
                      />
                      {req.titulo}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('submeterCandidatura.descricaoLabel')}</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder={t('submeterCandidatura.descricaoPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <button
              onClick={adicionar}
              disabled={!titulo || (tipo === 'Link' ? !link : !ficheiro)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Plus size={16} /> {t('submeterCandidatura.botaoAdicionar')}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <Info size={16} /> {t('submeterCandidatura.dicasTitulo')}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-800/80">
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