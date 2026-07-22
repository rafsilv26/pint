const {
  Area,
  Badge,
  ConsultorBadge,
  ConsultorBadgePremium,
  BadgePremium,
  Consultant,
  ServiceLine,
  User
} = require('../models');
const { getServiceLineScopeForUser } = require('../services/serviceLineScope.service');
const { criarNotificacao } = require('../services/notification.service');

const buildConsultantInclude = (serviceLineId) => [
  { model: User, attributes: { exclude: ['password'] } },
  {
    model: Area,
    required: Boolean(serviceLineId),
    where: serviceLineId ? { serviceLineId } : undefined,
    include: [ServiceLine]
  },
  { model: ConsultorBadge, as: 'acquiredBadges', include: [Badge] },
  { model: ConsultorBadgePremium, as: 'premiumBadges', include: [BadgePremium] }
];

const score = (consultant) => (consultant.acquiredBadges || []).reduce(
  (sum, award) => sum + Number(award.pointsObtained ?? award.Badge?.ponto ?? 0),
  0
);

const serialize = (consultant, rank, currentUserId) => ({
  id: consultant.consultorId,
  name: consultant.User?.nome || '',
  role: 'Consultor',
  area: consultant.Area?.nome || '',
  areaId: consultant.areaId || null,
  serviceLine: consultant.Area?.ServiceLine?.nome || '',
  serviceLineId: consultant.Area?.serviceLineId || null,
  location: '',
  email: consultant.User?.email || '',
  startDate: consultant.createdAt
    ? new Date(consultant.createdAt).toLocaleDateString('pt-PT', { month: '2-digit', year: 'numeric' })
    : '',
  points: score(consultant),
  badges: (consultant.acquiredBadges || []).length,
  specials: (consultant.premiumBadges || []).length,
  rank,
  imagePath: consultant.User?.fotoPerfil || '',
  biography: consultant.biography,
  linkedinUrl: consultant.linkedinUrl,
  isCurrentUser: consultant.consultorId === currentUserId,
  badgesConquistados: (consultant.acquiredBadges || [])
    .slice()
    .sort((a, b) => new Date(b.obtainedDate || b.createdAt) - new Date(a.obtainedDate || a.createdAt))
    .map((award) => ({
      id: award.Badge?.id ?? award.badgeId,
      nome: award.Badge?.nome || '',
      nivelId: award.Badge?.nivelId ?? null,
      pontos: Number(award.pointsObtained ?? award.Badge?.ponto ?? 0),
      fornecedor: award.Badge?.fornecedor || '',
      obtidoEm: award.obtainedDate,
      expiraEm: award.expirationDate,
      valido: award.valid !== false,
      publicToken: award.publicToken || '',
      expirationDate: award.expirationDate
    })),
  specialAchievements: (consultant.premiumBadges || [])
    .slice()
    .sort((a, b) => new Date(b.achievementDate || 0) - new Date(a.achievementDate || 0))
    .map((award) => ({
      badgePremiumId: award.badgePremiumId,
      name: award.BadgePremium?.name || '',
      description: award.BadgePremium?.description || '',
      criteriaDescription: award.BadgePremium?.criteriaDescription || '',
      icon: award.BadgePremium?.icon || '',
      achievementDate: award.achievementDate
    }))
});

const loadRankedConsultants = async (serviceLineId) => {
  const consultants = await Consultant.findAll({ include: buildConsultantInclude(serviceLineId) });
  return consultants.sort((a, b) =>
    score(b) - score(a) ||
    (b.acquiredBadges || []).length - (a.acquiredBadges || []).length ||
    (a.User?.nome || '').localeCompare(b.User?.nome || '')
  );
};

