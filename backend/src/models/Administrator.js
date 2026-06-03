const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Administrator = sequelize.define('Administrator', {
    adminId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Users', key: 'id' }
    }
}, {
    tableName: 'ADMINISTRADOR',
    timestamps: false
});

module.exports = Administrator;
