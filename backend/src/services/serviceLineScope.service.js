const { ServiceLineLeader, Badge, Level, Area } = require('../models');
const { resolveServiceLineScopeForUser } = require('./serviceLineScope.logic');

// De acordo com o guião: "O Service Line Leader tem acesso a todos os Badges
// de todas as áreas da sua Service Line. Contudo, não tem acesso às áreas de
// outras Service Lines." O Talent Manager e o Admin, pelo contrário, "vê[em]
// todas as submissões, independentemente da área, da line".
//
// Devolve o serviceLineId a que o pedido deve ficar restrito, ou `null`
// quando não deve haver nenhuma restrição (Admin/TalentManager, ou um
// utilizador sem perfil de Service Line Leader).
const getServiceLineScopeForUser = (user) => resolveServiceLineScopeForUser(
  user,
  (id) => ServiceLineLeader.findByPk(id)
);

// IDs dos badges cujo nível pertence a uma área da Service Line indicada.
// Usado para restringir candidaturas/relatórios à Service Line de um SLL.
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
