const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LearningPath = sequelize.define('LearningPath', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    nome: { // Ex: "Desenvolvimento Web Full Stack"
        type: DataTypes.STRING, 
        allowNull: false 
    }
});

module.exports = LearningPath;