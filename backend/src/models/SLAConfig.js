const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SLAConfig = sequelize.define('SLAConfig', {
    slaId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Ex: 'SLA Standard', 'SLA Premium'"
    },
    team: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "Equipa a que o SLA se aplica: 'talent', 'serviceline' ou null (global, aplica-se às duas)"
    },
    responseDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Dias até deadline de decisão'
    },
    alertDaysBeforeExpiration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Dias antes de SLA para enviar alertas'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Admin que criou esta configuração'
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
    tableName: 'SLA_CONFIG',
    timestamps: false
});

module.exports = SLAConfig;
