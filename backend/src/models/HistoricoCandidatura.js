const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'LOGWF_ID'
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'CANDIDATURAID' // Isto trava o erro atual!
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'USERID'
  },
  estadoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ANTIGO_ESTADOID'
  },
  estadoNovo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'NOVO_ESTADOID'
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'MOTIVO'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'CREATED_AT'
  }
}, {
  tableName: 'LOGSWORKFLOW_CANDIDATURABADGE',
  timestamps: false 
});

module.exports = HistoricoCandidatura;