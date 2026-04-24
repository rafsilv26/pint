const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./src/config/database');

const app = express();

// Middlewares Globais
app.use(cors()); // Permite pedidos do Vite e Flutter
app.use(express.json()); // Permite ler JSON no corpo do pedido (req.body)

// Teste de Ligação à BD
sequelize.authenticate()
    .then(() => console.log('Conetado ao Neon com sucesso!'))
    .catch(err => console.error('Erro ao ligar ao Neon:', err));

// Rotas (criar a seguir)
// app.use('/api/auth', require('./src/routes/authRoutes'));
// app.use('/api/users', require('./src/routes/userRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});