import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, UploadCloud, FileText, Image, Video, Link2,
  Plus, Send, CheckCircle2, Info, Trash2,
} from 'lucide-react'
import { Spinner } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

const TIPOS = [
  { key: 'Ficheiro', icon: FileText },
  { key: 'Imagem', icon: Image },
  { key: 'Vídeo', icon: Video },
  { key: 'Link', icon: Link2 },
]

export default function SubmitApplicationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: badges, loading } = useAsync(() => api.getBadges())

  const [badgeId, setBadgeId] = useState(searchParams.get('badge') || '')
  const [tipo, setTipo] = useState('Ficheiro')
  const [titulo, setTitulo] = useState('')
  const [requisito, setRequisito] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ref, setRef] = useState('') // nome do ficheiro ou URL
  const [prontas, setProntas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  if (loading || !badges) return <Spinner />

  const badge = badges.find((b) => b.id === Number(badgeId))

  function adicionar() {
    if (!titulo || !ref) return
    setProntas((atual) => [...atual, { id: Date.now(), tipo, titulo, requisito, descricao, ref }])
    setTitulo('')
    setRequisito('')
    setDescricao('')
    setRef('')
  }

  async function submeter() {
    setEnviando(true)
    try {
      await api.submeterCandidatura({ badgeId: Number(badgeId), descricao: '', ficheiros: prontas })
      setSucesso(true)
      setTimeout(() => navigate('/candidaturas'), 1600)
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 size={48} className="mx-auto text-green-600" />
        <h2 className="mt-3 text-lg font-bold text-ink">Candidatura submetida!</h2>
        <p className="mt-1 text-sm text-muted">A redirecionar para os teus badges…</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao Badge
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-accent p-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <UploadCloud size={22} /> Adicionar Evidências
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span>Badge:</span>
          <select
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            className="rounded-md bg-white/15 px-2 py-1 text-sm text-white outline-none [&>option]:text-ink"
          >
            <option value="">Seleciona um badge…</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome} - {b.nivel}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
          <Info size={14} /> Adiciona múltiplas evidências para aumentar a hipótese de aprovação. Conclui a documentação e depois submete tudo para validação.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Evidências prontas */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <CheckCircle2 size={18} className="text-brand" /> Evidências Prontas
            </h2>
            {prontas.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 py-8 text-center">
                <UploadCloud size={28} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-muted">Nenhuma evidência adicionada</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {prontas.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{e.titulo}</p>
                      <p className="truncate text-xs text-muted">{e.tipo} · {e.ref}</p>
                    </div>
                    <button
                      onClick={() => setProntas((atual) => atual.filter((x) => x.id !== e.id))}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={submeter}
              disabled={prontas.length === 0 || !badgeId || enviando}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Send size={16} /> {enviando ? 'A submeter…' : 'Submeter'}
            </button>
          </div>
        </div>

        {/* Nova evidência */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
              <Plus size={18} /> Nova Evidência
            </h2>

            {/* Tipo */}
            <p className="mb-2 text-sm font-medium text-ink">Tipo de Evidência</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIPOS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTipo(key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                    tipo === key ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-muted hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} />
                  {key}
                </button>
              ))}
            </div>

            {/* Ficheiro ou Link */}
            {tipo === 'Link' ? (
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-ink">URL</label>
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            ) : (
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-brand hover:bg-brand-50">
                <UploadCloud size={28} className="text-gray-400" />
                <p className="mt-2 text-sm text-muted">Arraste o ficheiro aqui ou clique para selecionar</p>
                <p className="mt-1 text-xs text-gray-400">Suporta PDF, DOCX, PNG, JPG, MP4 (máx. 50MB)</p>
                <span className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Escolher Ficheiro</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setRef(e.target.files?.[0]?.name || '')}
                />
                {ref && <p className="mt-2 text-xs font-medium text-brand">{ref}</p>}
              </label>
            )}

            {/* Título */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">Título da Evidência</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Certificado de conclusão do curso"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Requisito */}
            {badge?.requisitos?.length > 0 && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-ink">Selecionar requisito</label>
                <div className="space-y-2">
                  {badge.requisitos.map((req) => (
                    <label
                      key={req}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        requisito === req ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-ink hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requisito"
                        checked={requisito === req}
                        onChange={() => setRequisito(req)}
                        className="text-brand focus:ring-brand"
                      />
                      {req}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">Descrição (Opcional)</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Descreve como esta evidência demonstra as competências requeridas…"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <button
              onClick={adicionar}
              disabled={!titulo || !ref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Plus size={16} /> Adicionar Evidência
            </button>
          </div>

          {/* Dicas */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <Info size={16} /> Dicas para Evidências de Qualidade
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-800/80">
              <li>Adiciona múltiplas evidências para aumentar a hipótese de aprovação.</li>
              <li>Certifica-te de que o ficheiro está claro e legível.</li>
              <li>Descreve como cada evidência demonstra a competência do badge.</li>
              <li>Para projetos, inclui links que reapresentem o teu trabalho.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
