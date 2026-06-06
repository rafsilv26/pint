const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BadgeStatus = sequelize.define('BadgeStatus', {
    statusId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    code: {
        type: DataTypes.STRING(20)
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'ESTADO_CANDIDATURABADGE',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['code']
        }
    ]
});

module.exports = BadgeStatus;
