const { Op } = require('sequelize');
const PolicyRGPD = require('../models/PolicyRGPD');
const PolicyRGPDAcceptance = require('../models/PolicyRGPDAcceptance');

// Devolve as políticas RGPD ativas + em vigor que o consultor indicado
// (consultorId = User.id) ainda não aceitou/leu. Inclui as OBRIGATÓRIAS
// (que bloqueiam a entrada até serem aceites) e as NÃO obrigatórias (que não
// exigem aceitação mas têm de ser apresentadas ao utilizador na mesma). O
// cliente distingue as duas pelo campo `mandatory`.
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
    // Obrigatórias primeiro: são as que bloqueiam e devem ser tratadas antes.
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
