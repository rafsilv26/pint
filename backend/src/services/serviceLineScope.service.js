const { ServiceLineLeader, Badge, Level, Area } = require('../models');
const { resolveServiceLineScopeForUser } = require('./serviceLineScope.logic');

const getServiceLineScopeForUser = (user) => resolveServiceLineScopeForUser(
  user,
  (id) => ServiceLineLeader.findByPk(id)
);

const getBadgeIdsDaServiceLine = async (serviceLineId) => {
  const badges = await Badge.findAll({
    attributes: ['id'],
    include: [{ model: Level, required: true, include: [{ model: Area, required: true, where: { serviceLineId } }] }]
  });
  return badges.map((b) => b.id);
};

const assertBadgeInServiceLineScope = async (user, badgeId) => {
  const serviceLineId = await getServiceLineScopeForUser(user);
  if (!serviceLineId) return;
  const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
  if (!badgeIds.includes(Number(badgeId))) {
    const error = new Error('Não tens permissão para aceder a dados de outra Service Line.');
    error.statusCode = 403;
    error.code = 'SERVICE_LINE_SCOPE_FORBIDDEN';
    throw error;
  }
};

module.exports = {
  assertBadgeInServiceLineScope,
  getServiceLineScopeForUser,
  getBadgeIdsDaServiceLine
};
