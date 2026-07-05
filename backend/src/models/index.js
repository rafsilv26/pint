const User = require('./User');
const Badge = require('./Badge');
const Candidatura = require('./Candidatura');
const Evidencia = require('./Evidencia');
const HistoricoCandidatura = require('./HistoricoCandidatura');
const LearningPath = require('./LearningPath');
const ServiceLine = require('./ServiceLine');
const Area = require('./Area');
const Level = require('./Level');
const Requirement = require('./Requirement');
const Administrator = require('./Administrator');
const Consultant = require('./Consultant');
const ServiceLineLeader = require('./ServiceLineLeader');
const TalentManager = require('./TalentManager');
const PolicyRGPD = require('./PolicyRGPD');
const PolicyRGPDAcceptance = require('./PolicyRGPDAcceptance');
const BadgeStatus = require('./BadgeStatus');
const SLAConfig = require('./SLAConfig');
const ConsultorBadge = require('./ConsultorBadge');
const CertificateDownload = require('./CertificateDownload');
const BadgePremium = require('./BadgePremium');
const ConsultorBadgePremium = require('./ConsultorBadgePremium');
const ConsultorTimeline = require('./ConsultorTimeline');
const RankingSnapshot = require('./RankingSnapshot');
const NotificationConfig = require('./NotificationConfig');
const Notice = require('./Notice');
const Information = require('./Information');
const Feedback = require('./Feedback');
const ExternalIntegration = require('./ExternalIntegration');
const EmailSignature = require('./EmailSignature');
const LogsWorkflow = require('./LogsWorkflow');

// User roles associations
User.hasOne(Administrator, { foreignKey: 'adminId' });
Administrator.belongsTo(User, { foreignKey: 'adminId' });

User.hasOne(Consultant, { foreignKey: 'consultorId' });
Consultant.belongsTo(User, { foreignKey: 'consultorId' });

User.hasOne(ServiceLineLeader, { foreignKey: 'sslId' });
ServiceLineLeader.belongsTo(User, { foreignKey: 'sslId' });

User.hasOne(TalentManager, { foreignKey: 'tmId' });
TalentManager.belongsTo(User, { foreignKey: 'tmId' });

// Organizational hierarchy
LearningPath.hasMany(ServiceLine, { foreignKey: 'learningPathId', as: 'serviceLines' });
ServiceLine.belongsTo(LearningPath, { foreignKey: 'learningPathId' });

ServiceLine.hasMany(Area, { foreignKey: 'serviceLineId', as: 'areas' });
Area.belongsTo(ServiceLine, { foreignKey: 'serviceLineId' });

Area.hasMany(Level, { foreignKey: 'areaId', as: 'levels' });
Level.belongsTo(Area, { foreignKey: 'areaId' });

Area.hasMany(Consultant, { foreignKey: 'areaId', as: 'consultants' });
Consultant.belongsTo(Area, { foreignKey: 'areaId' });

ServiceLine.hasMany(ServiceLineLeader, { foreignKey: 'serviceLineId' });
ServiceLineLeader.belongsTo(ServiceLine, { foreignKey: 'serviceLineId' });

// Badge and Level
Level.hasMany(Badge, { foreignKey: 'nivelId', as: 'badges' });
Badge.belongsTo(Level, { foreignKey: 'nivelId' });

Level.hasMany(Requirement, { foreignKey: 'nivelId', as: 'requirements' });
Requirement.belongsTo(Level, { foreignKey: 'nivelId' });

// Candidature workflow
Badge.hasMany(Candidatura, { foreignKey: 'badgeId', as: 'candidaturas' });
Candidatura.belongsTo(Badge, { foreignKey: 'badgeId' });

Consultant.hasMany(Candidatura, { foreignKey: 'consultorId', as: 'candidaturas' });
Candidatura.belongsTo(Consultant, { foreignKey: 'consultorId' });

BadgeStatus.hasMany(Candidatura, { foreignKey: 'estadoId' });
Candidatura.belongsTo(BadgeStatus, { foreignKey: 'estadoId', as: 'status' });

TalentManager.hasMany(Candidatura, { foreignKey: 'talentManagerId' });
Candidatura.belongsTo(TalentManager, { foreignKey: 'talentManagerId', as: 'talentManager' });

ServiceLineLeader.hasMany(Candidatura, { foreignKey: 'serviceLineLeaderId' });
Candidatura.belongsTo(ServiceLineLeader, { foreignKey: 'serviceLineLeaderId', as: 'serviceLineLeader' });

SLAConfig.hasMany(Candidatura, { foreignKey: 'slaId' });
Candidatura.belongsTo(SLAConfig, { foreignKey: 'slaId' });

// Evidence
Candidatura.hasMany(Evidencia, { foreignKey: 'candidaturaId', as: 'evidencias' });
Evidencia.belongsTo(Candidatura, { foreignKey: 'candidaturaId' });

Requirement.hasMany(Evidencia, { foreignKey: 'requisitoId', as: 'evidencias' });
Evidencia.belongsTo(Requirement, { foreignKey: 'requisitoId' });

// Candidature history
Candidatura.hasMany(HistoricoCandidatura, { 
    foreignKey: { name: 'candidaturaId', field: 'CANDIDATURAID' }, 
    as: 'history' 
});

