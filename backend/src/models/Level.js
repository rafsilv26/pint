const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Area = require('./Area');
const Badge = require('./Badge');

const Level = sequelize.define('Level', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    nome: { // Ex: "Júnior"
        type: DataTypes.STRING, 
        allowNull: false 
    }, 
    ordem: { // Para saberem a ordem de progressão (A, B, C...)
        type: DataTypes.CHAR(1), 
        allowNull: false 
    } 
});

module.exports = Level;