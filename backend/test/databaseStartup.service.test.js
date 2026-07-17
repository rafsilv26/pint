const test = require('node:test');
const assert = require('node:assert/strict');

const {
  prepararBaseDeDados,
  prepararBaseDeDadosComRetry
} = require('../src/services/databaseStartup.service');

test('autentica e executa migrations antes das tarefas de arranque', async () => {
  const chamadas = [];
  const sequelize = {
    authenticate: async () => chamadas.push('authenticate')
  };
  const executarMigrations = async () => chamadas.push('migrations');
  const ensurePublicBadgeTokens = async () => chamadas.push('ensurePublicBadgeTokens');

  await prepararBaseDeDados({
    sequelize,
    executarMigrations,
    tarefasDepoisDasMigrations: [ensurePublicBadgeTokens]
  });

  assert.deepEqual(chamadas, [
    'authenticate',
    'migrations',
    'ensurePublicBadgeTokens'
  ]);
});

test('não executa tarefas posteriores quando uma migration falha', async () => {
  let tarefaExecutada = false;
  const erro = new Error('falha ao criar EMAIL_TEMPLATE');

  await assert.rejects(
    prepararBaseDeDados({
      sequelize: {
        authenticate: async () => {}
      },
      executarMigrations: async () => { throw erro; },
      tarefasDepoisDasMigrations: [async () => { tarefaExecutada = true; }]
    }),
    erro
  );

  assert.equal(tarefaExecutada, false);
});

test('repete a preparação depois de uma falha transitória', async () => {
  let autenticacoes = 0;
  let migrations = 0;
  const esperas = [];

  await prepararBaseDeDadosComRetry({
    sequelize: {
      authenticate: async () => { autenticacoes += 1; }
    },
    executarMigrations: async () => {
      migrations += 1;
      if (migrations === 1) throw new Error('lock timeout');
      return ['002_offline'];
    },
    retryIntervalMs: 25,
    esperar: async (milliseconds) => esperas.push(milliseconds)
  });

  assert.equal(autenticacoes, 2);
  assert.equal(migrations, 2);
  assert.deepEqual(esperas, [25]);
});
