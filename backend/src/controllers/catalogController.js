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

    let payload = config.beforeCreate ? config.beforeCreate(req.body) : req.body;

    // Garante que campos obrigatórios de políticas não ficam vazios
    if (req.params.resource === 'policies') {
      payload.version = payload.version || '1.0';
      payload.effectiveDate = payload.effectiveDate || new Date();
      payload.createdBy = req.user?.id || 1; // Se não houver user, força 1
    }
    if (req.params.resource === 'notices') {
      payload.userId = req.user?.id || 1; // Atribui o ID do utilizador logado
      payload.type = payload.type || 'info'; // Define um tipo padrão se não for enviado
    }

    const row = await config.model.create(payload);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar recurso.', details: error.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const config = getConfig(req, res);
    if (!config) return;

    // 1. Vai buscar o registo atual à base de dados
    const row = await config.model.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ erro: 'Registo não encontrado.' });
    }

    // 2. Prepara o payload com o que vem do formulário
    let payload = { ...req.body };

    // 3. SE FOR AVISO, GARANTIMOS QUE OS CAMPOS OBRIGATÓRIOS TÊM VALOR
    if (req.params.resource === 'notices') {
        // Se o formulário não enviou o campo, usa o que já existe na BD (row.campo)
        payload.userId = payload.userId || row.userId;
        payload.type = payload.type || row.type || 'info'; 
        
        // Remove campos que não devem ser alterados, se necessário
        delete payload.createdAt;
    }

    // 4. ATUALIZA USANDO O PAYLOAD TRATADO (NÃO O REQ.BODY)
    await row.update({ ...payload, updatedAt: new Date() });
    
    res.json(row);
  } catch (error) {
    // Agora o erro que aparece no navegador vai ser muito mais específico
    const message = error.errors ? error.errors.map(e => `${e.path}: ${e.message}`).join(' | ') : error.message;
    console.error("ERRO NO UPDATE:", error); 
    res.status(500).json({ erro: 'Erro ao atualizar.', details: message });
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