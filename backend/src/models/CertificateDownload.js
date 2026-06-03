const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CertificateDownload = sequelize.define('CertificateDownload', {
    downloadId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    badgeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    downloadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    originIP: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    format: {
        type: DataTypes.STRING(20),
        defaultValue: 'PDF'
    }
}, {
    tableName: 'CERTIFICADO_DOWNLOAD',
    timestamps: false
});

module.exports = CertificateDownload;
