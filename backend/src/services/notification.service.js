const { Notice, Consultant } = require('../models');
const { sendPushToUser } = require('./pushNotification.service');

const criarNotificacao = async ({ userId, title, message, type = 'info' }) => {
  if (!userId || !title) return null;
  const notice = await Notice.create({ userId, title, message: message || null, type });
  sendPushToUser(userId, { title, body: message, type }).catch((error) =>
    console.error('Erro ao enviar push:', error.message)
  );
  return notice;
};

const notificarTodosConsultores = async ({ title, message, type = 'info' }) => {
  if (!title) return [];
  const consultores = await Consultant.findAll({ attributes: ['consultorId'] });
  if (consultores.length === 0) return [];
  const linhas = consultores.map((c) => ({
    userId: c.consultorId,
    title,
    message: message || null,
    type
  }));
  const notices = await Notice.bulkCreate(linhas);
  await Promise.allSettled(consultores.map((consultor) =>
    sendPushToUser(consultor.consultorId, { title, body: message, type })
  ));
  return notices;
};

module.exports = { criarNotificacao, notificarTodosConsultores };
