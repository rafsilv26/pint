require('dotenv').config(); // Carrega as variáveis do .env
const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
    console.error('[database] DATABASE_URL em falta — verifica as env vars no Render.');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }, // Obrigatório para o Neon
        connectionTimeoutMillis: 10000 // Falha em 10s em vez de pendurar o arranque
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 15000, // Não esperar indefinidamente por uma ligação livre
        idle: 10000
    },
    logging: false
});

module.exports = sequelize;