const {
  Area,
  Badge,
  ConsultorBadge,
  ConsultorBadgePremium,
  Consultant,
  ServiceLine,
  User
} = require('../models');

const consultantInclude = [
  { model: User, attributes: { exclude: ['password'] } },
  { model: Area, include: [ServiceLine] },
  { model: ConsultorBadge, as: 'acquiredBadges', include: [Badge] },
  { model: ConsultorBadgePremium, as: 'premiumBadges' }
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
  serviceLine: consultant.Area?.ServiceLine?.nome || '',
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
  isCurrentUser: consultant.consultorId === currentUserId
});

const loadRankedConsultants = async () => {
  const consultants = await Consultant.findAll({ include: consultantInclude });
  return consultants.sort((a, b) =>
    score(b) - score(a) ||
    (b.acquiredBadges || []).length - (a.acquiredBadges || []).length ||
    (a.User?.nome || '').localeCompare(b.User?.nome || '')
  );
};

exports.listConsultants = async (req, res) => {
  try {
    const ranked = await loadRankedConsultants();
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
    res.status(500).json({ erro: 'Erro ao listar consultores.', details: error.message });
  }
};

exports.getConsultant = async (req, res) => {
  try {
    const ranked = await loadRankedConsultants();
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
    res.status(500).json({ erro: 'Erro ao obter consultor.', details: error.message });
  }
};
