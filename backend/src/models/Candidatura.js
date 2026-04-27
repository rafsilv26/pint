const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidatura = sequelize.define('Candidatura', {
  estado: { 
    type: DataTypes.ENUM(
      'OPEN', 
      'SUBMITTED', 
      'EM_VALIDACAO', 
      'FECHADO_APROVADO', 
      'FECHADO_REJEITADO'
    ), 
    defaultValue: 'OPEN' 
  },
  // Quem avaliou em cada etapa e quando
  talentManagerId: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  dataValidacaoTalent: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  serviceLineLeaderId: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  dataValidacaoServiceLine: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  comentario: { 
    type: DataTypes.TEXT, // comentário de rejeição ou send back
    allowNull: true 
  },
  dataExpiracao: { 
    type: DataTypes.DATE, 
    allowNull: true 
  }
});

module.exports = Candidatura;