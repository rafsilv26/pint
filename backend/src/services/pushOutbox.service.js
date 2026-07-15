const { Op } = require('sequelize');
const { Notice, User } = require('../models');
const { sendPushToUser } = require('./pushNotification.service');

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_MAX_AGE_DAYS = 7;
let timer;
let processing = false;

const allowedEmails = () => String(process.env.PUSH_ALLOWED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function processPendingPushNotices() {
  if (processing) return { processed: 0, skipped: true };
  processing = true;
  try {
    const emails = allowedEmails();
    if (emails.length === 0) return { processed: 0, skipped: true };

    const users = await User.findAll({
      where: { email: { [Op.in]: emails } },
      attributes: ['id']
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length === 0) return { processed: 0 };

    const maxAgeDays = Number(process.env.PUSH_OUTBOX_MAX_AGE_DAYS) || DEFAULT_MAX_AGE_DAYS;
    const createdAfter = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const notices = await Notice.findAll({
      where: {
        userId: { [Op.in]: userIds },
        pushSent: false,
        createdAt: { [Op.gte]: createdAfter }
      },
      order: [['createdAt', 'ASC']],
      limit: 50
    });

    let processed = 0;
    for (const notice of notices) {
      const result = await sendPushToUser(notice.userId, {
        title: notice.title,
        body: notice.message || '',
        type: notice.type || 'info',
        action: 'fetch_api'
      });
      if (result.sent > 0) {
        await notice.update({ pushSent: true });
        processed += 1;
      }
    }
    if (processed > 0) console.log(`PUSH outbox: ${processed} aviso(s) enviado(s).`);
    return { processed };
  } catch (error) {
    console.error('Erro no PUSH outbox:', error.message);
    return { processed: 0, error: error.message };
  } finally {
    processing = false;
  }
}

function startPushOutbox() {
  if (timer) return timer;
  const interval = Math.max(
    10_000,
    Number(process.env.PUSH_OUTBOX_INTERVAL_MS) || DEFAULT_INTERVAL_MS
  );
  processPendingPushNotices();
  timer = setInterval(processPendingPushNotices, interval);
  console.log(`PUSH outbox ativo (intervalo ${interval}ms).`);
  return timer;
}

module.exports = { processPendingPushNotices, startPushOutbox };
