const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceLineLeader = sequelize.define('ServiceLineLeader', {
    sslId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'UTILIZADOR', key: 'id' }
    },
    serviceLineId: {
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
    }
}, {
    tableName: 'SERVICELINE_LIDER',
    timestamps: false
});

module.exports = ServiceLineLeader;
