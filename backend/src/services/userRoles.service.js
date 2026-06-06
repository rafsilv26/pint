const {
  Administrator,
  Consultant,
  TalentManager,
  ServiceLineLeader
} = require('../models');

// Estrutura de dados para mapear os perfis aos seus modelos e chaves correspondentes
const ROLE_MODELS = {
  Admin: { model: Administrator, key: 'adminId' },
  Consultor: { model: Consultant, key: 'consultorId' },
  TalentManager: { model: TalentManager, key: 'tmId' },
  ServiceLineLeader: { model: ServiceLineLeader, key: 'sslId' }
};

// Normaliza os perfis, garantindo que são válidos e únicos (ex: 'Admin', ['Admin', 'Consultor'], 'InvalidRole' => ['Admin', 'Consultor'])
const normalizeRoles = (roles) => {
  const values = Array.isArray(roles) ? roles : [roles].filter(Boolean);
  return [...new Set(values)].filter((role) => ROLE_MODELS[role]);
};

// Verifica quais os perfis que o utilizador tem, retornando um array de strings com os nomes dos perfis (ex: ['Admin', 'Consultor'])
const getUserRoles = async (userId) => {
  const checks = await Promise.all(
    Object.entries(ROLE_MODELS).map(async ([role, config]) => {
      const row = await config.model.findByPk(userId);
      return row ? role : null;
    })
  );

  return checks.filter(Boolean);
};

// Aplica os perfis ao utilizador, criando ou eliminando as entradas nas tabelas correspondentes conforme necessário 
// (ex: applyUserRoles(1, ['Admin', 'Consultor'], { areaId: 2 }) => o utilizador 1 passa a ter os perfis Admin e Consultor, e é criada uma entrada na tabela de Consultores com areaId 2)
const applyUserRoles = async (userId, roles = [], options = {}) => {
  const normalizedRoles = normalizeRoles(roles);

  await Promise.all(
    Object.entries(ROLE_MODELS).map(async ([role, config]) => {
      const payload = { [config.key]: userId };

      if (role === 'Consultor' && options.areaId) {
        payload.areaId = options.areaId;
      }

      if (role === 'ServiceLineLeader' && options.serviceLineId) {
        payload.serviceLineId = options.serviceLineId;
      }

      if (normalizedRoles.includes(role)) {
        await config.model.findOrCreate({
          where: { [config.key]: userId },
          defaults: payload
        });
        return;
      }

      await config.model.destroy({ where: { [config.key]: userId } });
    })
  );

  return getUserRoles(userId);
};

module.exports = {
  getUserRoles,
  applyUserRoles,
  normalizeRoles
};
