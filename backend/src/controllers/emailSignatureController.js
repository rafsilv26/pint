const { Badge, ConsultorBadge, EmailSignature } = require('../models');

exports.getMyEmailSignature = async (req, res) => {
  try {
    const [awards, signatures] = await Promise.all([
      ConsultorBadge.findAll({
        where: { consultorId: req.user.id, valid: true },
        include: [Badge],
        order: [['obtainedDate', 'DESC']]
      }),
      EmailSignature.findAll({
        where: { consultorId: req.user.id, active: true }
      })
    ]);

    const selectedBadgeIds = signatures.map((signature) => signature.badgeId);

    res.json({
      profile: {
        name: req.user.data.nome,
        email: req.user.data.email,
        role: req.user.primaryRole || 'Consultor',
        website: 'www.softinsa.pt'
      },
      badges: awards.map((award) => ({
        id: award.badgeId,
        title: award.Badge?.nome || '',
        imagePath: award.Badge?.imagem || '',
        publicToken: award.publicToken || '',
        selected: selectedBadgeIds.includes(award.badgeId)
      })),
      templateHtml: signatures[0]?.templateHtml || ''
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter assinatura de email.', details: error.message });
  }
};

exports.saveMyEmailSignature = async (req, res) => {
  try {
    const badgeIds = [...new Set(req.body.badgeIds || [])].slice(0, 4);
    const templateHtml = req.body.templateHtml || null;

    const ownedAwards = await ConsultorBadge.findAll({
      where: { consultorId: req.user.id, valid: true, badgeId: badgeIds }
    });
    const ownedBadgeIds = ownedAwards.map((award) => award.badgeId);

    if (ownedBadgeIds.length !== badgeIds.length) {
      return res.status(400).json({ erro: 'A assinatura so pode incluir badges conquistadas.' });
    }

    await EmailSignature.update(
      { active: false, updatedAt: new Date() },
      { where: { consultorId: req.user.id, active: true } }
    );

    const signatures = await Promise.all(ownedBadgeIds.map((badgeId) =>
      EmailSignature.create({
        consultorId: req.user.id,
        badgeId,
        templateHtml,
        active: true
      })
    ));

    res.json({
      mensagem: 'Assinatura de email guardada com sucesso.',
      data: signatures
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao guardar assinatura de email.', details: error.message });
  }
};
