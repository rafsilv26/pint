const { DataTypes } = require('sequelize');

const name = '20260717_002_offline_submission_schema';

const tableNames = async (queryInterface) => new Set(
  (await queryInterface.showAllTables()).map((table) =>
    typeof table === 'string' ? table : table.tableName || table.table_name
  )
);

const describeIfExists = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
};

const addColumnIfMissing = async (
  queryInterface,
  tableName,
  columnName,
  definition,
  transaction
) => {
  const description = await describeIfExists(queryInterface, tableName);
  if (description && !description[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition, { transaction });
  }
};

const removeColumnIfPresent = async (
  queryInterface,
  tableName,
  columnName,
  transaction
) => {
  const description = await describeIfExists(queryInterface, tableName);
  if (description?.[columnName]) {
    await queryInterface.removeColumn(tableName, columnName, { transaction });
  }
};

const hasIndex = async (queryInterface, tableName, indexName) => {
  try {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some((index) => index.name === indexName);
  } catch {
    return false;
  }
};

const addIndexIfMissing = async (
  queryInterface,
  tableName,
  fields,
  indexName,
  transaction
) => {
  if (!await hasIndex(queryInterface, tableName, indexName)) {
    await queryInterface.addIndex(tableName, fields, {
      name: indexName,
      unique: true,
      transaction
    });
  }
};

const removeIndexIfPresent = async (queryInterface, tableName, indexName, transaction) => {
  if (await hasIndex(queryInterface, tableName, indexName)) {
    await queryInterface.removeIndex(tableName, indexName, { transaction });
  }
};

const LEDGER_COLUMNS = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  consultorId: { type: DataTypes.INTEGER, allowNull: false },
  badgeId: { type: DataTypes.INTEGER, allowNull: false },
  candidaturaId: { type: DataTypes.INTEGER, allowNull: false },
  clientSubmissionId: { type: DataTypes.STRING(120), allowNull: false },
  responseStatus: { type: DataTypes.INTEGER, allowNull: false },
  responseBody: { type: DataTypes.JSONB, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

const up = async ({ queryInterface, transaction }) => {
  const existing = await tableNames(queryInterface);

  await addColumnIfMissing(
    queryInterface,
    'CANDIDATURABADGE',
    'clientSubmissionId',
    { type: DataTypes.STRING(120), allowNull: true },
    transaction
  );
  await addColumnIfMissing(
    queryInterface,
    'EVIDENCIA',
    'clientEvidenceId',
    { type: DataTypes.STRING(160), allowNull: true },
    transaction
  );

  if (!existing.has('CANDIDATURA_CLIENT_SUBMISSION')) {
    await queryInterface.createTable(
      'CANDIDATURA_CLIENT_SUBMISSION',
      LEDGER_COLUMNS,
      { transaction }
    );
  } else {
    for (const [columnName, definition] of Object.entries(LEDGER_COLUMNS)) {
      await addColumnIfMissing(
        queryInterface,
        'CANDIDATURA_CLIENT_SUBMISSION',
        columnName,
        definition,
        transaction
      );
    }
  }

  await addIndexIfMissing(
    queryInterface,
    'CANDIDATURABADGE',
    ['consultorId', 'clientSubmissionId'],
    'candidatura_consultor_client_submission_unique',
    transaction
  );
  await addIndexIfMissing(
    queryInterface,
    'EVIDENCIA',
    ['candidaturaId', 'clientEvidenceId'],
    'evidencia_candidatura_client_evidence_unique',
    transaction
  );
  await addIndexIfMissing(
    queryInterface,
    'CANDIDATURA_CLIENT_SUBMISSION',
    ['consultorId', 'clientSubmissionId'],
    'candidatura_submission_consultor_client_unique',
    transaction
  );
};

const down = async ({ queryInterface, transaction }) => {
  await removeIndexIfPresent(
    queryInterface,
    'EVIDENCIA',
    'evidencia_candidatura_client_evidence_unique',
    transaction
  );
  await removeIndexIfPresent(
    queryInterface,
    'CANDIDATURABADGE',
    'candidatura_consultor_client_submission_unique',
    transaction
  );

  const existing = await tableNames(queryInterface);
  if (existing.has('CANDIDATURA_CLIENT_SUBMISSION')) {
    await queryInterface.dropTable('CANDIDATURA_CLIENT_SUBMISSION', { transaction });
  }

  await removeColumnIfPresent(
    queryInterface,
    'EVIDENCIA',
    'clientEvidenceId',
    transaction
  );
  await removeColumnIfPresent(
    queryInterface,
    'CANDIDATURABADGE',
    'clientSubmissionId',
    transaction
  );
};

module.exports = { name, up, down };
