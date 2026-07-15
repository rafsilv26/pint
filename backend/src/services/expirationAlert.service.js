const { Op } = require('sequelize');
const {
  Badge,
  ConsultorBadge,
  Notice,
  NotificationConfig
} = require('../models');
const { criarNotificacao } = require('./notification.service');

const DEFAULT_DAYS_BEFORE = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

async function createOnce(award, title, message) {
  const existing = await Notice.findOne({
    where: { userId: award.consultorId, title, message }
  });
  if (existing) return false;
  await criarNotificacao({
    userId: award.consultorId,
    title,
    message,
    type: 'warning'
  });
  return true;
}

async function verificarExpiracoes() {
  const now = new Date();
  const config = await NotificationConfig.findOne({ where: { type: 'global' } });
  const daysBefore = Math.max(1, Number(config?.daysBefore) || DEFAULT_DAYS_BEFORE);
  const limit = new Date(now.getTime() + daysBefore * DAY_MS);

  const [expired, expiring] = await Promise.all([
    ConsultorBadge.findAll({
      where: { valid: true, expirationDate: { [Op.lte]: now } },
      include: [{ model: Badge }]
    }),
    ConsultorBadge.findAll({
      where: {
        valid: true,
        expirationDate: { [Op.gt]: now, [Op.lte]: limit }
      },
      include: [{ model: Badge }]
    })
  ]);

  let noticesCreated = 0;
  for (const award of expired) {
    await award.update({ valid: false, updatedAt: now });
    const name = award.Badge?.nome || `Badge #${award.badgeId}`;
    const message = `${name} expirou em ${dateKey(award.expirationDate)}. Consulte as condições de renovação.`;
    if (await createOnce(award, 'Badge expirada', message)) noticesCreated++;
  }

  for (const award of expiring) {
    const name = award.Badge?.nome || `Badge #${award.badgeId}`;
    const message = `${name} expira em ${dateKey(award.expirationDate)}. Prepare a renovação da certificação.`;
    if (await createOnce(award, 'Badge próxima de expirar', message)) noticesCreated++;
  }

  const result = {
    daysBefore,
    expired: expired.length,
    expiring: expiring.length,
    noticesCreated
  };
  console.log('⏳ Verificação de validades:', result);
  return result;
}

function iniciarJobExpiracoes() {
  if (process.env.DISABLE_EXPIRATION_JOB === 'true') return;
  const run = () => verificarExpiracoes().catch((error) =>
    console.error('Erro na verificação de validades:', error.message)
  );
  setTimeout(run, 90 * 1000);
  setInterval(run, 12 * 60 * 60 * 1000);
}

module.exports = { verificarExpiracoes, iniciarJobExpiracoes };
