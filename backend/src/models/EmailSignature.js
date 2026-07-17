const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailSignature = sequelize.define('EmailSignature', {
    signatureId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    badgeId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    templateHtml: {
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
    tableName: 'EMAIL_ASSINATURA',
    timestamps: false
});

module.exports = EmailSignature;
