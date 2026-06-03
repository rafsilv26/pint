const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalIntegration = sequelize.define('ExternalIntegration', {
    integrationId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    platform: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    externalUserId: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    webhookUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    accessToken: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    active: {
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
    }
}, {
    tableName: 'INTEGRACAO_EXTERNA',
    timestamps: false
});

module.exports = ExternalIntegration;
