const test = require('node:test');
const assert = require('node:assert/strict');

const baseline = require('../src/migrations/20260715_000_existing_schema_baseline');

test('aceita a base de dados legada quando as tabelas nucleares existem', async () => {
  await assert.doesNotReject(baseline.up({
    queryInterface: {
      showAllTables: async () => ['UTILIZADOR', 'BADGE', 'CANDIDATURABADGE']
    }
  }));
});

test('impede migrations parciais numa base sem o esquema legado', async () => {
  await assert.rejects(
    baseline.up({ queryInterface: { showAllTables: async () => ['UTILIZADOR'] } }),
    /BADGE, CANDIDATURABADGE/
  );
});
