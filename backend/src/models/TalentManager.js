const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TalentManager = sequelize.define('TalentManager', {
    tmId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Users', key: 'id' }
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
    tableName: 'TALENT_MANAGER',
    timestamps: false
});

module.exports = TalentManager;
