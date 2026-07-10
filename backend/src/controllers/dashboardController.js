const { Op } = require('sequelize');
const {
  Area,
  Badge,
  Candidatura,
  ConsultorBadge,
  ConsultorBadgePremium,
  Consultant,
  LearningPath,
  Level,
  Notice,
  PolicyRGPD,
  Requirement,
  ServiceLine,
  User
} = require('../models');

const ACTIVE_APPLICATION_STATUSES = [
  'OPEN',
  'SUBMITTED',
  'IN_VALIDATION',
  'VALIDATED',
  'IN_APPROVAL'
];

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const latestDate = (...values) => {
  const dates = values.flat().map(asDate).filter(Boolean);
  if (dates.length === 0) return new Date();
  return new Date(Math.max(...dates.map((date) => date.getTime())));
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 20) return 'Boa tarde,';
  return 'Boa noite,';
};

const getConsultantProfile = async (consultorId) => Consultant.findByPk(consultorId, {
  include: [
    {
      model: Area,
      include: [
        {
          model: ServiceLine,
          include: [LearningPath]
        }
      ]
    }
  ]
});

const getCurrentUserRanking = async (consultorId) => {
  const awards = await ConsultorBadge.findAll({
    where: { valid: true },
    include: [
      { model: Badge },
      { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
    ]
  });

  const scores = new Map();
  awards.forEach((award) => {
    const current = scores.get(award.consultorId) || { points: 0, badges: 0 };
    current.points += Number(award.pointsObtained ?? award.Badge?.ponto ?? 0);
    current.badges += 1;
    scores.set(award.consultorId, current);
  });

  const ranking = [...scores.entries()]
    .map(([id, score]) => ({ id, ...score }))
    .sort((a, b) => b.points - a.points || b.badges - a.badges || a.id - b.id);

  const index = ranking.findIndex((row) => row.id === consultorId);
  return index === -1 ? ranking.length + 1 : index + 1;
};

const getRecommendations = async ({ consultant, acquiredBadgeIds }) => {
  const levelWhere = consultant?.areaId ? { areaId: consultant.areaId } : undefined;

  const badges = await Badge.findAll({
    where: {
      ativo: true,
      id: { [Op.notIn]: acquiredBadgeIds.length ? acquiredBadgeIds : [0] }
    },
    include: [
      {
        model: Level,
        where: levelWhere,
        required: Boolean(levelWhere),
        include: [{ model: Requirement, as: 'requirements', required: false }]
      }
    ],
    order: [['ponto', 'DESC'], ['nome', 'ASC']],
    limit: 4
  });

  return badges.map((badge) => ({
    id: badge.id,
    title: badge.nome,
    description: badge.descricao || 'Recomendado para a sua evolucao profissional.',
    level: badge.Level?.nome || (badge.Level?.ordem ? `Nivel ${badge.Level.ordem}` : ''),
    tag: badge.Level?.ordem ? `Nivel ${badge.Level.ordem}` : '',
    points: Number(badge.ponto || 0),
    duration: badge.duracaoMeses ? `${badge.duracaoMeses} meses` : '',
    prerequisites: (badge.Level?.requirements || []).map((requirement) => requirement.titulo),
    iconName: badge.tipo || badge.fornecedor || 'badge'
  }));
};

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user.data;
    const consultorId = req.user.id;
    const consultant = await getConsultantProfile(consultorId);

    const [awards, activeApplications, notice, premiumAwards] = await Promise.all([
      ConsultorBadge.findAll({
        where: { consultorId, valid: true },
        include: [{ model: Badge }],
        order: [['obtainedDate', 'DESC']]
      }),
      Candidatura.findAll({
        where: { consultorId },
        include: [{ association: 'status' }]
      }),
      Notice.findOne({
        where: { userId: consultorId },
        order: [['createdAt', 'DESC']]
      }),
      ConsultorBadgePremium.findAll({ where: { consultorId } }).catch(() => [])
    ]);

    const totalPoints = awards.reduce(
      (sum, award) => sum + Number(award.pointsObtained ?? award.Badge?.ponto ?? 0),
      0
    );
    const acquiredBadgeIds = awards.map((award) => award.badgeId);
    const applicationsInProgress = activeApplications.filter((application) =>
      ACTIVE_APPLICATION_STATUSES.includes(application.status?.code)
    );
    const learningPath = consultant?.Area?.ServiceLine?.LearningPath;
    const totalPathBadges = await Badge.count({
      include: [
        {
          model: Level,
          required: true,
          where: consultant?.areaId ? { areaId: consultant.areaId } : undefined
        }
      ],
      where: { ativo: true }
    }).catch(() => 0);

    const updatedAt = latestDate(
      user.updatedAt,
      consultant?.updatedAt,
      awards.map((award) => award.updatedAt || award.createdAt || award.obtainedDate),
      activeApplications.map((application) => application.updatedAt || application.createdAt),
      notice?.createdAt
    );

    const since = asDate(req.query.data_hora);
    if (since && updatedAt <= since) {
      return res.status(204).send();
    }

    const recommendations = await getRecommendations({ consultant, acquiredBadgeIds });
    const ranking = await getCurrentUserRanking(consultorId);

    res.json({
      ultimaAtualizacao: updatedAt.toISOString(),
      data: {
        userName: user.nome,
        greeting: getGreeting(),
        totalPoints,
        learningPathTitle: learningPath ? `Learning Path: ${learningPath.nome}` : 'Learning Path',
        learningPathProgress: totalPathBadges > 0 ? Math.min(1, awards.length / totalPathBadges) : 0,
        noticeTitle: notice?.title || '',
        noticeMessage: notice?.message || '',
        specialAchievementTitle: 'Conquistas especiais',
        specialAchievementMessage: `${premiumAwards.length} conquistas desbloqueadas!`,
        recommendations,
        badgesWon: awards.length,
        inProgress: applicationsInProgress.length,
        ranking
      }
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar dashboard.', details: error.message });
  }
};

// Atividade recente agregada de várias entidades, para o painel de controlo do Admin.
// Junta as criações mais recentes de utilizadores, badges, candidaturas, badges
// atribuídos, avisos e políticas RGPD, ordenadas da mais recente para a mais antiga.
exports.getAtividadeAdmin = async (req, res) => {
  try {
    const porTipo = Number(req.query.limitePorTipo) || 5;
    const limiteTotal = Number(req.query.limite) || 12;

    const [users, badges, candidaturas, badgesAtribuidos, notices, policies] = await Promise.all([
      User.findAll({
        where: { ativo: true },
        order: [['createdAt', 'DESC']],
        limit: porTipo,
        attributes: ['id', 'nome', 'createdAt']
      }),
      Badge.findAll({
        where: { deletedAt: null },
        order: [['createdAt', 'DESC']],
        limit: porTipo,
        attributes: ['id', 'nome', 'createdAt']
      }),
      Candidatura.findAll({
        order: [['dataSubmicao', 'DESC']],
        limit: porTipo,
        include: [
          { model: Consultant, include: [{ model: User, attributes: ['nome'] }] },
          { model: Badge, attributes: ['nome'] }
        ]
      }),
      ConsultorBadge.findAll({
        order: [['obtainedDate', 'DESC']],
        limit: porTipo,
        include: [
          { model: Consultant, include: [{ model: User, attributes: ['nome'] }] },
          { model: Badge, attributes: ['nome'] }
        ]
      }),
      Notice.findAll({
        order: [['createdAt', 'DESC']],
        limit: porTipo,
        attributes: ['noticeId', 'title', 'createdAt']
      }).catch(() => []),
      PolicyRGPD.findAll({
        order: [['createdAt', 'DESC']],
        limit: porTipo,
        attributes: ['policyId', 'title', 'createdAt']
      }).catch(() => [])
    ]);

    const items = [];

    users.forEach((u) => items.push({
      tipo: 'user',
      nome: u.nome,
      texto: 'Nova conta criada',
      data: u.createdAt
    }));

    badges.forEach((b) => items.push({
      tipo: 'badge',
      nome: b.nome,
      texto: 'Novo badge criado',
      data: b.createdAt
    }));

    candidaturas.forEach((c) => items.push({
      tipo: 'candidatura',
      nome: c.Consultant?.User?.nome || 'Consultor',
      texto: `Submeteu candidatura para ${c.Badge?.nome || 'um badge'}`,
      data: c.dataSubmicao || c.createdAt
    }));

    badgesAtribuidos.forEach((cb) => items.push({
      tipo: 'badge-atribuido',
      nome: cb.Consultant?.User?.nome || 'Consultor',
      texto: `Conquistou o badge ${cb.Badge?.nome || ''}`.trim(),
      data: cb.obtainedDate || cb.createdAt
    }));

    notices.forEach((n) => items.push({
      tipo: 'aviso',
      nome: n.title,
      texto: 'Novo aviso publicado',
      data: n.createdAt
    }));

    policies.forEach((p) => items.push({
      tipo: 'politica',
      nome: p.title,
      texto: 'Nova política RGPD criada',
      data: p.createdAt
    }));

    items.sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json(items.slice(0, limiteTotal));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar atividade recente.', details: error.message });
  }
};
