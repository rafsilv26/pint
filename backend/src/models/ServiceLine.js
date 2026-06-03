const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceLine = sequelize.define('ServiceLine', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    learningPathId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING(1000),
        allowNull: true
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
    tableName: 'SERVICELINE',
    timestamps: false
});

module.exports = ServiceLine;