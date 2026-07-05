const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'logId' // <-- O ID real na tua base de dados Neon
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'candidaturaId' // Mapeamento exato (camelCase)
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'userId'
  },
  estadoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'oldStatusId' // Em vez de ANTIGO_ESTADOID
  },
  estadoNovo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'newStatusId' // Em vez de NOVO_ESTADOID
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'reason' // Em vez de MOTIVO
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  }
}, {
  // ATENÇÃO: Confirma se o nome da tabela na Neon continua a ser este. 
  // Se for algo como 'Histories' ou 'HistoricoCandidaturas', altera aqui!
  tableName: 'LOGSWORKFLOW_CANDIDATURABADGE', 
  timestamps: false 
});

module.exports = HistoricoCandidatura;