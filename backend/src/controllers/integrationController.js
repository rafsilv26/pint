const { ExternalIntegration } = require('../models');
const {
  assertSupportedPlatform,
  encryptWebhookUrl,
  getIntegrationWebhookUrl,
  maskWebhookUrl,
  normalizePlatform,
  validateWebhookUrl
} = require('../services/integrationSecurity.service');
const { construirPayload, enviarParaWebhook } = require('../services/webhookIntegration.service');

const serializeIntegration = (integration) => {
  let webhookUrl = null;
  try {
    webhookUrl = getIntegrationWebhookUrl(integration);
  } catch {
    webhookUrl = null;
  }

  return {
    id: integration.integrationId,
    platform: normalizePlatform(integration.platform),
    label: integration.externalUserId || '',
    active: integration.active !== false,
    configured: Boolean(webhookUrl),
    webhookMasked: webhookUrl ? maskWebhookUrl(webhookUrl) : null,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt
  };
};

const findOwned = (userId, integrationId) => ExternalIntegration.findOne({
  where: { integrationId, userId }
});

exports.listMyIntegrations = async (req, res) => {
  try {
    const rows = await ExternalIntegration.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    });
    res.json(rows
      .filter((row) => ['slack', 'teams'].includes(normalizePlatform(row.platform)))
      .map(serializeIntegration));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar integrações.' });
  }
};

exports.saveMyIntegration = async (req, res) => {
  try {
    const body = req.body || {};
    const platform = assertSupportedPlatform(body.platform);
    const rows = await ExternalIntegration.findAll({ where: { userId: req.user.id } });
    const existing = rows.find((row) => normalizePlatform(row.platform) === platform);
    const rawWebhookUrl = String(body.webhookUrl || '').trim();

    if (!existing && !rawWebhookUrl) {
      return res.status(400).json({ erro: 'Indica o URL do webhook.' });
    }

    const label = String(body.label || '').trim().slice(0, 500) ||
      (platform === 'slack' ? 'Canal Slack' : 'Canal Microsoft Teams');
    const payload = {
      userId: req.user.id,
      platform,
      externalUserId: label,
      active: typeof body.active === 'boolean'
        ? body.active
        : existing?.active !== false,
      updatedAt: new Date()
    };

    if (rawWebhookUrl) {
      const webhookUrl = validateWebhookUrl(platform, rawWebhookUrl);
      payload.webhookUrl = null;
      payload.accessToken = encryptWebhookUrl(webhookUrl);
    }

    if (existing) {
      await existing.update(payload);
      return res.json(serializeIntegration(existing));
    }

    const created = await ExternalIntegration.create({
      ...payload,
      createdAt: new Date()
    });
    return res.status(201).json(serializeIntegration(created));
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      erro: status >= 500 ? 'Erro ao guardar integração.' : error.message
    });
  }
};

exports.updateMyIntegration = async (req, res) => {
  try {
    const integration = await findOwned(req.user.id, req.params.id);
    if (!integration) return res.status(404).json({ erro: 'Integração não encontrada.' });

    const body = req.body || {};
    const platform = assertSupportedPlatform(integration.platform);
    const payload = { updatedAt: new Date() };
    if (typeof body.active === 'boolean') payload.active = body.active;
    if (body.label !== undefined) {
      payload.externalUserId = String(body.label || '').trim().slice(0, 500) ||
        (platform === 'slack' ? 'Canal Slack' : 'Canal Microsoft Teams');
    }
    if (String(body.webhookUrl || '').trim()) {
      const webhookUrl = validateWebhookUrl(platform, body.webhookUrl);
      payload.webhookUrl = null;
      payload.accessToken = encryptWebhookUrl(webhookUrl);
    }

    await integration.update(payload);
    return res.json(serializeIntegration(integration));
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      erro: status >= 500 ? 'Erro ao atualizar integração.' : error.message
    });
  }
};

exports.testMyIntegration = async (req, res) => {
  try {
    const integration = await findOwned(req.user.id, req.params.id);
    if (!integration) return res.status(404).json({ erro: 'Integração não encontrada.' });

    const platform = assertSupportedPlatform(integration.platform);
    const webhookUrl = getIntegrationWebhookUrl(integration);
    if (!webhookUrl) return res.status(400).json({ erro: 'Esta integração não tem um webhook configurado.' });
    validateWebhookUrl(platform, webhookUrl);

    const result = await enviarParaWebhook(webhookUrl, construirPayload(platform, {
      title: 'Integração configurada',
      message: 'A ligação com a plataforma Softinsa Badges está a funcionar.'
    }));
    if (!result.ok) {
      return res.status(502).json({ erro: 'A plataforma externa não aceitou a mensagem de teste.' });
    }

    return res.json({ mensagem: 'Mensagem de teste enviada com sucesso.' });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      erro: status >= 500 ? 'Erro ao testar integração.' : error.message
    });
  }
};

exports.deleteMyIntegration = async (req, res) => {
  try {
    const integration = await findOwned(req.user.id, req.params.id);
    if (!integration) return res.status(404).json({ erro: 'Integração não encontrada.' });
    await integration.destroy();
    return res.json({ mensagem: 'Integração removida.' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao remover integração.' });
  }
};
