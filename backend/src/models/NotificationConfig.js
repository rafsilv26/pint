const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationConfig = sequelize.define('NotificationConfig', {
    configId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Ex: 'candidatura_submetida', 'sla_expirando'"
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    emailEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Se enviar por email'
    },
    pushEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se enviar push notification'
    },
    smsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se enviar SMS'
    },
    daysBefore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Dias antes do evento para notificar (ex: SLA alertas)'
    },
    templateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID do template de email (se houver)'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'NOTIFICACAO_CONFIG',
    timestamps: false
});

module.exports = NotificationConfig;
