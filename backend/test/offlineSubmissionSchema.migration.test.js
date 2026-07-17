const test = require('node:test');
const assert = require('node:assert/strict');

const migration = require('../src/migrations/20260717_002_offline_submission_schema');

const createQueryInterface = ({ complete = false } = {}) => {
  const events = [];
  const tables = new Map([
    ['CANDIDATURABADGE', {
      id: {},
      consultorId: {},
      ...(complete ? { clientSubmissionId: {} } : {})
    }],
    ['EVIDENCIA', {
      id: {},
      candidaturaId: {},
      ...(complete ? { clientEvidenceId: {} } : {})
    }]
  ]);
  const indexes = new Map();

  if (complete) {
    tables.set('CANDIDATURA_CLIENT_SUBMISSION', {
      id: {}, consultorId: {}, badgeId: {}, candidaturaId: {},
      clientSubmissionId: {}, responseStatus: {}, responseBody: {}, createdAt: {}
    });
    indexes.set('CANDIDATURABADGE', [{ name: 'candidatura_consultor_client_submission_unique' }]);
    indexes.set('EVIDENCIA', [{ name: 'evidencia_candidatura_client_evidence_unique' }]);
    indexes.set('CANDIDATURA_CLIENT_SUBMISSION', [{ name: 'candidatura_submission_consultor_client_unique' }]);
  }

  const queryInterface = {
    showAllTables: async () => [...tables.keys()],
    describeTable: async (tableName) => {
      if (!tables.has(tableName)) throw new Error('missing table');
      return tables.get(tableName);
    },
    addColumn: async (tableName, columnName) => {
      events.push(`addColumn:${tableName}.${columnName}`);
      tables.get(tableName)[columnName] = {};
    },
    createTable: async (tableName, columns) => {
      events.push(`createTable:${tableName}`);
      tables.set(tableName, Object.fromEntries(Object.keys(columns).map((key) => [key, {}])));
    },
    showIndex: async (tableName) => indexes.get(tableName) || [],
    addIndex: async (tableName, _fields, options) => {
      events.push(`addIndex:${options.name}`);
      indexes.set(tableName, [...(indexes.get(tableName) || []), { name: options.name }]);
    }
  };

  return { events, queryInterface };
};

test('adiciona o esquema necessário para candidaturas offline numa base legada', async () => {
  const { events, queryInterface } = createQueryInterface();

  await migration.up({ queryInterface, transaction: { id: 'tx' } });

  assert.deepEqual(events, [
    'addColumn:CANDIDATURABADGE.clientSubmissionId',
    'addColumn:EVIDENCIA.clientEvidenceId',
    'createTable:CANDIDATURA_CLIENT_SUBMISSION',
    'addIndex:candidatura_consultor_client_submission_unique',
    'addIndex:evidencia_candidatura_client_evidence_unique',
    'addIndex:candidatura_submission_consultor_client_unique'
  ]);
});

test('pode ser executada novamente sem repetir alterações', async () => {
  const { events, queryInterface } = createQueryInterface({ complete: true });

  await migration.up({ queryInterface, transaction: { id: 'tx' } });

  assert.deepEqual(events, []);
});
