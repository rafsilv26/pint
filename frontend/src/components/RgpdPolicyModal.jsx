import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useTranslation } from 'react-i18next'

// Políticas não obrigatórias recusadas ficam guardadas por utilizador+versão no
// localStorage: o utilizador escolheu "Não aceitar", não gravamos nada na BD
// (só a aceitação é registada), mas não voltamos a perguntar em cada login.
const chaveRecusadas = (userId) => `politicas-recusadas-${userId || 'x'}`
const idRecusa = (p) => `${p.policyId}:${p.version || ''}`

function carregarRecusadas(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(chaveRecusadas(userId)) || '[]'))
  } catch {
    return new Set()
  }
}

export default function RgpdPolicyModal({ policies }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, acceptPolicy, logout } = useAuth()
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmoLeitura, setConfirmoLeitura] = useState(false)
  const [recusadas, setRecusadas] = useState(() => carregarRecusadas(user?.id))

  // Mostra as obrigatórias sempre; as não obrigatórias só se ainda não foram
  // recusadas localmente por este utilizador.
  const visiveis = (policies || []).filter(
    (p) => p.mandatory !== false || !recusadas.has(idRecusa(p))
  )
  if (visiveis.length === 0) return null

  const politica = visiveis[0]
  const total = visiveis.length
  const obrigatoria = politica.mandatory !== false

  async function handleAceitar() {
    if (obrigatoria && !confirmoLeitura) return
    setErro(null)
    setLoading(true)
    try {
      await acceptPolicy(politica.policyId)
      setConfirmoLeitura(false)
    } catch (err) {
      setErro(err.message || t('rgpdPolicyModal.erro'))
    } finally {
      setLoading(false)
    }
  }

  // "Não aceitar": não grava na BD, apenas marca localmente para não voltar a
  // perguntar. Avança para a próxima política (ou fecha o modal).
  function handleNaoAceitar() {
    const proximas = new Set(recusadas)
    proximas.add(idRecusa(politica))
    try {
      localStorage.setItem(chaveRecusadas(user?.id), JSON.stringify([...proximas]))
    } catch { /* ignora */ }
    setConfirmoLeitura(false)
    setRecusadas(proximas)
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="w-100 rounded-4 bg-white p-4 shadow-lg" style={{ maxWidth: '32rem' }}>
        <div className="mb-1 d-flex align-items-center gap-2">
          <div className="avatar-circle" style={{ height: '2.25rem', width: '2.25rem' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="h5 fw-bold text-ink mb-0">{politica.title || t('rgpdPolicyModal.titulo')}</h2>
            {politica.version && (
              <span className="fs-xs text-muted">{t('rgpdPolicyModal.versao', { versao: politica.version })}</span>
            )}
          </div>
        </div>

        {total > 1 && (
          <p className="mb-2 fs-xs text-muted">
            {t('rgpdPolicyModal.contador', { atual: 1, total })}
          </p>
        )}

        <p className="mb-3 small text-muted">{t('rgpdPolicyModal.descricao')}</p>

        {politica.description && (
          <div
            className="mb-4 rounded-3 border p-3 small text-ink"
            style={{ maxHeight: '16rem', overflowY: 'auto', whiteSpace: 'pre-wrap' }}
          >
            {politica.description}
          </div>
        )}

        {erro && <div className="mb-3 rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}

        {obrigatoria ? (
          <>
            <label className="mb-3 d-flex align-items-start gap-2 small text-ink" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="form-check-input mt-1 flex-shrink-0"
                checked={confirmoLeitura}
                onChange={(e) => setConfirmoLeitura(e.target.checked)}
              />
              {t('rgpdPolicyModal.confirmoLeitura')}
            </label>

            <button onClick={handleAceitar} disabled={loading || !confirmoLeitura} className="btn btn-primary w-100">
              {loading ? t('rgpdPolicyModal.botoes.aceitando') : t('rgpdPolicyModal.botoes.aceitar')}
            </button>

            <button
              onClick={() => { logout(); navigate('/login') }}
              className="btn btn-link mt-2 w-100 text-center text-muted text-decoration-none"
            >
              {t('rgpdPolicyModal.botoes.sair')}
            </button>
          </>
        ) : (
          <div className="d-flex gap-2">
            <button onClick={handleNaoAceitar} disabled={loading} className="btn btn-outline-secondary w-50">
              {t('rgpdPolicyModal.botoes.naoAceitar')}
            </button>
            <button onClick={handleAceitar} disabled={loading} className="btn btn-primary w-50">
              {loading ? t('rgpdPolicyModal.botoes.aceitando') : t('rgpdPolicyModal.botoes.aceitarSimples')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
