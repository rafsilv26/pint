const { Notice, NotificationConfig } = require('../models');
const { verificarLigacao, enviarEmail } = require('../services/email.service');
const { getPrefs, savePrefs } = require('../services/notificationPrefs.service');
const { notificarTodosConsultores } = require('../services/notification.service');
const { verificarLembretesTimeline } = require('../services/timelineReminder.service');
const {
  registerDeviceToken,
  unregisterDeviceToken,
  getPushStatus
} = require('../services/pushNotification.service');

exports.registerPushToken = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token) return res.status(400).json({ erro: 'O token do dispositivo é obrigatório.' });
    await registerDeviceToken({
      userId: req.user.id,
      token,
      platform: String(req.body.platform || '')
    });
    res.json({ mensagem: 'Dispositivo registado para notificações push.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registar dispositivo.' });
  }
};

exports.unregisterPushToken = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    if (token) await unregisterDeviceToken({ userId: req.user.id, token });
    res.json({ mensagem: 'Dispositivo removido das notificações push.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover dispositivo.' });
  }
};

exports.getMyPushStatus = async (req, res) => {
  try {
    res.json(await getPushStatus(req.user.id));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter estado das notificações push.' });
  }
};

// Difunde um aviso a TODOS os consultores (uma notificação por consultor).
exports.broadcastAviso = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title) return res.status(400).json({ erro: 'O aviso precisa de um título.' });
    const criados = await notificarTodosConsultores({ title, message, type: type || 'info' });
    res.status(201).json({ mensagem: 'Aviso difundido.', total: criados.length });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao difundir aviso.' });
  }
};

// Configuração global de notificações da plataforma (singleton type='global').
// Usada pelas Definições do Admin (req 7 do guião).
const CONFIG_GLOBAL = 'global';

exports.getConfigGlobal = async (_req, res) => {
  try {
    const [cfg] = await NotificationConfig.findOrCreate({
      where: { type: CONFIG_GLOBAL },
      defaults: { type: CONFIG_GLOBAL, emailEnabled: true, pushEnabled: false, daysBefore: 5 }
    });
    res.json({ emailEnabled: cfg.emailEnabled, pushEnabled: cfg.pushEnabled, daysBefore: cfg.daysBefore });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter definições.' });
  }
};

exports.saveConfigGlobal = async (req, res) => {
  try {
    const { emailEnabled, pushEnabled, daysBefore } = req.body;
    const [cfg] = await NotificationConfig.findOrCreate({
      where: { type: CONFIG_GLOBAL },
      defaults: { type: CONFIG_GLOBAL }
    });
    await cfg.update({
      emailEnabled: Boolean(emailEnabled),
      pushEnabled: Boolean(pushEnabled),
      daysBefore: daysBefore != null ? Number(daysBefore) : cfg.daysBefore
    });
    res.json({ mensagem: 'Definições guardadas.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao guardar definições.' });
  }
};
const { verificarSLA } = require('../services/sla.service');

// Preferências de notificação por email do utilizador autenticado.
exports.getMyNotificationPrefs = async (req, res) => {
  try {
    res.json(await getPrefs(req.user.id));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao ler preferências.' });
  }
};

exports.saveMyNotificationPrefs = async (req, res) => {
  try {
    const prefs = await savePrefs(req.user.id, req.body || {});
    res.json({ message: 'Preferências guardadas.', prefs });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao guardar preferências.' });
  }
};

// Corre a verificação de SLA a pedido (só Admin; há também /api/sla-check
// com CRON_SECRET para crons externos).
exports.runSlaCheck = async (req, res) => {
  try {
    res.json(await verificarSLA());
  } catch (error) {
    res.status(500).json({ erro: 'Erro na verificação de SLA.' });
  }
};

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
    console.error('Erro ao verificar a ligação ao serviço de email:', erro);
    status.ligacao = { ok: false };
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
      console.error('Erro ao enviar email de diagnóstico:', erro);
      status.envioTeste = { ok: false, para: destino };
      return res.status(500).json(status);
    }
  }

  res.json(status);
};

exports.listNotifications = async (req, res) => {
  try {
    // Garante que os lembretes ficam disponíveis assim que o utilizador abre
    // o website, mesmo se o alojamento tiver suspendido o job periódico.
    await verificarLembretesTimeline(req.user.id);
    const notices = await Notice.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      unreadCount: notices.filter((notice) => !notice.read).length,
      data: notices
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar notificacoes.' });
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
    res.status(500).json({ erro: 'Erro ao marcar notificacao.' });
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
    res.status(500).json({ erro: 'Erro ao marcar notificacoes.' });
  }
};
