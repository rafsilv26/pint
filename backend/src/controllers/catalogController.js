const { randomUUID } = require('crypto');
const { Op } = require('sequelize');
const models = require('../models');
const { getServiceLineScopeForUser, getBadgeIdsDaServiceLine } = require('../services/serviceLineScope.service');
const { criarNotificacao, notificarTodosConsultores } = require('../services/notification.service');

const RESOURCES = {
  'learning-paths': { model: models.LearningPath },
  'service-lines': { model: models.ServiceLine },
  areas: { model: models.Area },
  levels: { model: models.Level },
  requirements: { model: models.Requirement },
  badges: {
    model: models.Badge,
    beforeCreate: (body) => ({ publicToken: randomUUID(), ...body }),
    listInclude: [{
      model: models.Level,
      attributes: ['id', 'ordem', 'nome', 'areaId'],
      include: [{
        model: models.Area,
        attributes: ['id', 'nome', 'serviceLineId'],
        include: [{ model: models.ServiceLine, attributes: ['id', 'nome'] }]
      }]
    }]
  },
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

const proximaVersao = (versaoAtual) => {
  const partes = String(versaoAtual || '1.0').split('.');
  const major = partes[0] || '1';
  const minor = Number(partes[1] || 0) + 1;
  return `${major}.${minor}`;
};

const buildWhere = (query) => {
  const where = {};
  Object.entries(query).forEach(([key, value]) => {
    if (['limit', 'offset', 'order', 'scope'].includes(key) || value === undefined || value === '') {
      return;
    }
    where[key] = value;
  });
  return where;
};

const RECURSOS_DA_SERVICE_LINE = new Set([
  'learning-paths', 'service-lines', 'areas', 'levels', 'requirements', 'badges'
]);
const RECURSOS_PERMITIDOS_AO_SLL = new Set([
  ...RECURSOS_DA_SERVICE_LINE,
  'badge-statuses',
  'badge-premium',
  'information'
]);

const assertResourceAccess = (req) => {
  const roles = req.user?.roles || [];
  const isRestrictedSll = roles.includes('ServiceLineLeader') && !roles.includes('Admin') && !roles.includes('TalentManager');
  if (isRestrictedSll && !RECURSOS_PERMITIDOS_AO_SLL.has(req.params.resource)) {
    const error = new Error('Este recurso não está disponível para o perfil Service Line Leader.');
    error.statusCode = 403;
    throw error;
  }
};

const restringirCatalogoPorServiceLine = async (req, resource, whereClause) => {
  const serviceLineId = await getServiceLineScopeForUser(req.user);
  if (!serviceLineId || !RECURSOS_DA_SERVICE_LINE.has(resource)) return whereClause;

  if (resource === 'badges' && req.query.scope === 'all') {
    return { ...whereClause, ativo: true };
  }

  if (resource === 'badges') {
    const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
    return { ...whereClause, id: { [Op.in]: badgeIds.length ? badgeIds : [-1] } };
  }
  if (resource === 'service-lines') return { ...whereClause, id: serviceLineId };
  if (resource === 'areas') return { ...whereClause, serviceLineId };

  const areas = await models.Area.findAll({ where: { serviceLineId }, attributes: ['id'] });
  const areaIds = areas.map((row) => row.id);

  if (resource === 'levels') return { ...whereClause, areaId: { [Op.in]: areaIds.length ? areaIds : [-1] } };

  const levels = await models.Level.findAll({ where: { areaId: { [Op.in]: areaIds.length ? areaIds : [-1] } }, attributes: ['id'] });
  const levelIds = levels.map((row) => row.id);

  if (resource === 'requirements') return { ...whereClause, nivelId: { [Op.in]: levelIds.length ? levelIds : [-1] } };

  const serviceLine = await models.ServiceLine.findByPk(serviceLineId, { attributes: ['learningPathId'] });
  return { ...whereClause, id: serviceLine?.learningPathId || -1 };
};

exports.listResources = async (req, res) => {
  try {
    assertResourceAccess(req);
    const config = getConfig(req, res);
    if (!config) return;

    let whereClause = buildWhere(req.query);

    if (config.model.rawAttributes.deletedAt) {
      whereClause.deletedAt = null;
    }

    if (req.user) {
      whereClause = await restringirCatalogoPorServiceLine(req, req.params.resource, whereClause);
    }

    const personalResources = {
      'consultor-badges': 'consultorId',
      'consultor-badge-premium': 'consultorId',
      timeline: 'consultorId',
      'email-signatures': 'consultorId'
    };
    const personalField = personalResources[req.params.resource];
    const isConsultantOnly = req.user?.roles?.includes('Consultor') &&
      !req.user.roles.some((role) => ['Admin', 'TalentManager', 'ServiceLineLeader'].includes(role));
    if (personalField && isConsultantOnly) {
      whereClause[personalField] = req.user.id;
    }

    if (req.params.resource === 'policy-acceptances' && req.user && !req.user.roles.includes('Admin')) {
      whereClause.consultorId = req.user.id;
    }

    const rows = await config.model.findAll({
      where: whereClause,
      include: config.listInclude,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    });

    res.json(rows);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao listar recurso.' : error.message });
  }
};

exports.getResource = async (req, res) => {
  try {
    assertResourceAccess(req);
    const config = getConfig(req, res);
    if (!config) return;

    const isBadge = req.params.resource === 'badges';
    const row = await config.model.findByPk(req.params.id, isBadge ? {
      include: [{
        model: models.Level,
        include: [
          { model: models.Requirement, as: 'requirements', required: false },
          { model: models.Area, include: [{ model: models.ServiceLine, include: [models.LearningPath] }] }
        ]
      }]
    } : undefined);
    if (!row) {
      return res.status(404).json({ erro: 'Registo não encontrado.' });
    }

    if (req.user && RECURSOS_DA_SERVICE_LINE.has(req.params.resource) && !isBadge) {
      const scopedWhere = await restringirCatalogoPorServiceLine(req, req.params.resource, {});
      const primaryKey = config.model.primaryKeyAttribute;
      const allowed = await config.model.findAll({ where: scopedWhere, attributes: [primaryKey] });
      if (!allowed.some((item) => String(item.get(primaryKey)) === String(row.get(primaryKey)))) {
        return res.status(404).json({ erro: 'Registo não encontrado.' });
      }
    }

    res.json(row);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao obter recurso.' : error.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    let payload = config.beforeCreate ? config.beforeCreate(req.body) : req.body;

    if (req.params.resource === 'policies') {
      payload.version = payload.version || '1.0';
      payload.effectiveDate = payload.effectiveDate || new Date();
      payload.createdBy = req.user?.id || 1;
    }
    if (req.params.resource === 'notices') {
      const tipo = payload.type || 'info';
      const alvo = payload.userId;

      if (!payload.title) {
        return res.status(400).json({ erro: 'O aviso precisa de um título.' });
      }

      if (!alvo || alvo === '__ALL__') {
        const criadas = await notificarTodosConsultores({
          title: payload.title,
          message: payload.message,
          type: tipo
        });
        return res.status(201).json({
          mensagem: `Aviso enviado a ${criadas.length} consultor(es).`,
          count: criadas.length
        });
      }

      const nova = await criarNotificacao({
        userId: alvo,
        title: payload.title,
        message: payload.message,
        type: tipo
      });
      return res.status(201).json(nova);
    }
    if (req.params.resource === 'information') {
      payload.createdBy = req.user?.id || 1;
    }
    if (req.params.resource === 'badge-premium') {
      payload.createdBy = req.user?.id || 1;
    }

    const row = await config.model.create(payload);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar recurso.' });
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

    let payload = { ...req.body };

    if (req.params.resource === 'notices') {
        if (payload.userId === '__ALL__') payload.userId = row.userId;
        payload.userId = payload.userId || row.userId;
        payload.type = payload.type || row.type || 'info';

        delete payload.createdAt;
    }

    if (req.params.resource === 'policies') {
      const conteudoMudou =
        (payload.title !== undefined && payload.title !== row.title) ||
        (payload.description !== undefined && payload.description !== row.description);
      if (conteudoMudou && (!payload.version || payload.version === row.version)) {
        payload.version = proximaVersao(row.version);
      }
      if (!payload.effectiveDate) {
        payload.effectiveDate = row.effectiveDate || new Date();
      }
      await models.PolicyRGPDAcceptance.destroy({ where: { policyId: row.policyId } });
    }

    await row.update({ ...payload, updatedAt: new Date() });

    res.json(row);
  } catch (error) {
    console.error("ERRO NO UPDATE:", error);
    res.status(500).json({ erro: 'Erro ao atualizar.' });
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
    res.status(500).json({ erro: 'Erro ao remover recurso.' });
  }
};

exports.RESOURCES = RESOURCES;
