const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LearningPath = sequelize.define('LearningPath', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING(1000),
        allowNull: true
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
    tableName: 'LEARNING_PATH',
    timestamps: false
});

module.exports = LearningPath;