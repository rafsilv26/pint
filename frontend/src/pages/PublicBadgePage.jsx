import { useParams } from 'react-router-dom'
import { Award, ShieldCheck, ShieldX } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'

function formatarData(d) {
  return d ? new Date(d).toLocaleDateString('pt-PT') : null
}

// Página PÚBLICA (sem login) — verificação de um badge por link único.
export default function PublicBadgePage() {
  const { token } = useParams()
  const { data, loading } = useAsync(() => api.verificarBadge(token), [token])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mb-6 flex items-center gap-3 text-xl font-bold text-brand">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">S</span>
        Softinsa Badges
      </div>

      {loading ? (
        <p className="text-muted">A verificar badge…</p>
      ) : !data ? (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <ShieldX size={48} className="mx-auto text-red-500" />
          <h1 className="mt-4 text-lg font-bold text-ink">Badge não encontrado</h1>
          <p className="mt-1 text-sm text-muted">Este link de verificação não é válido.</p>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-brand-light text-brand">
            <Award size={40} />
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink">{data.badge.nome}</h1>
          <p className="mt-1 text-sm text-muted">{data.badge.descricao}</p>

          <div
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              data.valido ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {data.valido ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
            {data.valido ? 'Badge válido' : 'Badge expirado'}
          </div>

          <dl className="mt-6 space-y-3 border-t border-gray-100 pt-6 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Atribuído a</dt>
              <dd className="font-semibold text-ink">{data.consultor?.nome}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Emissor</dt>
              <dd className="font-semibold text-ink">{data.badge.fornecedor}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Data de atribuição</dt>
              <dd className="font-semibold text-ink">{formatarData(data.dataAtribuicao)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Validade</dt>
              <dd className="font-semibold text-ink">
                {formatarData(data.dataExpiracao) || 'Não expira'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">Verificado por Softinsa · Plataforma de Badges</p>
    </div>
  )
}
