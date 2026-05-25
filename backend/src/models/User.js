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
        role: {
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
            defaultValue: true, // Requisito: Forçar a mudar no primeiro acesso
        },
    },
    {
        hooks: {
        // Encripta a password automaticamente antes de guardar na BD
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
