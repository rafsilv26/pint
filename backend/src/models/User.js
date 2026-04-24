const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { 
        type: DataTypes.ENUM('Admin', 'Consultor', 'TalentManager', 'ServiceLine'), 
        allowNull: false 
    },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true }, // Requisito 1 
    area: { type: DataTypes.STRING } // Requisito 2 
});

module.exports = User;