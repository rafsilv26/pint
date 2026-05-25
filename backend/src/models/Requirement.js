const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Level = require('./Level');

const Requirement = sequelize.define('Requirement', {
    id: { type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    nome: { // Ex: "Curso AWS Practitioner"
        type: DataTypes.STRING, 
        allowNull: false 
    }, 
    descricao: { 
        type: DataTypes.TEXT 
    },
    tipo: { 
        type: DataTypes.ENUM('Curso', 'Certificacao', 'Formacao'), 
        defaultValue: 'Curso' 
    }
});

module.exports = Requirement;