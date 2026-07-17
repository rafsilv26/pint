const dns = require('dns');
// O Render (e muitos outros PaaS) não tem rede de saída IPv6, mas alguns
// serviços externos devolvem registos AAAA (IPv6) no DNS. Sem isto, o Node
// pode tentar primeiro o IPv6 e falhar com "ENETUNREACH" ou ficar preso em
// timeouts. Isto força a preferir sempre IPv4 nas ligações de saída.
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./src/config/database');
const { ensurePublicBadgeTokens } = require('./src/services/publicBadgeToken.service');
require('./src/models'); // Regista todos os modelos no Sequelize.
const { createCorsOptions } = require('./src/config/cors');
const {
    prepararBaseDeDadosComRetry
} = require('./src/services/databaseStartup.service');
const { runMigrations } = require('./src/services/migrationRunner.service');

const app = express();

// Middlewares Globais
app.use(cors(createCorsOptions()));
app.use(express.json()); // Permite ler JSON no corpo do pedido (req.body)

//Importar as rotas
app.use('/api', require('./src/routes'));

app.get('/api/teste', (req, res) => {
    res.json({ mensagem: 'API funcionando!', data: new Date() });
});

// Verificação de SLA acionável por um cron externo (ex.: cron-job.org),
// útil porque o Render free adormece e o job interno pode não correr.
// Protegida por chave: GET /api/sla-check?key=<CRON_SECRET>
const { verificarSLA, iniciarJobSLA } = require('./src/services/sla.service');
const { iniciarJobExpiracoes } = require('./src/services/expirationAlert.service');
app.get('/api/sla-check', async (req, res) => {
    if (!process.env.CRON_SECRET || req.query.key !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Chave inválida.' });
    }
    try {
        res.json(await verificarSLA());
    } catch (erro) {
        console.error('Erro na verificação de SLA:', erro);
        res.status(500).json({ error: 'Erro na verificação de SLA.' });
    }
});

app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = Number(error.statusCode) || 500;
    if (status >= 500) console.error('Erro HTTP não tratado:', error);
    return res.status(status).json({
        error: status >= 500 ? 'Erro interno do servidor.' : error.message
    });
});

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
    const servidor = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor a correr na porta ${PORT}`);
    });

    try {
        await prepararBaseDeDadosComRetry({
            sequelize,
            executarMigrations: runMigrations,
            tarefasDepoisDasMigrations: [ensurePublicBadgeTokens]
        });

        console.log('✅ Conetado ao Neon com sucesso!');
        console.log('🔄 Migrations aplicadas no Neon.');

        // Os jobs também dependem da BD e só devem arrancar depois das migrations.
        iniciarJobSLA();
        iniciarJobExpiracoes();

        return servidor;
    } catch (err) {
        console.error('❌ Erro crucial de ligação:', err);
        return servidor;
    }
};

if (require.main === module) {
    iniciarServidor();
}

module.exports = { app, iniciarServidor };
