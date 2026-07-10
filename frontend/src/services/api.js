// =============================================================
//  SELETOR DA API
//  Escolhe entre a implementação MOCK e a REAL (backend) consoante
//  a variável de ambiente VITE_USE_REAL_API.
//
//    VITE_USE_REAL_API=false  -> dados mock (default)
//    VITE_USE_REAL_API=true   -> chama o backend em VITE_API_URL
//
//  Define estas variáveis em frontend/.env e reinicia o `npm run dev`.
//  As páginas importam sempre daqui — não precisam de saber qual está ativa.
// =============================================================
import * as mock from './apiMock'
import * as real from './apiReal'

export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true'

const impl = USE_REAL_API ? real : mock

// Autenticação
export const login = impl.login
export const register = impl.register
export const recuperarPassword = impl.recuperarPassword
export const changePassword = impl.changePassword
export const me = impl.me

// Dashboard / catálogo
export const getDashboard = impl.getDashboard
export const getBadges = impl.getBadges
export const getBadge = impl.getBadge

// Candidaturas
export const getMinhasCandidaturas = impl.getMinhasCandidaturas
export const submeterCandidatura = impl.submeterCandidatura
export const getMeusBadges = impl.getMeusBadges

// Notificações
export const getNotificacoes = impl.getNotificacoes
export const markNotificationRead = impl.markNotificationRead
export const markAllNotificationsRead = impl.markAllNotificationsRead

// Gamificação / consultores
export const getGamification = impl.getGamification
export const getConsultants = impl.getConsultants
export const getConsultant = impl.getConsultant
export const updateConsultant = impl.updateConsultant

// Assinatura de email
export const getEmailSignature = impl.getEmailSignature
export const saveEmailSignature = impl.saveEmailSignature

// Público
export const verificarBadge = impl.verificarBadge

// Talent Manager
export const getTalentDashboard = impl.getTalentDashboard
export const getTalentCandidaturas = impl.getTalentCandidaturas
export const getCandidatura = impl.getCandidatura
export const validarTalentManager = impl.validarTalentManager

// Service Line Leader
export const getServiceLineDashboard = impl.getServiceLineDashboard
export const getServiceLinePedidos = impl.getServiceLinePedidos
export const validarServiceLine = impl.validarServiceLine

// Admin (CRUD genérico)
export const listResource = impl.listResource
export const createResource = impl.createResource
export const updateResource = impl.updateResource
export const deleteResource = impl.deleteResource

// Admin: utilizadores, pedidos, exportações
export const getUsers = impl.getUsers
export const createUser = impl.createUser
export const updateUser = impl.updateUser
export const deleteUser = impl.deleteUser
export const getAdminPedidos = impl.getAdminPedidos
export const getAdminDashboard = impl.getAdminDashboard
export const exportarRelatorio = impl.exportarRelatorio
