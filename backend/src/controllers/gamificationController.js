const {
  Badge,
  BadgePremium,
  ConsultorBadge,
  ConsultorBadgePremium,
  ConsultorTimeline,
  Consultant,
  User
} = require('../models');

const serializeRanking = (awards, currentUserId) => {
  const rows = new Map();

  awards.forEach((award) => {
    const row = rows.get(award.consultorId) || {
      id: award.consultorId,
      name: award.Consultant?.User?.nome || '',
      points: 0,
      badges: 0,
      currentUser: award.consultorId === currentUserId
    };

    row.points += Number(award.pointsObtained ?? award.Badge?.ponto ?? 0);
    row.badges += 1;
    rows.set(award.consultorId, row);
  });

  return [...rows.values()]
    .sort((a, b) => b.points - a.points || b.badges - a.badges || a.name.localeCompare(b.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

exports.getGamification = async (req, res) => {
  try {
    const [awards, premiumAwards, timeline] = await Promise.all([
      ConsultorBadge.findAll({
        // REMOVIDO o "where: { valid: true }" para contar badges expiradas
        include: [
          Badge,
          { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
        ]
      }),
      ConsultorBadgePremium.findAll({
        where: { consultorId: req.user.id },
        include: [BadgePremium]
      }).catch(() => []),
      ConsultorTimeline.findAll({
        where: { consultorId: req.user.id },
        order: [['startDate', 'DESC']],
        limit: 10
      }).catch(() => [])
    ]);

    const ranking = serializeRanking(awards, req.user.id);
    const current = ranking.find((row) => row.id === req.user.id) || {
      rank: ranking.length + 1,
      points: 0,
      badges: 0
    };

    res.json({
      summary: {
        rank: current.rank,
        points: current.points,
        badges: current.badges
      },
      achievements: premiumAwards.map((award) => ({
        id: award.badgePremiumId,
        title: award.BadgePremium?.name || '',
        description: award.BadgePremium?.description || award.BadgePremium?.criteriaDescription || '',
        icon: award.BadgePremium?.icon || 'star',
        awardedAt: award.achievementDate || award.createdAt
      })),
      ranking,
      timeline
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar gamification.', details: error.message });
  }
};