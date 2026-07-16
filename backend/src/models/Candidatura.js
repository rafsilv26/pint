const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidatura = sequelize.define('Candidatura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estadoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Estado atual do workflow'
  },
  consultorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Quem está a candidatar-se'
  },
  clientSubmissionId: {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: 'Chave idempotente enviada pela aplicação mobile'
  },
  talentManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Talent Manager responsável pela validação'
  },
  serviceLineLeaderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Service Line Leader responsável pela aprovação'
  },
  slaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Configuração SLA aplicada'
  },
  dataSubmicao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Quando foi submetida'
  },
  dataSlaLimite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deadline calculado segundo SLA'
  },
  dataValidacao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Quando foi validada por TM'
  },
  dataAprovacao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Quando foi aprovada por SSL'
  },
  slaExcedido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Flag para alertas de SLA'
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'CANDIDATURABADGE',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['consultorId', 'clientSubmissionId'],
    name: 'candidatura_consultor_client_submission_unique'
  }]
});

module.exports = Candidatura;
