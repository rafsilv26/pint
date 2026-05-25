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

// Um Consultor pode ter várias Candidaturas
User.hasMany(Candidatura, { foreignKey: 'consultorId', as: 'candidaturas' });
Candidatura.belongsTo(User, { foreignKey: 'consultorId', as: 'consultor' });

// Um Badge pode ter várias Candidaturas
Badge.hasMany(Candidatura, { foreignKey: 'badgeId' });
Candidatura.belongsTo(Badge, { foreignKey: 'badgeId' });

// Uma Candidatura tem várias Evidências
Candidatura.hasMany(Evidencia, { foreignKey: 'candidaturaId' });
Evidencia.belongsTo(Candidatura, { foreignKey: 'candidaturaId' });

// Uma Candidatura tem um Histórico
Candidatura.hasMany(HistoricoCandidatura, { foreignKey: 'candidaturaId' });
HistoricoCandidatura.belongsTo(Candidatura, { foreignKey: 'candidaturaId' });

// Quem fez cada ação no histórico
User.hasMany(HistoricoCandidatura, { foreignKey: 'userId' });
HistoricoCandidatura.belongsTo(User, { foreignKey: 'userId', as: 'responsavel' });

// Uma Service Line pertence a um Learning Path
ServiceLine.belongsTo(LearningPath, { foreignKey: 'learningPathId', onDelete: 'CASCADE' });
LearningPath.hasMany(ServiceLine, { foreignKey: 'learningPathId' });

// Uma Area pertence a uma Service Line
Area.belongsTo(ServiceLine, { foreignKey: 'serviceLineId', onDelete: 'CASCADE' });
ServiceLine.hasMany(Area, { foreignKey: 'serviceLineId' });

// Uma level pertence a uma Area
Level.belongsTo(Area, { foreignKey: 'areaId', onDelete: 'CASCADE' });
Area.hasMany(Level, { foreignKey: 'areaId' });

// Um Badge pode estar associado a um Nível (Opcional, aceita NULL)
Badge.belongsTo(Level, { foreignKey: { name: 'levelId', allowNull: true }, onDelete: 'CASCADE' });
Level.hasOne(Badge, { foreignKey: 'levelId' });

// Um Requirement pertence a um Level
Requirement.belongsTo(Level, { foreignKey: 'levelId', onDelete: 'CASCADE' });
Level.hasMany(Requirement, { foreignKey: 'levelId' });

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
  Requirement
};