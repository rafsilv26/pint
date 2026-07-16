const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Override personalizado de um template de email (guião — bónus Consultor 23 /
// req. Admin 7). Quando existe uma linha ativa para um `code`, o assunto e o
// corpo aqui guardados substituem o template por omissão definido no código
// (ver emailTemplate.service.js). Apagar a linha repõe o padrão.
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
