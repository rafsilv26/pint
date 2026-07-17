const { Op } = require('sequelize');
const PolicyRGPD = require('../models/PolicyRGPD');
const PolicyRGPDAcceptance = require('../models/PolicyRGPDAcceptance');

async function getPendingPolicies(consultorId) {
  const now = new Date();

  const politicas = await PolicyRGPD.findAll({
    where: {
      active: true,
      effectiveDate: { [Op.lte]: now },
      [Op.or]: [
        { expirationDate: null },
        { expirationDate: { [Op.gt]: now } },
      ],
    },
    order: [['mandatory', 'DESC'], ['effectiveDate', 'ASC']],
  });

  if (!politicas.length) return [];

  const aceitacoes = await PolicyRGPDAcceptance.findAll({
    where: {
      consultorId,
      policyId: { [Op.in]: politicas.map((p) => p.policyId) },
    },
  });
  const idsAceites = new Set(aceitacoes.map((a) => a.policyId));

  return politicas.filter((p) => !idsAceites.has(p.policyId));
}

module.exports = { getPendingPolicies };
