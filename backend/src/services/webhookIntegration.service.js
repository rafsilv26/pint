const { ExternalIntegration } = require('../models');

const construirPayload = (platform, { title, message }) => {
  const texto = title ? `*${title}*\n${message || ''}` : (message || '');

  if (String(platform).toLowerCase() === 'teams') {
    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: title || 'Notificação Softinsa Badges',
      themeColor: '0076D7',
      title: title || 'Notificação Softinsa Badges',
      text: message || ''
    };
  }

  return { text: texto };
};

const enviarParaWebhook = async (webhookUrl, payload) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resposta = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!resposta.ok) {
      console.error(`Webhook respondeu ${resposta.status} (${webhookUrl}).`);
    }
  } catch (erro) {
    console.error('Erro ao enviar webhook de integração:', erro.message);
  } finally {
    clearTimeout(timeout);
  }
};

const notificarIntegracoes = async (userId, { title, message }) => {
  if (!userId) return 0;
  try {
    const integracoes = await ExternalIntegration.findAll({
      where: { userId, active: true }
    });
    const comWebhook = integracoes.filter((i) => i.webhookUrl);
    await Promise.all(
      comWebhook.map((i) => enviarParaWebhook(i.webhookUrl, construirPayload(i.platform, { title, message })))
    );
    return comWebhook.length;
  } catch (erro) {
    console.error('Erro ao carregar integrações externas:', erro.message);
    return 0;
  }
};

module.exports = { notificarIntegracoes, construirPayload };
