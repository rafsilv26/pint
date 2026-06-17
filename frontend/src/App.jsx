import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import ManagerLayout from './components/layout/ManagerLayout'

import LoginPage from './pages/auth/LoginPage'
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

// Talent Manager
import TalentDashboardPage from './pages/tm/TalentDashboardPage'
import TalentCandidaturasPage from './pages/tm/TalentCandidaturasPage'
import TalentCandidaturaDetailPage from './pages/tm/TalentCandidaturaDetailPage'
import EmConstrucao from './pages/EmConstrucao'

// Service Line Leader
import SLLDashboardPage from './pages/sll/SLLDashboardPage'
import SLLPedidosPage from './pages/sll/SLLPedidosPage'
import SLLPedidoDetailPage from './pages/sll/SLLPedidoDetailPage'

// Admin
import AdminResourcePage from './pages/admin/AdminResourcePage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPedidosPage from './pages/admin/AdminPedidosPage'

export default function App() {
  return (
    <Routes>
      {/* ---- Rotas públicas ---- */}
      <Route path="/login" element={<LoginPage />} />
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

      {/* ---- Talent Manager (sidebar) ---- */}
      <Route
        element={
          <ProtectedRoute>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/tm" element={<TalentDashboardPage />} />
        <Route path="/tm/candidaturas" element={<TalentCandidaturasPage />} />
        <Route path="/tm/candidaturas/:id" element={<TalentCandidaturaDetailPage />} />
        <Route path="/tm/catalogo" element={<EmConstrucao titulo="Catálogo de Badges" />} />
        <Route path="/tm/learning-paths" element={<EmConstrucao titulo="Learning Paths" />} />
        <Route path="/tm/consultores" element={<EmConstrucao titulo="Consultores" />} />

        {/* Service Line Leader */}
        <Route path="/sll" element={<SLLDashboardPage />} />
        <Route path="/sll/pedidos" element={<SLLPedidosPage />} />
        <Route path="/sll/pedidos/:id" element={<SLLPedidoDetailPage />} />
        <Route path="/sll/consultores" element={<EmConstrucao titulo="Consultores" />} />
        <Route path="/sll/badges" element={<EmConstrucao titulo="Badges" />} />
        <Route path="/sll/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
        <Route path="/sll/notificacoes" element={<EmConstrucao titulo="Notificações" />} />

        {/* Admin */}
        <Route path="/admin" element={<TalentDashboardPage />} />
        <Route path="/admin/badges" element={<AdminResourcePage resourceKey="badges" />} />
        <Route path="/admin/learning-paths" element={<AdminResourcePage resourceKey="learning-paths" />} />
        <Route path="/admin/politicas" element={<AdminResourcePage resourceKey="policies" />} />
        <Route path="/admin/avisos" element={<AdminResourcePage resourceKey="notices" />} />
        <Route path="/admin/informacoes" element={<AdminResourcePage resourceKey="information" />} />
        <Route path="/admin/utilizadores" element={<AdminUsersPage />} />
        <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
        <Route path="/admin/definicoes" element={<EmConstrucao titulo="Definições" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
