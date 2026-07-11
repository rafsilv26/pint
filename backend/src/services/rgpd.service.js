const { Op } = require('sequelize');
const PolicyRGPD = require('../models/PolicyRGPD');
const PolicyRGPDAcceptance = require('../models/PolicyRGPDAcceptance');

// Devolve as políticas RGPD ativas + obrigatórias + em vigor que o consultor
// indicado (consultorId = User.id) ainda não aceitou. Usada no login/me para
// forçar a aceitação antes de deixar entrar na plataforma.
async function getPendingPolicies(consultorId) {
  const now = new Date();

  const politicasObrigatorias = await PolicyRGPD.findAll({
    where: {
      active: true,
      mandatory: true,
      effectiveDate: { [Op.lte]: now },
      [Op.or]: [
        { expirationDate: null },
        { expirationDate: { [Op.gt]: now } },
      ],
    },
    order: [['effectiveDate', 'ASC']],
  });

  if (!politicasObrigatorias.length) return [];

  const aceitacoes = await PolicyRGPDAcceptance.findAll({
    where: {
      consultorId,
      policyId: { [Op.in]: politicasObrigatorias.map((p) => p.policyId) },
    },
  });
  const idsAceites = new Set(aceitacoes.map((a) => a.policyId));

  return politicasObrigatorias.filter((p) => !idsAceites.has(p.policyId));
}

module.exports = { getPendingPolicies };
