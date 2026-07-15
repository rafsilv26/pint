const { randomUUID } = require('crypto');
const { Op } = require('sequelize');
const { ConsultorBadge } = require('../models');

async function ensurePublicBadgeTokens() {
  const awards = await ConsultorBadge.findAll({
    where: { publicToken: { [Op.is]: null } }
  });
  await Promise.all(awards.map((award) =>
    award.update({ publicToken: randomUUID(), updatedAt: new Date() })
  ));
  return awards.length;
}

module.exports = { ensurePublicBadgeTokens };
