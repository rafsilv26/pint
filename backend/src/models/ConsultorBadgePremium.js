const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsultorBadgePremium = sequelize.define('ConsultorBadgePremium', {
    badgePremiumId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    consultorId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    achievementDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'CONSULTOR_BADGEPREMIUM',
    timestamps: false
});

module.exports = ConsultorBadgePremium;