exports.listConsultants = async (req, res) => {
  try {
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    const ranked = await loadRankedConsultants(serviceLineId);
    const query = (req.query.q || '').toString().trim().toLowerCase();
    const filtered = query
      ? ranked.filter((consultant) => [
        consultant.User?.nome,
        consultant.User?.email,
        consultant.Area?.nome,
        consultant.Area?.ServiceLine?.nome
      ].filter(Boolean).join(' ').toLowerCase().includes(query))
      : ranked;

    const data = filtered.map((consultant) =>
      serialize(consultant, ranked.findIndex((row) => row.consultorId === consultant.consultorId) + 1, req.user.id)
    );

    res.json({
      total: data.length,
      stats: {
        consultants: ranked.length,
        badgesTotal: ranked.reduce((sum, consultant) => sum + (consultant.acquiredBadges || []).length, 0),
        specialsTotal: ranked.reduce((sum, consultant) => sum + (consultant.premiumBadges || []).length, 0)
      },
      data
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao listar consultores.' : error.message });
  }
};

exports.getConsultant = async (req, res) => {
  try {
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    const ranked = await loadRankedConsultants(serviceLineId);
    const consultant = ranked.find((row) => row.consultorId === Number(req.params.id));
    if (!consultant) {
      return res.status(404).json({ erro: 'Consultor nao encontrado.' });
    }

    res.json(serialize(
      consultant,
      ranked.findIndex((row) => row.consultorId === consultant.consultorId) + 1,
      req.user.id
    ));
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao obter consultor.' : error.message });
  }
};

exports.updateConsultant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, biography, linkedinUrl } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: 'Identificador de consultor inválido.' });
    }

    if (req.user.id !== id) {
      return res.status(403).json({ erro: 'Não tens permissão para editar este perfil' });
    }

    if (!String(name || '').trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    await User.update(
      { nome: String(name).trim() },
      { where: { id } }
    );

    const [consultor, criado] = await Consultant.findOrCreate({
      where: { consultorId: id },
      defaults: { biography: String(biography || '').trim(), linkedinUrl: String(linkedinUrl || '').trim() }
    });

    if (!criado) {
      await consultor.update({
        biography: String(biography || '').trim(),
        linkedinUrl: String(linkedinUrl || '').trim()
      });
    }

    res.json({ mensagem: 'Perfil atualizado com sucesso!' });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
};

const assertConsultorNoScope = async (user, consultorId) => {
  const serviceLineId = await getServiceLineScopeForUser(user);
  const ranked = await loadRankedConsultants(serviceLineId);
  const consultor = ranked.find((row) => row.consultorId === Number(consultorId));
  if (!consultor) {
    const error = new Error('Consultor não encontrado ou fora da tua Service Line.');
    error.statusCode = 404;
    throw error;
  }
  return consultor;
};

exports.atribuirBadgePremium = async (req, res) => {
  try {
    const consultorId = Number(req.params.id);
    const badgePremiumId = Number(req.body.badgePremiumId);
    if (!Number.isInteger(badgePremiumId) || badgePremiumId <= 0) {
      return res.status(400).json({ erro: 'badgePremiumId inválido.' });
    }

    await assertConsultorNoScope(req.user, consultorId);

    const badge = await BadgePremium.findByPk(badgePremiumId);
    if (!badge || badge.active === false || badge.deletedAt) {
      return res.status(404).json({ erro: 'Badge especial não encontrado.' });
    }

    const [award, criado] = await ConsultorBadgePremium.findOrCreate({
      where: { consultorId, badgePremiumId },
      defaults: { achievementDate: new Date() }
    });
    if (!criado) {
      return res.status(409).json({ erro: 'Este consultor já tem este badge especial.' });
    }

    await criarNotificacao({
      userId: consultorId,
      title: 'Nova conquista especial!',
      message: `Recebeste o badge especial "${badge.name}".`,
      type: 'success'
    }).catch(() => null);

    res.status(201).json({
      badgePremiumId: award.badgePremiumId,
      name: badge.name,
      description: badge.description || '',
      criteriaDescription: badge.criteriaDescription || '',
      achievementDate: award.achievementDate
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao atribuir badge especial.' : error.message });
  }
};

exports.revogarBadgePremium = async (req, res) => {
  try {
    const consultorId = Number(req.params.id);
    const badgePremiumId = Number(req.params.badgePremiumId);

    await assertConsultorNoScope(req.user, consultorId);

    const removidos = await ConsultorBadgePremium.destroy({ where: { consultorId, badgePremiumId } });
    if (!removidos) {
      return res.status(404).json({ erro: 'Atribuição não encontrada.' });
    }

    res.json({ mensagem: 'Badge especial removido.' });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao remover badge especial.' : error.message });
  }
};
