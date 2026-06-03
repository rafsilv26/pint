const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
    feedbackId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    candidaturaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false
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
    tableName: 'FEEDBACK_CANDIDATURA',
    timestamps: false
});

module.exports = Feedback;
