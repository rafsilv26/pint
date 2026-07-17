import { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, LogOut, Menu, X, PenLine } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getPanelForPath } from '../../config/navigation'
import { getGlobalSearchTarget } from '../../config/globalSearch'
import Logo from '../Logo'
import ChangePasswordModal from '../ChangePasswordModal'
import RgpdPolicyModal from '../RgpdPolicyModal'
import { useTranslation } from 'react-i18next'

export default function ManagerLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pendingPolicies = user?.pendingPolicies || []
  const bloqueadoPassword = Boolean(user?.mustChangePassword)
  // Só as políticas OBRIGATÓRIAS bloqueiam. As não obrigatórias aparecem no
  // modal para o utilizador ver, mas podem ser fechadas sem bloquear.
  const temObrigatoria = pendingPolicies.some((p) => p.mandatory !== false)
  const bloqueadoRgpd = !bloqueadoPassword && temObrigatoria
  const mostrarRgpd = !bloqueadoPassword && pendingPolicies.length > 0
  const bloqueado = bloqueadoPassword || bloqueadoRgpd
  const [mobileOpen, setMobileOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)

  const panel = getPanelForPath(location.pathname, t)
  const base = '/' + (location.pathname.split('/')[1] || '')

  const iniciais = (user?.nome || 'U')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const submitSearch = (event) => {
    event.preventDefault()
    const target = getGlobalSearchTarget(location.pathname, globalSearch)
    if (!target) return
    navigate(target)
    setMobileOpen(false)
  }

  const navigation = (mobile = false) => (
    <>
      <nav className="flex-grow-1 d-flex flex-column gap-1 px-2 py-2 overflow-y-auto">
        {panel.nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 rounded-3 px-3 py-2 small fw-medium text-decoration-none ${
                isActive ? 'bg-white text-brand shadow-sm' : 'text-white-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-top border-white border-opacity-10 px-2 py-3">
        {base === '/sll' && <NavLink to={`${base}/assinatura`} onClick={() => mobile && setMobileOpen(false)} className="d-flex align-items-center gap-2 rounded-3 px-3 py-2 mb-1 text-decoration-none text-white-50"><PenLine size={18} /> <span className="small fw-medium">{t('tmWorkspace.signature.emailSignature')}</span></NavLink>}
        <NavLink to={`${base}/conta`} onClick={() => mobile && setMobileOpen(false)} className="d-flex align-items-center gap-2 rounded-3 px-2 py-2 text-decoration-none text-white overflow-hidden">
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25 small fw-semibold flex-shrink-0" style={{ height: '2.25rem', width: '2.25rem' }}>{iniciais}</div>
          <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}><p className="text-truncate small fw-semibold mb-0" title={user?.nome}>{user?.nome}</p><p className="text-truncate small text-white-50 mb-0">{panel.label}</p></div>
        </NavLink>
        <button onClick={() => setConfirmLogout(true)} className="btn btn-link d-flex align-items-center gap-2 w-100 mt-1 px-2 py-2 small text-white-50 text-decoration-none"><LogOut size={18} /> {t('managerLayout.terminarSessao')}</button>
      </div>
    </>
  )

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <aside
        className="d-none d-md-flex flex-shrink-0 flex-column bg-gradient-brand text-white"
        style={{ width: '16rem' }}
      >
        <div className="px-4 py-4">
          <Logo height={28} />
          <p className="mt-1 mb-0 small text-white-50">{panel.label}</p>
        </div>

        {navigation()}
      </aside>

      {mobileOpen && <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" style={{ zIndex: 1040 }} onClick={() => setMobileOpen(false)} />}
      <aside className={`position-fixed top-0 start-0 h-100 d-md-none d-flex flex-column bg-gradient-brand text-white ${mobileOpen ? '' : 'd-none'}`} style={{ width: '17rem', zIndex: 1050 }}>
        <div className="px-4 py-4 d-flex align-items-start justify-content-between"><div><Logo height={28} /><p className="mt-1 mb-0 small text-white-50">{panel.label}</p></div><button className="btn btn-link text-white p-0" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={22} /></button></div>
        {navigation(true)}
      </aside>

      <div className="d-flex flex-grow-1 flex-column overflow-hidden">
        <header
          className="d-flex flex-shrink-0 align-items-center gap-3 border-bottom bg-white px-4"
          style={{ height: '4rem' }}
        >
          <button className="btn btn-link text-brand p-0 d-md-none" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={24} /></button>
          <form className="position-relative w-100" style={{ maxWidth: '28rem' }} onSubmit={submitSearch}>
            <Search
              size={18}
              className="position-absolute text-secondary"
              style={{ left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              placeholder={t('managerLayout.procurar')}
              className="form-control rounded-pill ps-5"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
          </form>
        </header>
        <main className="flex-grow-1 overflow-y-auto p-4 p-lg-5">
          {bloqueado ? null : <Outlet />}
        </main>
      </div>

      {bloqueadoPassword && <ChangePasswordModal />}
      {mostrarRgpd && <RgpdPolicyModal key={pendingPolicies[0]?.policyId} policies={pendingPolicies} />}
      {confirmLogout &&<div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 p-3" style={{ zIndex: 1100 }} role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="bg-white rounded-3 shadow p-4 w-100" style={{ maxWidth: 420 }}><h2 id="logout-title" className="h5 fw-bold text-ink">{t('managerLayout.confirmarTitulo')}</h2><p className="small text-muted">{t('managerLayout.confirmarTexto')}</p><div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmLogout(false)}>{t('managerLayout.cancelar')}</button><button type="button" className="btn btn-danger" onClick={() => { setConfirmLogout(false); logout(); navigate('/login') }}>{t('managerLayout.confirmar')}</button></div></div></div>}
    </div>
  )
}
