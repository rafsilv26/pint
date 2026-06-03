const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notice = sequelize.define('Notice', {
    noticeId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Ex: 'info', 'warning', 'error'"
    },
    notificationType: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Link para configuração de notificação'
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Utilizador viu o aviso'
    },
    emailSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se já foi enviada notificação por email'
    },
    pushSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se já foi enviada notificação por push'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quando foi marcada como lida'
    }
}, {
    tableName: 'AVISOS',
    timestamps: false
});

module.exports = Notice;
