const { ExternalIntegration } = require('../models');
const {
  getIntegrationWebhookUrl,
  normalizePlatform,
  validateWebhookUrl
} = require('./integrationSecurity.service');

// Integração com ferramentas corporativas (Teams / Slack). Quando um consultor
// tem uma integração ativa com um webhook configurado, as notificações da
// plataforma (aprovações, rejeições, SLA, ...) são também empurradas para o
// canal externo. Falha sempre em silêncio: nunca deve partir o fluxo principal.

// Tanto os Incoming Webhooks do Slack como os webhooks atuais do Teams,
// criados pela aplicação Workflows, aceitam uma mensagem simples em `text`.
const construirPayload = (platform, { title, message }) => {
  const isSlack = normalizePlatform(platform) === 'slack';
  const heading = title ? (isSlack ? `*${title}*` : title) : '';
  return { text: [heading, message || ''].filter(Boolean).join('\n') };
};

const enviarParaWebhook = async (webhookUrl, payload, fetchImplementation = globalThis.fetch) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resposta = await fetchImplementation(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!resposta.ok) {
      console.error(`Webhook de integração respondeu HTTP ${resposta.status}.`);
      return { ok: false, status: resposta.status };
    }
    return { ok: true, status: resposta.status };
  } catch (erro) {
    console.error('Erro ao enviar webhook de integração:', erro.message);
    return { ok: false, status: null };
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
    const destinos = integracoes.flatMap((integration) => {
      try {
        const webhookUrl = getIntegrationWebhookUrl(integration);
        if (!webhookUrl) return [];
        return [{
          integration,
          webhookUrl: validateWebhookUrl(integration.platform, webhookUrl)
        }];
      } catch (erro) {
        console.error('Integração externa ignorada por ter uma configuração inválida.');
        return [];
      }
    });
    await Promise.all(destinos.map(({ integration, webhookUrl }) =>
      enviarParaWebhook(webhookUrl, construirPayload(integration.platform, { title, message }))
    ));
    return destinos.length;
  } catch (erro) {
    console.error('Erro ao carregar integrações externas:', erro.message);
    return 0;
  }
};

module.exports = { notificarIntegracoes, construirPayload, enviarParaWebhook };
