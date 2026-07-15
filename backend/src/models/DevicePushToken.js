const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DevicePushToken = sequelize.define('DevicePushToken', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false, unique: true },
  platform: { type: DataTypes.STRING(20), allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'DEVICE_PUSH_TOKEN',
  timestamps: false
});

module.exports = DevicePushToken;
