const { ServiceLineLeader, Badge, Level, Area } = require('../models');

// De acordo com o guião: "O Service Line Leader tem acesso a todos os Badges
// de todas as áreas da sua Service Line. Contudo, não tem acesso às áreas de
// outras Service Lines." O Talent Manager e o Admin, pelo contrário, "vê[em]
// todas as submissões, independentemente da área, da line".
//
// Devolve o serviceLineId a que o pedido deve ficar restrito, ou `null`
// quando não deve haver nenhuma restrição (Admin/TalentManager, ou um
// utilizador sem perfil de Service Line Leader).
const getServiceLineScopeForUser = async (user) => {
  const roles = user?.roles || [];
  if (!roles.length) return null;
  if (roles.includes('Admin') || roles.includes('TalentManager')) return null;
  if (!roles.includes('ServiceLineLeader')) return null;

  const ssl = await ServiceLineLeader.findByPk(user.id);
  return ssl?.serviceLineId ?? null;
};

// IDs dos badges cujo nível pertence a uma área da Service Line indicada.
// Usado para restringir candidaturas/relatórios à Service Line de um SLL.
const getBadgeIdsDaServiceLine = async (serviceLineId) => {
  const badges = await Badge.findAll({
    attributes: ['id'],
    include: [{ model: Level, required: true, include: [{ model: Area, required: true, where: { serviceLineId } }] }]
  });
  return badges.map((b) => b.id);
};

module.exports = { getServiceLineScopeForUser, getBadgeIdsDaServiceLine };
