const {
  Administrator,
  Consultant,
  TalentManager,
  ServiceLineLeader
} = require('../models');

// Estrutura de dados para mapear os perfis aos seus modelos e chaves correspondentes.
// A ORDEM define a prioridade do perfil primário (roles[0]): um utilizador
// com vários perfis entra sempre pelo mais privilegiado. Consultor fica em
// último — caso contrário um TM/SLL que também tenha perfil de consultor era
// tratado como consultor e caía no painel errado.
const ROLE_MODELS = {
  Admin: { model: Administrator, key: 'adminId' },
  ServiceLineLeader: { model: ServiceLineLeader, key: 'sslId' },
  TalentManager: { model: TalentManager, key: 'tmId' },
  Consultor: { model: Consultant, key: 'consultorId' }
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
const applyUserRoles = async (userId, roles = [], options = {}, transaction) => {
  const normalizedRoles = normalizeRoles(roles);

  // O ServiceLineLeader exige sempre uma service line (coluna NOT NULL na
  // BD) — sem esta validação, o findOrCreate mais abaixo rebenta com um
  // erro de constraint da BD, o utilizador já ficou criado sem perfil
  // nenhum, e o erro que chega ao admin é confuso. Falhar cedo e a avisar
  // claramente evita esse estado inconsistente.
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
