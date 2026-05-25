const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ServiceLine = require('./ServiceLine');

const Area = sequelize.define('Area', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    nome: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
});

module.exports = Area;