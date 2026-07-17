const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
    templateId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Identificador do tipo de email. Ex: 'badge-aprovado', 'alerta-sla'"
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Assunto do email; aceita variáveis {{...}}'
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Corpo HTML interior do email; aceita variáveis {{...}}'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin que fez a última alteração'
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
    tableName: 'EMAIL_TEMPLATE',
    timestamps: false
});

module.exports = EmailTemplate;
