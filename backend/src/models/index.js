const User = require('./User');
const Badge = require('./Badge');
const Candidatura = require('./Candidatura');
const Evidencia = require('./Evidencia');
const HistoricoCandidatura = require('./HistoricoCandidatura');

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

module.exports = { 
  User, 
  Badge, 
  Candidatura, 
  Evidencia, 
  HistoricoCandidatura 
};