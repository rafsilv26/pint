import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import AppLayout from './components/layout/AppLayout'
import ManagerLayout from './components/layout/ManagerLayout'

import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AtualizarPasswordPage from './pages/auth/AtualizarPasswordPage'
import ConfirmarEmailPage from './pages/auth/ConfirmarEmailPage'

import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import BadgeDetailPage from './pages/BadgeDetailPage'
import SubmitApplicationPage from './pages/SubmitApplicationPage'
import ObjetivosPage from './pages/ObjetivosPage'
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

import TalentDashboardPage from './pages/tm/TalentDashboardPage'
import TalentCandidaturasPage from './pages/tm/TalentCandidaturasPage'
import TalentCandidaturaDetailPage from './pages/tm/TalentCandidaturaDetailPage'
import TalentReportsPage from './pages/tm/TalentReportsPage'
import TalentConsultantsPage from './pages/tm/TalentConsultantsPage'
import TalentCatalogPage from './pages/tm/TalentCatalogPage'
import TalentExpirationsPage from './pages/tm/TalentExpirationsPage'
import TalentSearchPage from './pages/tm/TalentSearchPage'
import TalentLearningPathsPage from './pages/tm/TalentLearningPathsPage'
import BadgesGridView from './components/BadgesGridView'

import SLLDashboardPage from './pages/sll/SLLDashboardPage'
import SLLPedidosPage from './pages/sll/SLLPedidosPage'
import SLLPedidoDetailPage from './pages/sll/SLLPedidoDetailPage'
import SLLRelatoriosPage from './pages/sll/SLLRelatoriosPage'
import SLLConsultoresPage from './pages/sll/SLLConsultoresPage'

import AdminResourcePage from './pages/admin/AdminResourcePage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage'
import AdminPedidosPage from './pages/admin/AdminPedidosPage'
import AdminPedidoDetailPage from './pages/admin/AdminPedidoDetailPage'
import AdminDefinicoesPage from './pages/admin/AdminDefinicoesPage'
import AdminEmailTemplatesPage from './pages/admin/AdminEmailTemplatesPage'

import ManagerConsultorDetailPage from './pages/ManagerConsultorDetailPage'
import ManagerBadgeDetailPage from './pages/ManagerBadgeDetailPage'
import ManagerContaPage from './pages/ManagerContaPage'

