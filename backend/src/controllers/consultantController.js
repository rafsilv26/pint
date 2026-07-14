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

// Quando `serviceLineId` é indicado (Service Line Leader), o INNER JOIN em
// Area (required: true) restringe a lista aos consultores dessa Service
// Line — em linha com o guião: o SLL "não tem acesso às áreas de outras
// Service Lines". Sem `serviceLineId` (Admin/TalentManager), mantém-se o
// LEFT JOIN original e vê-se toda a gente.
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
  // Lista detalhada dos badges conquistados (usada na página de perfil do
  // consultor vista pelo TM/SLL/Admin, para além da simples contagem acima).
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
  specialAchievements: (consultant.premiumBadges || []).map((award) => ({
    badgePremiumId: award.badgePremiumId,
    name: award.BadgePremium?.name || '',
    description: award.BadgePremium?.description || '',
    criteriaDescription: award.BadgePremium?.criteriaDescription || '',
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
    res.status(error.statusCode || 500).json({ erro: error.message || 'Erro ao listar consultores.', details: error.message });
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
    res.status(error.statusCode || 500).json({ erro: error.message || 'Erro ao obter consultor.', details: error.message });
  }
};


exports.updateConsultant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, biography, linkedinUrl } = req.body;

    // Verifica se é o próprio utilizador
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ erro: 'Não tens permissão para editar este perfil' });
    }

    // Atualiza o nome na tabela User
    await User.update(
      { nome: name },
      { where: { id } }
    );

    // Atualiza ou cria o registo na tabela Consultant
    const [consultor, criado] = await Consultant.findOrCreate({
      where: { consultorId: id },
      defaults: { biography, linkedinUrl }
    });

    if (!criado) {
      await consultor.update({ biography, linkedinUrl });
    }

    res.json({ mensagem: 'Perfil atualizado com sucesso!' });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
};
