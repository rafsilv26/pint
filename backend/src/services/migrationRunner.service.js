const migrations = require('../migrations');

const MIGRATION_LOCK_TIMEOUT_MS = 10000;
const MIGRATION_STATEMENT_TIMEOUT_MS = 60000;

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
      // Num deploy blue/green, a instância anterior pode manter locks durante
      // alguns segundos. Sem limites, um ALTER TABLE fica à espera até o
      // Render terminar o novo processo por não abrir a porta a tempo.
      await sequelize.query(
        `SET LOCAL lock_timeout = '${MIGRATION_LOCK_TIMEOUT_MS}ms'`,
        { transaction }
      );
      await sequelize.query(
        `SET LOCAL statement_timeout = '${MIGRATION_STATEMENT_TIMEOUT_MS}ms'`,
        { transaction }
      );
      await migration.up({ sequelize, queryInterface, transaction });
      await sequelize.query(
        'INSERT INTO "SCHEMA_MIGRATION" ("name") VALUES (:name)',
        { replacements: { name: migration.name }, transaction }
      );
      await transaction.commit();
      executed.push(migration.name);
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Preserva o erro original da migration. Uma ligação já terminada
        // também pode falhar no ROLLBACK, como aconteceu no Render.
        error.rollbackError = rollbackError;
        console.error(
          `[migration] Falha adicional ao reverter ${migration.name}:`,
          rollbackError.message
        );
      }
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
