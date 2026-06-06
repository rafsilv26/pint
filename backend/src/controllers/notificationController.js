const { Notice } = require('../models');

exports.listNotifications = async (req, res) => {
  try {
    const notices = await Notice.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      unreadCount: notices.filter((notice) => !notice.read).length,
      data: notices
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar notificacoes.', details: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notice = await Notice.findOne({
      where: { noticeId: req.params.id, userId: req.user.id }
    });

    if (!notice) {
      return res.status(404).json({ erro: 'Notificacao nao encontrada.' });
    }

    await notice.update({ read: true, readAt: new Date() });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao marcar notificacao.', details: error.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notice.update(
      { read: true, readAt: new Date() },
      { where: { userId: req.user.id, read: false } }
    );

    res.json({ mensagem: 'Notificacoes marcadas como lidas.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao marcar notificacoes.', details: error.message });
  }
};
