const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  nome: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  descricao: { 
    type: DataTypes.TEXT 
  },
  imagem: { 
    type: DataTypes.STRING // URL da imagem
  },
  nivel: { 
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E'), 
    allowNull: false 
  },
  pontos: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  uuid: { 
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // link único verificável
    unique: true
  },
  temExpiracao: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
  duracaoMeses: { 
    type: DataTypes.INTEGER, // quantos meses até expirar
    allowNull: true 
  },
  ativo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
});

module.exports = Badge;