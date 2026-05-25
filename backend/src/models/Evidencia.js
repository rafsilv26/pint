const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
  url: { 
    type: DataTypes.STRING, 
    allowNull: false // URL do Cloudinary
  },
  nomeFicheiro: { 
    type: DataTypes.STRING 
  },
  tipo: { 
    type: DataTypes.ENUM('PDF', 'IMAGEM'), 
    allowNull: false 
  }
});

module.exports = Evidencia;