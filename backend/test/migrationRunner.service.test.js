const test = require('node:test');
const assert = require('node:assert/strict');

const { runMigrations } = require('../src/services/migrationRunner.service');

const createSequelize = ({ applied = [], failUp = false } = {}) => {
  const events = [];
  const transaction = {
    commit: async () => events.push('commit'),
    rollback: async () => events.push('rollback')
  };
  const sequelize = {
    getQueryInterface: () => ({ name: 'query-interface' }),
    transaction: async () => transaction,
    query: async (sql, options = {}) => {
      if (sql.includes('SELECT "name"')) return [applied.map((name) => ({ name })), null];
      if (sql.includes('INSERT INTO')) events.push(`insert:${options.replacements.name}`);
      return [[], null];
    }
  };
  const migrations = [{
    name: '001_test',
    up: async () => {
      events.push('up:001_test');
      if (failUp) throw new Error('migration failed');
    }
  }];
  return { events, migrations, sequelize };
};

test('executa e regista migrations pendentes na mesma transação', async () => {
  const { events, migrations, sequelize } = createSequelize();
  assert.deepEqual(await runMigrations(sequelize, migrations), ['001_test']);
  assert.deepEqual(events, ['up:001_test', 'insert:001_test', 'commit']);
});

test('não repete migrations e faz rollback quando uma migration falha', async () => {
  const alreadyApplied = createSequelize({ applied: ['001_test'] });
  assert.deepEqual(await runMigrations(alreadyApplied.sequelize, alreadyApplied.migrations), []);
  assert.deepEqual(alreadyApplied.events, []);

  const failing = createSequelize({ failUp: true });
  await assert.rejects(runMigrations(failing.sequelize, failing.migrations), /migration failed/);
  assert.deepEqual(failing.events, ['up:001_test', 'rollback']);
});

test('preserva o erro original quando o rollback também perde a ligação', async () => {
  const erroOriginal = new Error('lock timeout');
  const sequelize = {
    getQueryInterface: () => ({}),
    transaction: async () => ({
      commit: async () => {},
      rollback: async () => { throw new Error('connection is not queryable'); }
    }),
    query: async (sql) => {
      if (sql.includes('SELECT "name"')) return [[], null];
      return [[], null];
    }
  };
  const migrations = [{
    name: '001_lock',
    up: async () => { throw erroOriginal; }
  }];

  await assert.rejects(
    runMigrations(sequelize, migrations),
    (error) => error === erroOriginal
      && error.rollbackError?.message === 'connection is not queryable'
  );
});
