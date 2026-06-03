const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RankingSnapshot = sequelize.define('RankingSnapshot', {
    rankingId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    periodDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Data do snapshot (ex: 2026-06-01)'
    },
    consultorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalPoints: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Pontos acumulados até essa data'
    },
    totalBadges: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Número total de badges conquistadas'
    },
    generalPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Posição no ranking geral'
    },
    serviceLinePosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Posição na sua service line'
    },
    areaPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Posição na sua área'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Quando foi capturado o snapshot'
    }
}, {
    tableName: 'RANKING_SNAPSHOT',
    timestamps: false
});

module.exports = RankingSnapshot;
