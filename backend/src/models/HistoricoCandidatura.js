const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'logId'
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'candidaturaId'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'userId'
  },
  estadoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'oldStatusId'
  },
  estadoNovo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'newStatusId'
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'reason'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  }
}, {
  tableName: 'LOGSWORKFLOW_CANDIDATURABADGE',
  timestamps: false
});

module.exports = HistoricoCandidatura;