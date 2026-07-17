import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Field } from './ui'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/api'
import { useTranslation } from 'react-i18next'

export default function ChangePasswordModal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, markPasswordChanged, logout } = useAuth()
  const isConsultor = (user?.roles || []).includes('Consultor') || user?.role === 'Consultor'
  const precisaArea = isConsultor && !user?.areaId
  const { data: areas } = useAsync(() => (precisaArea ? api.getAreasPublicas() : Promise.resolve([])))

  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [areaId, setAreaId] = useState('')
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (nova.length < 8) return setErro(t('changePasswordModal.erros.comprimento'))
    if (nova !== confirmar) return setErro(t('changePasswordModal.erros.coincidem'))
    if (precisaArea && !areaId) return setErro(t('changePasswordModal.erros.area'))

    setLoading(true)
    try {
      await api.changePassword({
        currentPassword: atual,
        newPassword: nova,
        areaId: precisaArea && areaId ? Number(areaId) : undefined,
      })
      markPasswordChanged()
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="w-100 rounded-4 bg-white p-4 shadow-lg" style={{ maxWidth: '28rem' }}>
        <div className="mb-1 d-flex align-items-center gap-2">
          <div className="avatar-circle" style={{ height: '2.25rem', width: '2.25rem' }}>
            <Lock size={18} />
          </div>
          <h2 className="h5 fw-bold text-ink mb-0">{t('changePasswordModal.titulo')}</h2>
        </div>
        <p className="mb-4 small text-muted">
          {t('changePasswordModal.descricao')}
        </p>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          {erro && <div className="rounded-3 bg-danger-subtle px-3 py-2 small text-danger">{erro}</div>}
          <Field
            label={t('changePasswordModal.campos.atualLabel')}
            type="password"
            icon={Lock}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            placeholder={t('changePasswordModal.campos.atualPlaceholder')}
            required
          />
          <Field
            label={t('changePasswordModal.campos.novaLabel')}
            type="password"
            icon={Lock}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            hint={t('changePasswordModal.campos.novaHint')}
            required
          />
          <Field
            label={t('changePasswordModal.campos.confirmarLabel')}
            type="password"
            icon={Lock}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
          {precisaArea && (
            <label className="d-block">
              <span className="mb-1 d-block small fw-medium text-ink">{t('changePasswordModal.campos.areaLabel')}</span>
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="form-select" required>
                <option value="">{t('changePasswordModal.campos.areaPlaceholder')}</option>
                {(areas || []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <span className="mt-1 d-block fs-xs text-muted">{t('changePasswordModal.campos.areaHint')}</span>
            </label>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary w-100">
            {loading ? t('changePasswordModal.botoes.guardando') : t('changePasswordModal.botoes.guardar')}
          </button>
        </form>

        <button
          onClick={() => { logout(); navigate('/login') }}
          className="btn btn-link mt-2 w-100 text-center text-muted text-decoration-none"
        >
          {t('changePasswordModal.botoes.sair')}
        </button>
      </div>
    </div>
  )
}
