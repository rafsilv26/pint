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

    
const { User, Badge, Candidatura, Evidencia, HistoricoCandidatura } = require('./src/models/index');





// Sincroniza os modelos com a BD (cria as tabelas se não existirem)
sequelize.sync({ alter: true })
  .then(() => console.log('Tabelas sincronizadas com a BD!'))
  .catch(err => console.error('Erro ao sincronizar tabelas:', err));

// Rotas (criar a seguir)
// app.use('/api/auth', require('./src/routes/authRoutes'));
// app.use('/api/users', require('./src/routes/userRoutes'));

app.use('/api/candidaturas', require('./src/routes/candidaturaRoutes'));
app.use('/api/relatorios', require('./src/routes/relatorioRoutes'));
app.use('/badge', require('./src/routes/relatorioRoutes'));

app.get('/api/teste', (req, res) => {
  res.json({ mensagem: 'API funcionando!', data: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});