const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BadgePremium = sequelize.define('BadgePremium', {
    badgePremiumId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    criteriaDescription: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
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
    tableName: 'BADGE_PREMIUM',
    timestamps: false
});

module.exports = BadgePremium;
