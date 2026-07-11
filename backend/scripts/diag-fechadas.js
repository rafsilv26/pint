// Diagnóstico do gráfico "Pedidos Fechados".
// Corre com:  node scripts/diag-fechadas.js   (a partir da pasta /backend)
// Usa o mesmo .env / ligação do backend.
const { Op } = require('sequelize');
const sequelize = require('../src/config/database');
const { BadgeStatus, HistoricoCandidatura } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Ligado à base de dados.\n');

    // 1) Estados de "fechado"
    const statuses = await BadgeStatus.findAll({ where: { code: ['APPROVED', 'REJECTED'] } });
    const idsFechados = statuses.map((s) => s.statusId);
    console.log('Estados APPROVED/REJECTED encontrados:',
      statuses.map((s) => `${s.code}=${s.statusId}`).join(', ') || '(NENHUM!)');
    console.log('IDs de fechado:', idsFechados, '\n');

    // 2) Total de logs de fecho (todas as datas)
    const totalFechados = await HistoricoCandidatura.count({
      where: { estadoNovo: { [Op.in]: idsFechados.length ? idsFechados : [-1] } }
    });
    console.log('Total de logs APPROVED/REJECTED (todas as datas):', totalFechados);

    // 3) Intervalo de datas desses logs
    const [min, max] = await Promise.all([
      HistoricoCandidatura.min('createdAt', { where: { estadoNovo: { [Op.in]: idsFechados.length ? idsFechados : [-1] } } }),
      HistoricoCandidatura.max('createdAt', { where: { estadoNovo: { [Op.in]: idsFechados.length ? idsFechados : [-1] } } })
    ]);
    console.log('Data mais antiga:', min, '| Data mais recente:', max, '\n');

    // 4) Janela dos últimos 7 dias (igual à do endpoint)
    const fim = new Date();
    fim.setHours(0, 0, 0, 0);
    fim.setDate(fim.getDate() + 1);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 7);
    console.log('Janela (últimos 7 dias):', inicio.toISOString(), '->', fim.toISOString());

    const naJanela = await HistoricoCandidatura.count({
      where: {
        estadoNovo: { [Op.in]: idsFechados.length ? idsFechados : [-1] },
        createdAt: { [Op.gte]: inicio, [Op.lt]: fim }
      }
    });
    console.log('>>> Logs de fecho DENTRO dos últimos 7 dias:', naJanela);
    console.log(naJanela === 0
      ? '\n➡️  As barras ficam a zero porque não há fechos nos últimos 7 dias (problema de DADOS, não de código). Aprova/rejeita uma candidatura para veres o gráfico a povoar.'
      : '\n➡️  Há dados na janela — o gráfico deve mostrar barras.');

    await sequelize.close();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
