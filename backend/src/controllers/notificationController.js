const { Notice } = require('../models');
const { verificarLigacao, enviarEmail } = require('../services/email.service');

// Diagnóstico do envio de emails em produção (só Admin).
//   GET /api/notifications/email-status         -> valida config + ligação (Brevo API ou SMTP)
//   GET /api/notifications/email-status?send=1  -> além disso envia um email de teste ao próprio admin
exports.emailStatus = async (req, res) => {
  const status = {
    // Com BREVO_API_KEY o envio é por API HTTPS (obrigatório no Render free,
    // que bloqueia as portas SMTP); sem ela usa SMTP Gmail (só funciona local).
    brevoApiKeyDefinida: Boolean(process.env.BREVO_API_KEY),
    emailUser: process.env.EMAIL_USER || null,
    emailPassDefinida: Boolean(process.env.EMAIL_PASS),
    emailPassComprimento: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    // Uma App Password do Gmail tem 16 caracteres; com espaços colados são 19.
    avisoEspacos: Boolean(process.env.EMAIL_PASS && process.env.EMAIL_PASS.includes(' ')),
    ligacao: null,
    envioTeste: null
  };

  if (!process.env.EMAIL_USER) {
    status.ligacao = { ok: false, erro: 'EMAIL_USER não está definido no ambiente (é o remetente).' };
    return res.status(500).json(status);
  }
  if (!process.env.BREVO_API_KEY && !process.env.EMAIL_PASS) {
    status.ligacao = { ok: false, erro: 'Define BREVO_API_KEY (produção/Render) ou EMAIL_PASS (SMTP local).' };
    return res.status(500).json(status);
  }

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
