const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsultorTimeline = sequelize.define('ConsultorTimeline', {
    timelineId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Ex: 'Completar Azure Fundamentals'"
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Data de início da actividade/meta'
    },
    expectedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data esperada para conclusão'
    },
    completionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quando foi efetivamente concluída'
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Ex: 'Meta', 'Milestone', 'Evento'"
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Ex: 'Pendente', 'Em Progresso', 'Concluído'"
    },
    priority: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '1 (alta) a 5 (baixa)'
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
    tableName: 'CONSULTOR_TIMELINE',
    timestamps: false
});

module.exports = ConsultorTimeline;
