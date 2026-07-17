const {
  Administrator,
  Consultant,
  TalentManager,
  ServiceLineLeader
} = require('../models');

const ROLE_MODELS = {
  Admin: { model: Administrator, key: 'adminId' },
  ServiceLineLeader: { model: ServiceLineLeader, key: 'sslId' },
  TalentManager: { model: TalentManager, key: 'tmId' },
  Consultor: { model: Consultant, key: 'consultorId' }
};

const normalizeRoles = (roles) => {
  const values = Array.isArray(roles) ? roles : [roles].filter(Boolean);
  return [...new Set(values)].filter((role) => ROLE_MODELS[role]);
};

const getUserRoles = async (userId) => {
  const checks = await Promise.all(
    Object.entries(ROLE_MODELS).map(async ([role, config]) => {
      const row = await config.model.findByPk(userId);
      return row ? role : null;
    })
  );

  return checks.filter(Boolean);
};

const applyUserRoles = async (userId, roles = [], options = {}, transaction) => {
  const normalizedRoles = normalizeRoles(roles);

  if (normalizedRoles.includes('ServiceLineLeader') && !options.serviceLineId) {
    throw new Error('É obrigatório indicar a Service Line para o perfil Service Line Leader.');
  }

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
          defaults: payload,
          transaction
        });
        return;
      }

      await config.model.destroy({ where: { [config.key]: userId }, transaction });
    })
  );

  return getUserRoles(userId);
};

module.exports = {
  getUserRoles,
  applyUserRoles,
  normalizeRoles
};
