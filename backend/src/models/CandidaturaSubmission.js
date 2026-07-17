const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Ledger imutável das operações enviadas pelos clientes. A candidatura pode
// voltar a OPEN e ser submetida novamente, por isso uma única chave guardada
// na CANDIDATURABADGE não chega para distinguir todas as tentativas.
const CandidaturaSubmission = sequelize.define('CandidaturaSubmission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  consultorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  clientSubmissionId: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  responseBody: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'CANDIDATURA_CLIENT_SUBMISSION',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['consultorId', 'clientSubmissionId'],
    name: 'candidatura_submission_consultor_client_unique'
  }]
});

module.exports = CandidaturaSubmission;
