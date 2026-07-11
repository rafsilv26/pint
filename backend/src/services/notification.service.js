const { Notice, Consultant } = require('../models');

// Cria uma notificação/aviso (linha na tabela AVISOS) para um utilizador.
// type: 'info' | 'warning' | 'success' | 'error'
const criarNotificacao = async ({ userId, title, message, type = 'info' }) => {
  if (!userId || !title) return null;
  return Notice.create({ userId, title, message: message || null, type });
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
  return Notice.bulkCreate(linhas);
};

module.exports = { criarNotificacao, notificarTodosConsultores };
