const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fotoPerfil: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        idioma: {
            type: DataTypes.STRING(5),
            defaultValue: 'PT',
            comment: 'Preferência de língua (PT, EN, ES, etc)',
        },
        role: { // necessário para autenticação e autorização rapida com o auth middleware
            type: DataTypes.ENUM(
                "Admin",
                "Consultor",
                "TalentManager",
                "ServiceLineLeader",
            ),
            allowNull: false,
            defaultValue: "Consultor",
        },
        mustChangePassword: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Flag para forçar mudança de password no primeiro acesso',
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Token seguro para recuperação de password',
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Validade do token de reset (normalmente 1-2h)',
        },
        emailConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Email foi confirmado pelo utilizador',
        },
        emailConfirmationToken: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Token para confirmação de email',
        },
        notificationPreference: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "Ex: 'email_daily', 'push_immediate', etc",
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp do último acesso',
        },
        firstLoginDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Para tracking de onboarding',
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Soft delete flag',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp de eliminação lógica',
        },
    },
    {
        tableName: 'UTILIZADOR',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed("password")) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    },
);

module.exports = User;
