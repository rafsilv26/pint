const migrations = require('../migrations');

const ensureMigrationTable = (sequelize) => sequelize.query(`
  CREATE TABLE IF NOT EXISTS "SCHEMA_MIGRATION" (
    "name" VARCHAR(255) PRIMARY KEY,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const runMigrations = async (sequelize, migrationList = migrations) => {
  await ensureMigrationTable(sequelize);
  const [rows] = await sequelize.query('SELECT "name" FROM "SCHEMA_MIGRATION" ORDER BY "name"');
  const applied = new Set(rows.map((row) => row.name));
  const queryInterface = sequelize.getQueryInterface();
  const executed = [];

  for (const migration of migrationList) {
    if (applied.has(migration.name)) continue;

    const transaction = await sequelize.transaction();
    try {
      await migration.up({ sequelize, queryInterface, transaction });
      await sequelize.query(
        'INSERT INTO "SCHEMA_MIGRATION" ("name") VALUES (:name)',
        { replacements: { name: migration.name }, transaction }
      );
      await transaction.commit();
      executed.push(migration.name);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  return executed;
};

const rollbackLastMigration = async (sequelize, migrationList = migrations) => {
  await ensureMigrationTable(sequelize);
  const [rows] = await sequelize.query(
    'SELECT "name" FROM "SCHEMA_MIGRATION" ORDER BY "appliedAt" DESC, "name" DESC LIMIT 1'
  );
  if (!rows.length) return null;

  const migration = migrationList.find((candidate) => candidate.name === rows[0].name);
  if (!migration?.down) throw new Error(`Migration sem rollback: ${rows[0].name}`);

  const transaction = await sequelize.transaction();
  try {
    await migration.down({ sequelize, queryInterface: sequelize.getQueryInterface(), transaction });
    await sequelize.query(
      'DELETE FROM "SCHEMA_MIGRATION" WHERE "name" = :name',
      { replacements: { name: migration.name }, transaction }
    );
    await transaction.commit();
    return migration.name;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { rollbackLastMigration, runMigrations };
