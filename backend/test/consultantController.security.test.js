const test = require('node:test');
const assert = require('node:assert/strict');

let userUpdated = false;
const models = {
  Area: {}, Badge: {}, ConsultorBadge: {}, ConsultorBadgePremium: {}, BadgePremium: {}, ServiceLine: {},
  Consultant: {
    findOrCreate: async () => { throw new Error('não deve ser chamado'); }
  },
  User: {
    update: async () => { userUpdated = true; }
  }
};

const modelsPath = require.resolve('../src/models');
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: models };
const scopePath = require.resolve('../src/services/serviceLineScope.service');
require.cache[scopePath] = {
  id: scopePath,
  filename: scopePath,
  loaded: true,
  exports: { getServiceLineScopeForUser: async () => null }
};

const controller = require('../src/controllers/consultantController');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('um consultor não consegue alterar o perfil de outro manipulando o ID', async () => {
  userUpdated = false;
  const res = response();
  await controller.updateConsultant(
    { user: { id: 10 }, params: { id: '11' }, body: { name: 'Outro utilizador' } },
    res
  );

  assert.equal(res.statusCode, 403);
  assert.equal(userUpdated, false);
});
