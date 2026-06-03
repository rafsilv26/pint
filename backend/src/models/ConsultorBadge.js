const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsultorBadge = sequelize.define('ConsultorBadge', {
    consultorId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    badgeId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    obtainedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Quando conquistou'
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quando expira (pode ser null se não expira)'
    },
    durationMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Cópia da duração original (para histórico)'
    },
    valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'False se expirou ou foi revogada'
    },
    pointsObtained: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Pontos concedidos'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'CONSULTOR_BADGE',
    timestamps: false
});

module.exports = ConsultorBadge;
