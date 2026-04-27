const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  estadoAnterior: { 
    type: DataTypes.STRING 
  },
  estadoNovo: { 
    type: DataTypes.STRING 
  },
  comentario: { 
    type: DataTypes.TEXT 
  },
  acao: {
    type: DataTypes.ENUM(
      'SUBMETIDO',
      'APROVADO_TALENT',
      'REJEITADO_TALENT', 
      'APROVADO_SERVICELINE',
      'REJEITADO_SERVICELINE',
      'SEND_BACK'
    )
  },
  // quem fez a ação fica guardado pela associação com User
});

module.exports = HistoricoCandidatura;