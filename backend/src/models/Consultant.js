const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consultant = sequelize.define('Consultant', {
    consultorId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Users', key: 'id' }
    },
    areaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    linkedinUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    biography: {
        type: DataTypes.TEXT,
        allowNull: true
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
    tableName: 'CONSULTOR',
    timestamps: false
});

module.exports = Consultant;
