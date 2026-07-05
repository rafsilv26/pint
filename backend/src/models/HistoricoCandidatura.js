const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'logwf_id' // Traduz 'id' no JS para 'logwf_id' na BD
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'candidaturaid'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'userid'
  },
  estadoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'antigo_estadoid' // Traduz 'estadoAnterior' no JS para 'antigo_estadoid' na BD
  },
  estadoNovo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'novo_estadoid' // Traduz 'estadoNovo' no JS para 'novo_estadoid' na BD
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'motivo'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'LOGSWORKFLOW_CANDIDATURABADGE',
  timestamps: false // Desligamos os timestamps automáticos porque já mapeámos o createdAt acima
});

module.exports = HistoricoCandidatura;