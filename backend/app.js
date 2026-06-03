const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./src/config/database');
require('./src/models'); // Importa os modelos para garantir que estão registrados no Sequelize

const app = express();

// Middlewares Globais
app.use(cors()); // Permite pedidos do Vite e Flutter
app.use(express.json()); // Permite ler JSON no corpo do pedido (req.body)

// Teste de Ligação à BD
sequelize.authenticate()
    .then(() => {
        console.log('✅ Conetado ao Neon com sucesso!');
        // Sincroniza os modelos com as tabelas reais da BD
        return sequelize.sync({ alter: true });
    })
    .then(() => console.log('🔄 Tabelas sincronizadas no Neon.'))
    .catch(err => console.error('❌ Erro crucial de ligação:', err));

//Importar as rotas
app.use('/api', require('./src/routes'));

app.get('/api/teste', (req, res) => {
    res.json({ mensagem: 'API funcionando!', data: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});