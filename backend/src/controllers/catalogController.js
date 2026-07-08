const { randomUUID } = require('crypto');
const models = require('../models');

const RESOURCES = {
  'learning-paths': { model: models.LearningPath },
  'service-lines': { model: models.ServiceLine },
  areas: { model: models.Area },
  levels: { model: models.Level },
  requirements: { model: models.Requirement },
  badges: { model: models.Badge, beforeCreate: (body) => ({ publicToken: randomUUID(), ...body }) },
  'badge-statuses': { model: models.BadgeStatus },
  'sla-configs': { model: models.SLAConfig },
  'notification-configs': { model: models.NotificationConfig },
  notices: { model: models.Notice },
  information: { model: models.Information },
  feedback: { model: models.Feedback },
  evidencias: { model: models.Evidencia },
  'consultor-badges': { model: models.ConsultorBadge },
  'badge-premium': { model: models.BadgePremium },
  'consultor-badge-premium': { model: models.ConsultorBadgePremium },
  timeline: { model: models.ConsultorTimeline },
  rankings: { model: models.RankingSnapshot },
  integrations: { model: models.ExternalIntegration },
  'email-signatures': { model: models.EmailSignature },
  policies: { model: models.PolicyRGPD },
  'policy-acceptances': { model: models.PolicyRGPDAcceptance }
};

const getConfig = (req, res) => {
  const config = RESOURCES[req.params.resource];
  if (!config) {
    res.status(404).json({ erro: 'Recurso não suportado.' });
    return null;
  }
  return config;
};

const buildWhere = (query) => {
  const where = {};
  Object.entries(query).forEach(([key, value]) => {
    if (['limit', 'offset', 'order'].includes(key) || value === undefined || value === '') {
      return;
    }
    where[key] = value;
  });
  return where;
};

exports.listResources = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    const whereClause = buildWhere(req.query);

    // CORREÇÃO APLICADA AQUI: 
    // Se a tabela tiver a coluna 'deletedAt', filtra para listar APENAS os não apagados.
    if (config.model.rawAttributes.deletedAt) {
      whereClause.deletedAt = null;
    }

    const rows = await config.model.findAll({
      where: whereClause,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar recurso.', details: error.message });
  }
};

exports.getResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    const row = await config.model.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ erro: 'Registo não encontrado.' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter recurso.', details: error.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    // 1. Preparamos os dados base
    let payload = config.beforeCreate ? config.beforeCreate(req.body) : req.body;

    // 2. Injeção automática de auditoria: 
    // Se o modelo tiver o campo 'createdBy', preenchemos com o ID do user logado
    if (config.model.rawAttributes.createdBy && req.user) {
      payload.createdBy = req.user.id;
    }
    
    // 3. Caso especial para as policies: Mapear 'titulo' para 'title' se necessário
    if (req.params.resource === 'policies' && payload.titulo && !payload.title) {
      payload.title = payload.titulo;
    }

    const row = await config.model.create(payload);
    res.status(201).json(row);
  } catch (error) {
    // Agora o erro vai mostrar exatamente qual campo falta
    res.status(500).json({ erro: 'Erro ao criar recurso.', details: error.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    const row = await config.model.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ erro: 'Registo não encontrado.' });
    }

    await row.update({ ...req.body, updatedAt: new Date() });
    res.json(row);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar recurso.', details: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    const row = await config.model.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ erro: 'Registo não encontrado.' });
    }

    if (row.constructor.rawAttributes.deletedAt) {
      await row.update({ deletedAt: new Date(), ativo: false, active: false });
    } else {
      await row.destroy();
    }

    res.json({ mensagem: 'Registo removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover recurso.', details: error.message });
  }
};

exports.RESOURCES = RESOURCES;