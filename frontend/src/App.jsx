import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AtualizarPasswordPage from './pages/auth/AtualizarPasswordPage'

import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import BadgeDetailPage from './pages/BadgeDetailPage'
import SubmitApplicationPage from './pages/SubmitApplicationPage'
import ApplicationsPage from './pages/ApplicationsPage'
import HistoryPage from './pages/HistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import RankingPage from './pages/RankingPage'
import ProfilePage from './pages/ProfilePage'
import PreferencesPage from './pages/PreferencesPage'
import EmailSignaturePage from './pages/EmailSignaturePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import EscolhaAreaPage from './pages/EscolhaAreaPage'
import ConsultoresPage from './pages/ConsultoresPage'
import PublicProfilePage from './pages/PublicProfilePage'
import CertificatePage from './pages/CertificatePage'
import PublicBadgePage from './pages/PublicBadgePage'

export default function App() {
  return (
    <Routes>
      {/* ---- Rotas públicas ---- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegisterPage />} />
      <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
      <Route path="/atualizar-password" element={<AtualizarPasswordPage />} />
      <Route path="/badge/:token" element={<PublicBadgePage />} />
      <Route path="/certificado/:token" element={<CertificatePage />} />

      {/* ---- Rotas privadas (perfil Consultor) ---- */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/catalogo/:id" element={<BadgeDetailPage />} />
        <Route path="/candidaturas" element={<ApplicationsPage />} />
        <Route path="/candidaturas/nova" element={<SubmitApplicationPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/notificacoes" element={<NotificationsPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/preferencias" element={<PreferencesPage />} />
        <Route path="/perfil/assinatura" element={<EmailSignaturePage />} />
        <Route path="/perfil/alterar-password" element={<ChangePasswordPage />} />
        <Route path="/perfil/publico" element={<PublicProfilePage />} />
        <Route path="/escolher-area" element={<EscolhaAreaPage />} />
        <Route path="/consultores" element={<ConsultoresPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
