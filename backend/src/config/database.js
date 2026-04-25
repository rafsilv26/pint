require('dotenv').config(); // Carrega as variáveis do .env
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false } // Obrigatório para o Neon
    }
});

module.exports = sequelize;