HistoricoCandidatura.belongsTo(Candidatura, { 
    foreignKey: { name: 'candidaturaId', field: 'CANDIDATURAID' } 
});

User.hasMany(HistoricoCandidatura, { foreignKey: 'userId' });
HistoricoCandidatura.belongsTo(User, { foreignKey: 'userId', as: 'responsavel' });

BadgeStatus.hasMany(HistoricoCandidatura, { foreignKey: 'estadoAnterior', as: 'oldStatus' });
BadgeStatus.hasMany(HistoricoCandidatura, { foreignKey: 'estadoNovo', as: 'newStatus' });

// Feedback
Candidatura.hasMany(Feedback, { foreignKey: 'candidaturaId', as: 'feedback' });
Feedback.belongsTo(Candidatura, { foreignKey: 'candidaturaId' });

User.hasMany(Feedback, { foreignKey: 'userId' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Badge acquisition and tracking
Consultant.hasMany(ConsultorBadge, { foreignKey: 'consultorId', as: 'acquiredBadges' });
ConsultorBadge.belongsTo(Consultant, { foreignKey: 'consultorId' });

Badge.hasMany(ConsultorBadge, { foreignKey: 'badgeId', as: 'acquiredBy' });
ConsultorBadge.belongsTo(Badge, { foreignKey: 'badgeId' });

ConsultorBadge.hasMany(CertificateDownload, { foreignKey: ['consultorId', 'badgeId'] });
CertificateDownload.belongsTo(ConsultorBadge, { foreignKey: ['consultorId', 'badgeId'] });

ConsultorBadge.hasMany(EmailSignature, { foreignKey: ['consultorId', 'badgeId'] });
EmailSignature.belongsTo(ConsultorBadge, { foreignKey: ['consultorId', 'badgeId'] });

// Premium badges
BadgePremium.hasMany(ConsultorBadgePremium, { foreignKey: 'badgePremiumId', as: 'acquiredBy' });
ConsultorBadgePremium.belongsTo(BadgePremium, { foreignKey: 'badgePremiumId' });

Consultant.hasMany(ConsultorBadgePremium, { foreignKey: 'consultorId', as: 'premiumBadges' });
ConsultorBadgePremium.belongsTo(Consultant, { foreignKey: 'consultorId' });

// Timeline and ranking
Consultant.hasMany(ConsultorTimeline, { foreignKey: 'consultorId', as: 'timeline' });
ConsultorTimeline.belongsTo(Consultant, { foreignKey: 'consultorId' });

Consultant.hasMany(RankingSnapshot, { foreignKey: 'consultorId', as: 'rankings' });
RankingSnapshot.belongsTo(Consultant, { foreignKey: 'consultorId' });

// Policies
Administrator.hasMany(PolicyRGPD, { foreignKey: 'createdBy' });
PolicyRGPD.belongsTo(Administrator, { foreignKey: 'createdBy', as: 'creator' });

PolicyRGPD.hasMany(PolicyRGPDAcceptance, { foreignKey: 'policyId', as: 'acceptances' });
PolicyRGPDAcceptance.belongsTo(PolicyRGPD, { foreignKey: 'policyId' });

Consultant.hasMany(PolicyRGPDAcceptance, { foreignKey: 'consultorId' });
PolicyRGPDAcceptance.belongsTo(Consultant, { foreignKey: 'consultorId' });

// Notifications
User.hasMany(Notice, { foreignKey: 'userId', as: 'notices' });
Notice.belongsTo(User, { foreignKey: 'userId' });

NotificationConfig.hasMany(Notice, { foreignKey: 'notificationType' });
Notice.belongsTo(NotificationConfig, { foreignKey: 'notificationType', as: 'notificationConfig' });

// Information
Administrator.hasMany(Information, { foreignKey: 'createdBy' });
Information.belongsTo(Administrator, { foreignKey: 'createdBy', as: 'creator' });

// Integrations
User.hasMany(ExternalIntegration, { foreignKey: 'userId', as: 'integrations' });
ExternalIntegration.belongsTo(User, { foreignKey: 'userId' });

// Logs
User.hasMany(LogsWorkflow, { foreignKey: 'userId' });
LogsWorkflow.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

Candidatura.hasMany(LogsWorkflow, { foreignKey: 'candidaturaId', as: 'logs' });
LogsWorkflow.belongsTo(Candidatura, { foreignKey: 'candidaturaId' });

module.exports = {
  User,
  Badge,
  Candidatura,
  Evidencia,
  HistoricoCandidatura,
  LearningPath,
  ServiceLine,
  Area,
  Level,
  Requirement,
  Administrator,
  Consultant,
  ServiceLineLeader,
  TalentManager,
  PolicyRGPD,
  PolicyRGPDAcceptance,
  BadgeStatus,
  SLAConfig,
  ConsultorBadge,
  CertificateDownload,
  BadgePremium,
  ConsultorBadgePremium,
  ConsultorTimeline,
  RankingSnapshot,
  NotificationConfig,
  Notice,
  Information,
  Feedback,
  ExternalIntegration,
  EmailSignature,
  LogsWorkflow
};