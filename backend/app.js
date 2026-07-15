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
const { startPushOutbox } = require('./src/services/pushOutbox.service');
require('./src/models'); // Importa os modelos para garantir que estão registrados no Sequelize

const app = express();

// Middlewares Globais
app.use(cors()); // Permite pedidos do Vite e Flutter
app.use(express.json()); // Permite ler JSON no corpo do pedido (req.body)

// Teste de Ligação à BD
sequelize.authenticate()
    .then(async () => {
        console.log('✅ Conetado ao Neon com sucesso!');
        if (process.env.SKIP_DATABASE_SYNC !== 'true') {
            // Sincroniza os modelos apenas no serviço principal.
            await sequelize.sync({ alter: true });
            await ensurePublicBadgeTokens();
            console.log('🔄 Tabelas sincronizadas no Neon.');
        } else {
            console.log('⏭️ Sincronização de esquema ignorada neste serviço secundário.');
        }
        if (process.env.PUSH_OUTBOX_ENABLED === 'true') {
            startPushOutbox();
        }
    })
    .catch(err => console.error('❌ Erro crucial de ligação:', err));

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
        res.status(500).json({ error: 'Erro na verificação de SLA.', details: erro.message });
    }
});

// Um serviço secundário pode reutilizar a API/BD sem duplicar emails e alertas.
// Os jobs continuam ativos por omissão no serviço principal.
if (process.env.DISABLE_SCHEDULED_JOBS !== 'true') {
    iniciarJobSLA();
    iniciarJobExpiracoes();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
