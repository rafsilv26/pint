const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Requirement = sequelize.define('Requirement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nivelId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    icone: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    obrigatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ordem: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    tableName: 'REQUISITO',
    timestamps: false
});

module.exports = Requirement;