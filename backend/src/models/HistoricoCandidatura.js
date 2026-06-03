const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estadoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estadoNovo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'LOGSWORKFLOW_CANDIDATURABADGE',
  timestamps: false
});

module.exports = HistoricoCandidatura;