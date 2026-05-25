const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const LearningPath = require('./LearningPath');

const ServiceLine = sequelize.define('ServiceLine', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    nome: {  // Ex: "Hybrid Cloud"
        type: DataTypes.STRING, 
        allowNull: false 
    }
});

module.exports = ServiceLine;