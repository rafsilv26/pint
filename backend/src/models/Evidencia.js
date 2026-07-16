const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
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
  },
  candidaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  clientEvidenceId: {
    type: DataTypes.STRING(160),
    allowNull: true,
    comment: 'Identificador idempotente da evidência enviado pela aplicação mobile'
  },
  requisitoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  dataUpload: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  validado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null
  },
  validadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  validadoEm: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'EVIDENCIA',
  timestamps: false,
  indexes: [{
    unique: true,
    fields: ['candidaturaId', 'clientEvidenceId'],
    name: 'evidencia_candidatura_client_evidence_unique'
  }]
});

module.exports = Evidencia;
