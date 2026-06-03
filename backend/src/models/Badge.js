const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nivelId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT
  },
  ponto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Pontos gamification atribuídos ao conquistar badge'
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Ex: 'Certificacao', 'Formacao', 'Conquista'"
  },
  fornecedor: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Entidade que oferece (ex: AWS, Microsoft, etc)'
  },
  custoEstimado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Custo financeiro para completar a badge'
  },
  expiracao: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: false,
    comment: 'Data absoluta de expiração (null = nunca expira)'
  },
  duracaoMeses: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Meses até expiração (ex: 12 meses para AWS)'
  },
  imagem: {
    type: DataTypes.STRING,
    comment: 'URL da imagem/icon da badge'
  },
  slug: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: "URL-friendly identifier para públicos (ex: 'aws-solutions-architect'), que depois fica /badges/aws-solutions-architect para a pagina pública"
  },
  publicToken: {
    type: DataTypes.STRING(255),
    unique: true,
    comment: 'Token público para compartilhar prova de conquista'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'BADGE',
  timestamps: false
});

module.exports = Badge;
