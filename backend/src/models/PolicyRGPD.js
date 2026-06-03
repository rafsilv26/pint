const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PolicyRGPD = sequelize.define('PolicyRGPD', {
    policyId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    version: {
        type: DataTypes.STRING(15),
        allowNull: false,
        comment: "Ex: '1.0', '1.1', '2.0'"
    },
    effectiveDate: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Quando a política entra em vigor'
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quando a política é substituída (null = ainda ativa)'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Controla se é apresentada para aceitar'
    },
    mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Se deve ser aceita para usar plataforma'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Admin que criou'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'POLITICARGPD',
    timestamps: false
});

module.exports = PolicyRGPD;
