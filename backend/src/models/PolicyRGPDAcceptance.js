const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PolicyRGPDAcceptance = sequelize.define('PolicyRGPDAcceptance', {
    policyId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    consultorId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    acceptanceDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Quando aceitou'
    },
    originIP: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Para audit trail e conformidade'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Browser/device info para compliance'
    }
}, {
    tableName: 'ACEITACAO_POLITICA_RGPD',
    timestamps: false
});

module.exports = PolicyRGPDAcceptance;
