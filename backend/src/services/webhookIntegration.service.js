const { ExternalIntegration } = require('../models');

// Integração com ferramentas corporativas (Teams / Slack). Quando um consultor
// tem uma integração ativa com um webhook configurado, as notificações da
// plataforma (aprovações, rejeições, SLA, ...) são também empurradas para o
// canal externo. Falha sempre em silêncio: nunca deve partir o fluxo principal.

// Slack espera { text }. Teams (Incoming Webhook clássico) espera um
// MessageCard. Detetamos pela plataforma; por defeito assumimos Slack, que é o
// formato mais simples e o mais tolerante.
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

// Envia uma notificação para todas as integrações ativas (com webhook) de um
// utilizador. Não lança — devolve o número de webhooks contactados.
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