export default function App() {
  const { t } = useTranslation()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
      <Route path="/atualizar-password" element={<AtualizarPasswordPage />} />
      <Route path="/confirmar-email" element={<ConfirmarEmailPage />} />
      <Route path="/badge/:token" element={<PublicBadgePage />} />
      <Route path="/certificado/:token" element={<CertificatePage />} />

      <Route
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['consultor']} />
          </ProtectedRoute>
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:id" element={<BadgeDetailPage />} />
          <Route path="/candidaturas" element={<ApplicationsPage />} />
          <Route path="/candidaturas/nova" element={<SubmitApplicationPage />} />
          <Route path="/objetivos" element={<ObjetivosPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/notificacoes" element={<NotificationsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/perfil/preferencias" element={<PreferencesPage />} />
          <Route path="/perfil/assinatura" element={<EmailSignaturePage />} />
          <Route path="/perfil/alterar-password" element={<ChangePasswordPage />} />
          <Route path="/perfil/publico" element={<PublicProfilePage />} />
          <Route path="/perfil/publico/:id" element={<PublicProfilePage />} />
          <Route path="/escolher-area" element={<EscolhaAreaPage />} />
          <Route path="/consultores" element={<ConsultoresPage linkBase="/perfil/publico" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute><ManagerLayout /></ProtectedRoute>}>

        <Route element={<RoleGuard allowedRoles={['tm', 'admin']} />}>
          <Route path="/tm" element={<TalentDashboardPage />} />
          <Route path="/tm/candidaturas" element={<TalentCandidaturasPage />} />
          <Route path="/tm/candidaturas/:id" element={<TalentCandidaturaDetailPage />} />
          <Route path="/tm/catalogo" element={<TalentCatalogPage />} />
          <Route path="/tm/catalogo/:id" element={<ManagerBadgeDetailPage />} />
          <Route path="/tm/learning-paths" element={<TalentLearningPathsPage />} />
          <Route path="/tm/consultores" element={<TalentConsultantsPage />} />
          <Route path="/tm/consultores/:id" element={<ManagerConsultorDetailPage />} />
          <Route path="/tm/relatorios" element={<TalentReportsPage />} />
          <Route path="/tm/validades" element={<TalentExpirationsPage />} />
          <Route path="/tm/notificacoes" element={<NotificationsPage />} />
          <Route path="/tm/informacoes" element={<AdminResourcePage resourceKey="information" readOnly />} />
          <Route path="/tm/assinatura" element={<EmailSignaturePage />} />
          <Route path="/tm/alterar-password" element={<ChangePasswordPage />} />
          <Route path="/tm/pesquisa" element={<TalentSearchPage />} />
          <Route path="/tm/conta" element={<ManagerContaPage />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={['sll', 'admin']} />}>
          <Route path="/sll" element={<SLLDashboardPage />} />
          <Route path="/sll/pedidos" element={<SLLPedidosPage />} />
          <Route path="/sll/pedidos/:id" element={<SLLPedidoDetailPage />} />
          <Route path="/sll/consultores" element={<SLLConsultoresPage />} />
          <Route path="/sll/consultores/:id" element={<ManagerConsultorDetailPage />} />
          <Route path="/sll/badges" element={<BadgesGridView titulo={t('app.rotas.badges')} linkBase="/sll/badges" />} />
          <Route path="/sll/badges/:id" element={<ManagerBadgeDetailPage />} />
          <Route path="/sll/relatorios" element={<SLLRelatoriosPage />} />
          <Route path="/sll/notificacoes" element={<NotificationsPage />} />
          <Route path="/sll/informacoes" element={<AdminResourcePage resourceKey="information" readOnly />} />
          <Route path="/sll/assinatura" element={<EmailSignaturePage />} />
          <Route path="/sll/conta" element={<ManagerContaPage />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="/admin" element={<TalentDashboardPage usarDadosAdmin />} />
          <Route
            path="/admin/badges"
            element={
              <AdminResourcePage
                resourceKey="badges"
                variants={[
                  { key: 'badges', label: t('admin.badges.titulo') },
                  { key: 'badge-premium', label: t('admin.badgePremium.titulo') },
                ]}
              />
            }
          />
          <Route path="/admin/learning-paths" element={<AdminResourcePage resourceKey="learning-paths" />} />
          <Route path="/admin/service-lines" element={<AdminResourcePage resourceKey="service-lines" />} />
          <Route path="/admin/areas" element={<AdminResourcePage resourceKey="areas" />} />
          <Route path="/admin/niveis" element={<AdminResourcePage resourceKey="levels" />} />
          <Route path="/admin/requisitos" element={<AdminResourcePage resourceKey="requirements" />} />
          <Route path="/admin/politicas" element={<AdminResourcePage resourceKey="policies" />} />
          <Route path="/admin/avisos" element={<AdminResourcePage resourceKey="notices" />} />
          <Route path="/admin/informacoes" element={<AdminResourcePage resourceKey="information" />} />
          <Route path="/admin/utilizadores" element={<AdminUsersPage />} />
          <Route path="/admin/utilizadores/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/consultor/:id" element={<PublicProfilePage />} />
          <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
          <Route path="/admin/pedidos/:id" element={<AdminPedidoDetailPage />} />
          <Route path="/admin/relatorios" element={<TalentReportsPage soIndicadores />} />
          <Route path="/admin/templates-email" element={<AdminEmailTemplatesPage />} />
          <Route path="/admin/definicoes" element={<AdminDefinicoesPage />} />
          <Route path="/admin/assinatura" element={<EmailSignaturePage />} />
          <Route path="/admin/alterar-password" element={<ChangePasswordPage />} />
          <Route path="/admin/conta" element={<ManagerContaPage />} />
        </Route>

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
