const assert = require('node:assert/strict');
const { test } = require('node:test');

const { resolveServiceLineScopeForUser } = require('../src/services/serviceLineScope.logic');

test('Admin e Talent Manager não são restringidos a uma Service Line', async () => {
  assert.equal(await resolveServiceLineScopeForUser({ id: 1, roles: ['Admin'] }, async () => null), null);
  assert.equal(await resolveServiceLineScopeForUser({ id: 2, roles: ['TalentManager'] }, async () => null), null);
});

test('Service Line Leader recebe o âmbito associado ao seu perfil', async () => {
  const scope = await resolveServiceLineScopeForUser(
    { id: 8, roles: ['ServiceLineLeader'] },
    async (id) => ({ sslId: id, serviceLineId: 4 })
  );
  assert.equal(scope, 4);
});

test('Service Line Leader sem associação falha de forma fechada', async () => {
  await assert.rejects(
    resolveServiceLineScopeForUser(
      { id: 8, roles: ['ServiceLineLeader'] },
      async () => null
    ),
    (error) => error.statusCode === 403 && error.code === 'SERVICE_LINE_SCOPE_MISSING'
  );
});
