const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Level = sequelize.define('Level', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    areaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ordem: { // Para saberem a ordem de progressão (A, B, C...)
        type: DataTypes.CHAR(1), 
        allowNull: false 
    },
    ativo: {
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
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'NIVEL',
    timestamps: false
});

module.exports = Level;