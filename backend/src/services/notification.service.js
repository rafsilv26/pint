const { Notice, Consultant } = require('../models');
const { sendPushToUser } = require('./pushNotification.service');

// Cria uma notificação/aviso (linha na tabela AVISOS) para um utilizador.
// type: 'info' | 'warning' | 'success' | 'error'
const criarNotificacao = async ({ userId, title, message, type = 'info' }) => {
  if (!userId || !title) return null;
  const notice = await Notice.create({ userId, title, message: message || null, type });
  sendPushToUser(userId, { title, body: message, type }).catch((error) =>
    console.error('Erro ao enviar push:', error.message)
  );
  return notice;
};

// Difunde um aviso a todos os consultores (uma linha por consultor).
// Devolve o array de notices criados (para saber a contagem).
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
