

import * as mock from './apiMock'
import * as real from './apiReal'

const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true'

const impl = USE_REAL_API ? real : mock

export const login = impl.login
export const getAreasPublicas = impl.getAreasPublicas
export const recuperarPassword = impl.recuperarPassword
export const resetPassword = impl.resetPassword
export const confirmarEmail = impl.confirmarEmail
export const changePassword = impl.changePassword
export const me = impl.me
export const acceptPolicy = impl.acceptPolicy
export const saveIdioma = impl.saveIdioma

export const getDashboard = impl.getDashboard
export const getBadges = impl.getBadges
export const getBadgesPremium = impl.getBadgesPremium
export const getBadge = impl.getBadge

export const getMinhasCandidaturas = impl.getMinhasCandidaturas
export const submeterCandidatura = impl.submeterCandidatura
export const getRascunho = impl.getRascunho
export const apagarEvidencia = impl.apagarEvidencia
export const getDefinicoes = impl.getDefinicoes
export const saveDefinicoes = impl.saveDefinicoes
export const difundirAviso = impl.difundirAviso
export const getEmailTemplates = impl.getEmailTemplates
export const saveEmailTemplate = impl.saveEmailTemplate
export const resetEmailTemplate = impl.resetEmailTemplate
export const previewEmailTemplate = impl.previewEmailTemplate
export const testEmailTemplate = impl.testEmailTemplate
export const getSlaConfigs = impl.getSlaConfigs
export const saveSlaTeam = impl.saveSlaTeam
export const criarSlaConfig = impl.criarSlaConfig
export const atualizarSlaConfig = impl.atualizarSlaConfig
export const apagarSlaConfig = impl.apagarSlaConfig
export const runSlaCheck = impl.runSlaCheck
export const getMeusObjetivos = impl.getMeusObjetivos
export const criarObjetivo = impl.criarObjetivo
export const concluirObjetivo = impl.concluirObjetivo
export const apagarObjetivo = impl.apagarObjetivo
export const getObjetivosConsultor = impl.getObjetivosConsultor
export const criarObjetivoConsultor = impl.criarObjetivoConsultor
export const apagarObjetivoConsultor = impl.apagarObjetivoConsultor
export const getMeusBadges = impl.getMeusBadges

export const getNotificacoes = impl.getNotificacoes
export const markNotificationRead = impl.markNotificationRead
export const markAllNotificationsRead = impl.markAllNotificationsRead
export const getNotificationPrefs = impl.getNotificationPrefs
export const saveNotificationPrefs = impl.saveNotificationPrefs

export const getGamification = impl.getGamification
export const getConsultants = impl.getConsultants
export const getConsultant = impl.getConsultant
export const updateConsultant = impl.updateConsultant
export const getConsultantCandidaturas = impl.getConsultantCandidaturas

export const getEmailSignature = impl.getEmailSignature
export const saveEmailSignature = impl.saveEmailSignature

export const verificarBadge = impl.verificarBadge

export const getTalentDashboard = impl.getTalentDashboard
export const getTalentProfile = impl.getTalentProfile
export const getTalentCandidaturas = impl.getTalentCandidaturas
export const getTalentDecisionHistory = impl.getTalentDecisionHistory
export const getCandidatura = impl.getCandidatura
export const validarTalentManager = impl.validarTalentManager
export const validarEvidencia = impl.validarEvidencia
export const getTalentReports = impl.getTalentReports
export const getTalentConsultants = impl.getTalentConsultants
export const getTalentConsultant = impl.getTalentConsultant
export const getTalentConsultantReport = impl.getTalentConsultantReport
export const getTalentCatalog = impl.getTalentCatalog

export const getServiceLineDashboard = impl.getServiceLineDashboard
export const getServiceLineProfile = impl.getServiceLineProfile
export const getServiceLineConsultants = impl.getServiceLineConsultants
export const getServiceLinePedidos = impl.getServiceLinePedidos
export const getServiceLineDecisionHistory = impl.getServiceLineDecisionHistory
export const getServiceLineReports = impl.getServiceLineReports
export const validarServiceLine = impl.validarServiceLine
export const downloadManagerCertificate = impl.downloadManagerCertificate
export const atribuirBadgePremium = impl.atribuirBadgePremium
export const revogarBadgePremium = impl.revogarBadgePremium

export const listResource = impl.listResource
export const createResource = impl.createResource
export const updateResource = impl.updateResource
export const deleteResource = impl.deleteResource

export const getUsers = impl.getUsers
export const createUser = impl.createUser
export const updateUser = impl.updateUser
export const deleteUser = impl.deleteUser
export const getAdminPedidos = impl.getAdminPedidos
export const getAdminDashboard = impl.getAdminDashboard
