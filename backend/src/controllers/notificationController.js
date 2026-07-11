const { Notice } = require('../models');
const { verificarLigacao, enviarEmail } = require('../services/email.service');

// Diagnóstico do envio de emails em produção (só Admin).
//   GET /api/notifications/email-status         -> valida BREVO_API_KEY/EMAIL_USER + ligação ao Brevo
//   GET /api/notifications/email-status?send=1  -> além disso envia um email de teste ao próprio admin
exports.emailStatus = async (req, res) => {
  const status = {
    brevoApiKeyDefinida: Boolean(process.env.BREVO_API_KEY),
    emailUser: process.env.EMAIL_USER || null,
    ligacao: null,
    envioTeste: null
  };

  try {
    const { modo } = await verificarLigacao();
    status.ligacao = { ok: true, modo };
  } catch (erro) {
    status.ligacao = { ok: false, code: erro.code, erro: erro.message, resposta: erro.response };
    return res.status(500).json(status);
  }

  if (req.query.send === '1') {
    const destino = req.user.data.email;
    try {
      await enviarEmail(
        destino,
        '✅ Teste de email — Plataforma de Badges Softinsa',
        '<p>Se estás a ler isto, o envio de emails do backend está a funcionar. 🎉</p>'
      );
      status.envioTeste = { ok: true, para: destino };
    } catch (erro) {
      status.envioTeste = { ok: false, para: destino, code: erro.code, erro: erro.message };
      return res.status(500).json(status);
    }
  }

  res.json(status);
};

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
