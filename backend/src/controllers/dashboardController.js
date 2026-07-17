const { Op } = require('sequelize');
const {
  Area,
  Badge,
  BadgePremium,
  Candidatura,
  ConsultorBadge,
  ConsultorBadgePremium,
  Consultant,
  LearningPath,
  Level,
  Notice,
  PolicyRGPD,
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

const normalizarOrdemNivel = (ordem) => String(ordem || '').trim().toLocaleUpperCase();

// Os níveis são guardados como letras (A, B, C, ...), mas esta comparação
// também mantém um comportamento correto caso, no futuro, passem a ser 1, 2,
// 3, ... . Não dependemos da ordem em que a BD devolve os registos.
const compararOrdemNivel = (a, b) => normalizarOrdemNivel(a).localeCompare(
  normalizarOrdemNivel(b),
  'pt-PT',
  { numeric: true }
);

const planoDeProgressao = ({ badges, acquiredBadges, areaId }) => {
  const pertenceAArea = (award) => !areaId || Number(award?.Badge?.Level?.areaId) === Number(areaId);
  const niveisConcluidos = [...new Set(
    acquiredBadges
      .filter(pertenceAArea)
      .map((award) => normalizarOrdemNivel(award.Badge?.Level?.ordem))
      .filter(Boolean)
  )].sort(compararOrdemNivel);
  const niveisDisponiveis = [...new Set(
    badges
      .map((badge) => normalizarOrdemNivel(badge.Level?.ordem))
      .filter(Boolean)
  )].sort(compararOrdemNivel);

  const ultimoNivelConcluido = niveisConcluidos.at(-1) || null;
  const nivelAlvo = ultimoNivelConcluido
    ? niveisDisponiveis.find((nivel) => compararOrdemNivel(nivel, ultimoNivelConcluido) > 0) || null
    : niveisDisponiveis[0] || null;

  return { ultimoNivelConcluido, nivelAlvo };
};

const getRecommendations = async ({ consultant, acquiredBadges, activeBadgeIds }) => {
  const levelWhere = consultant?.areaId ? { areaId: consultant.areaId } : undefined;
  const excludedBadgeIds = [...new Set([
    ...acquiredBadges.map((award) => award.badgeId),
    ...activeBadgeIds
  ])];

  const badges = await Badge.findAll({
    where: {
      ativo: true,
      // Não recomendamos badges já conquistadas nem uma badge cuja
      // candidatura já está a decorrer; seria uma sugestão inútil.
      id: { [Op.notIn]: excludedBadgeIds.length ? excludedBadgeIds : [0] }
    },
    include: [
      {
        model: Level,
        where: levelWhere,
        required: Boolean(levelWhere)
      }
    ],
    order: [['nome', 'ASC']]
  });

  const { ultimoNivelConcluido, nivelAlvo } = planoDeProgressao({
    badges,
    acquiredBadges,
    areaId: consultant?.areaId
  });

  // Se já atingiu o nível mais alto disponível, não voltamos a sugerir níveis
  // inferiores apenas para preencher cartões: não seriam uma progressão real.
  if (ultimoNivelConcluido && !nivelAlvo) return [];

  return badges
    .sort((a, b) => {
      // O nível seguinte é sempre a primeira escolha. Dentro do mesmo nível,
      // badges com mais pontos aparecem primeiro.
      const prioridadeA = normalizarOrdemNivel(a.Level?.ordem) === nivelAlvo ? 0 : 1;
      const prioridadeB = normalizarOrdemNivel(b.Level?.ordem) === nivelAlvo ? 0 : 1;
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
      const porNivel = compararOrdemNivel(a.Level?.ordem, b.Level?.ordem);
      if (porNivel !== 0) return porNivel;
      return Number(b.ponto || 0) - Number(a.ponto || 0) || a.nome.localeCompare(b.nome, 'pt-PT');
    })
    .slice(0, 4)
    .map((badge) => ({
    id: badge.id,
    title: badge.nome,
    description: badge.descricao || 'Recomendado para a sua evolucao profissional.',
    level: badge.Level?.nome || (badge.Level?.ordem ? `Nivel ${badge.Level.ordem}` : ''),
    tag: badge.Level?.ordem ? `Nivel ${badge.Level.ordem}` : '',
    points: Number(badge.ponto || 0),
    duration: badge.duracaoMeses ? `${badge.duracaoMeses} meses` : '',
    reason: ultimoNivelConcluido && nivelAlvo
      ? { code: 'NEXT_LEVEL', previousLevel: ultimoNivelConcluido, targetLevel: nivelAlvo }
      : nivelAlvo
        ? { code: 'START_LEVEL', targetLevel: nivelAlvo }
        : { code: 'AREA_FALLBACK' },
    iconName: badge.tipo || badge.fornecedor || 'badge'
  }));
};

// Progresso do consultor em cada learning path: badges distintos obtidos vs
// total de badges ativos do path (via Level -> Area -> ServiceLine -> LearningPath).
const getLearningPathsProgress = async ({ awards, activeBadgeIds, ownLearningPathId }) => {
  const pathBadges = await Badge.findAll({
    attributes: ['id'],
    where: { ativo: true },
    include: [
      {
        model: Level,
        required: true,
        attributes: ['id'],
        include: [
          {
            model: Area,
            required: true,
            attributes: ['id'],
            include: [
              {
                model: ServiceLine,
                required: true,
                attributes: ['id', 'learningPathId'],
                include: [{ model: LearningPath, required: true, attributes: ['id', 'nome'] }]
              }
            ]
          }
        ]
      }
    ]
  });

  const obtainedIds = new Set(awards.map((award) => Number(award.badgeId)));
  const inProgressIds = new Set(activeBadgeIds.map(Number));

  const byPath = new Map();
  for (const badge of pathBadges) {
    const path = badge.Level?.Area?.ServiceLine?.LearningPath;
    if (!path) continue;
    let entry = byPath.get(path.id);
    if (!entry) {
      entry = { id: path.id, nome: path.nome, total: 0, obtidos: 0, emCurso: 0 };
      byPath.set(path.id, entry);
    }
    entry.total += 1;
    if (obtainedIds.has(Number(badge.id))) entry.obtidos += 1;
    else if (inProgressIds.has(Number(badge.id))) entry.emCurso += 1;
  }

  return [...byPath.values()]
    .filter((entry) => entry.obtidos > 0 || entry.emCurso > 0 || Number(entry.id) === Number(ownLearningPathId))
    .map((entry) => ({
      ...entry,
      progresso: entry.total > 0 ? Math.min(1, entry.obtidos / entry.total) : 0
    }))
    .sort((a, b) => {
      if (Number(a.id) === Number(ownLearningPathId)) return -1;
      if (Number(b.id) === Number(ownLearningPathId)) return 1;
      return b.progresso - a.progresso;
    });
};

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user.data;
    const consultorId = req.user.id;
    const consultant = await getConsultantProfile(consultorId);

    const [awards, activeApplications, notice, premiumAwards] = await Promise.all([
      ConsultorBadge.findAll({
        where: { consultorId, valid: true },
        include: [{ model: Badge, include: [{ model: Level }] }],
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
      ConsultorBadgePremium.findAll({
        where: { consultorId },
        include: [{ model: BadgePremium, required: false }],
        order: [['achievementDate', 'DESC']]
      }).catch(() => [])
    ]);

    const totalPoints = awards.reduce(
      (sum, award) => sum + Number(award.pointsObtained ?? award.Badge?.ponto ?? 0),
      0
    );
    const applicationsInProgress = activeApplications.filter((application) =>
      ACTIVE_APPLICATION_STATUSES.includes(application.status?.code)
    );
    const activeBadgeIds = applicationsInProgress.map((application) => application.badgeId);
    const learningPath = consultant?.Area?.ServiceLine?.LearningPath;
    const learningPaths = await getLearningPathsProgress({
      awards,
      activeBadgeIds,
      ownLearningPathId: learningPath?.id
    }).catch(() => []);
    const ownPath = learningPaths.find((entry) => Number(entry.id) === Number(learningPath?.id));

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

    const recommendations = await getRecommendations({
      consultant,
      acquiredBadges: awards,
      activeBadgeIds
    });
    const ranking = await getCurrentUserRanking(consultorId);

    res.json({
      ultimaAtualizacao: updatedAt.toISOString(),
      data: {
        userName: user.nome,
        greeting: getGreeting(),
        totalPoints,
        learningPathTitle: learningPath ? `Learning Path: ${learningPath.nome}` : 'Learning Path',
        learningPathProgress: ownPath?.progresso ?? 0,
        learningPaths,
        noticeTitle: notice?.title || '',
        noticeMessage: notice?.message || '',
        specialAchievementTitle: 'Conquistas especiais',
        specialAchievementMessage: `${premiumAwards.length} conquistas desbloqueadas!`,
        specialAchievements: premiumAwards.map((award) => ({
          id: award.badgePremiumId,
          name: award.BadgePremium?.name || 'Conquista especial',
          description: award.BadgePremium?.description || '',
          criteria: award.BadgePremium?.criteriaDescription || '',
          date: award.achievementDate || award.createdAt || null
        })),
        areaNome: consultant?.Area?.nome || '',
        recommendations,
        badgesWon: awards.length,
        inProgress: applicationsInProgress.length,
        ranking
      }
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar dashboard.' });
  }
};

// Exportado apenas para testes unitários da regra de progressão, sem chamar a BD.
exports.__private__ = { compararOrdemNivel, planoDeProgressao };

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
    res.status(500).json({ erro: 'Erro ao carregar atividade recente.' });
  }
};
