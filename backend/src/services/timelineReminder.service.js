const { Op } = require('sequelize');
const { ConsultorTimeline, Notice, NotificationConfig } = require('../models');
const { criarNotificacao } = require('./notification.service');

const DEFAULT_DAYS_BEFORE = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

const createOnce = async ({ userId, title, message, type = 'warning' }) => {
  const existing = await Notice.findOne({ where: { userId, title, message } });
  if (existing) return false;
  await criarNotificacao({ userId, title, message, type });
  return true;
};

async function verificarLembretesTimeline(userId = null) {
  const today = startOfToday();
  const config = await NotificationConfig.findOne({ where: { type: 'global' } });
  const daysBefore = Math.max(1, Number(config?.daysBefore) || DEFAULT_DAYS_BEFORE);
  const limit = new Date(today.getTime() + daysBefore * DAY_MS);

  const activeObjectives = {
    deletedAt: null,
    completionDate: null,
    ...(userId ? { consultorId: userId } : {})
  };
  const [overdue, upcoming] = await Promise.all([
    ConsultorTimeline.findAll({
      where: {
        ...activeObjectives,
        expectedDate: { [Op.lt]: today }
      }
    }),
    ConsultorTimeline.findAll({
      where: {
        ...activeObjectives,
        expectedDate: { [Op.gte]: today, [Op.lte]: limit }
      }
    })
  ]);

  let noticesCreated = 0;
  for (const objective of overdue) {
    const dueDate = dateKey(objective.expectedDate);
    if (await createOnce({
      userId: objective.consultorId,
      title: 'Objetivo com prazo ultrapassado',
      message: `O prazo para “${objective.title}” terminou em ${dueDate}. Atualize ou conclua este objetivo.`,
      type: 'warning'
    })) noticesCreated++;
  }

  for (const objective of upcoming) {
    const dueDate = dateKey(objective.expectedDate);
    const days = Math.round((new Date(dueDate).getTime() - today.getTime()) / DAY_MS);
    const when = days === 0 ? 'termina hoje' : `termina dentro de ${days} dia${days === 1 ? '' : 's'}`;
    if (await createOnce({
      userId: objective.consultorId,
      title: 'Lembrete de objetivo',
      message: `“${objective.title}” ${when} (${dueDate}).`,
      type: 'info'
    })) noticesCreated++;
  }

  return {
    daysBefore,
    overdue: overdue.length,
    upcoming: upcoming.length,
    noticesCreated
  };
}

function iniciarJobLembretesTimeline() {
  if (process.env.DISABLE_TIMELINE_REMINDER_JOB === 'true') return;
  const run = () => verificarLembretesTimeline().catch((error) =>
    console.error('Erro na verificação de lembretes da timeline:', error.message)
  );
  setTimeout(run, 75 * 1000);
  setInterval(run, 12 * 60 * 60 * 1000);
}

module.exports = { verificarLembretesTimeline, iniciarJobLembretesTimeline };
