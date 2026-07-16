const { DataTypes } = require('sequelize');

const name = '20260715_001_current_schema';

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

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition, transaction) => {
  const description = await describeIfExists(queryInterface, tableName);
  if (description && !description[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition, { transaction });
  }
};

const removeColumnIfPresent = async (queryInterface, tableName, columnName, transaction) => {
  const description = await describeIfExists(queryInterface, tableName);
  if (description?.[columnName]) {
    await queryInterface.removeColumn(tableName, columnName, { transaction });
  }
};

const up = async ({ queryInterface, transaction }) => {
  const existing = await tableNames(queryInterface);

  if (!existing.has('EMAIL_TEMPLATE')) {
    await queryInterface.createTable('EMAIL_TEMPLATE', {
      templateId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      updatedBy: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: true }
    }, { transaction });
  }

  if (!existing.has('DEVICE_PUSH_TOKEN')) {
    await queryInterface.createTable('DEVICE_PUSH_TOKEN', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.TEXT, allowNull: false, unique: true },
      platform: { type: DataTypes.STRING(20), allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: true }
    }, { transaction });
  }

  await addColumnIfMissing(
    queryInterface,
    'SLA_CONFIG',
    'team',
    { type: DataTypes.STRING(20), allowNull: true },
    transaction
  );
  await addColumnIfMissing(
    queryInterface,
    'CONSULTOR_TIMELINE',
    'createdBy',
    { type: DataTypes.INTEGER, allowNull: true },
    transaction
  );
};

const down = async ({ queryInterface, transaction }) => {
  await removeColumnIfPresent(queryInterface, 'CONSULTOR_TIMELINE', 'createdBy', transaction);
  await removeColumnIfPresent(queryInterface, 'SLA_CONFIG', 'team', transaction);

  const existing = await tableNames(queryInterface);
  if (existing.has('DEVICE_PUSH_TOKEN')) {
    await queryInterface.dropTable('DEVICE_PUSH_TOKEN', { transaction });
  }
  if (existing.has('EMAIL_TEMPLATE')) {
    await queryInterface.dropTable('EMAIL_TEMPLATE', { transaction });
  }
};

module.exports = { name, up, down };
