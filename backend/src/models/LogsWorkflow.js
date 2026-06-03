const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogsWorkflow = sequelize.define('LogsWorkflow', {
    logId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    candidaturaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    oldStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    newStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'LOGSWORKFLOW_CANDIDATURABADGE',
    timestamps: false
});

module.exports = LogsWorkflow;
