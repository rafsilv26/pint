const name = '20260715_000_existing_schema_baseline';

const requiredTables = ['UTILIZADOR', 'BADGE', 'CANDIDATURABADGE'];

const up = async ({ queryInterface }) => {
  const existingTables = new Set(
    (await queryInterface.showAllTables()).map((table) =>
      typeof table === 'string' ? table : table.tableName || table.table_name
    )
  );
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length) {
    throw new Error(
      `A base de dados não contém o esquema base esperado. Tabelas em falta: ${missingTables.join(', ')}.`
    );
  }
};

const down = async () => {};

module.exports = { name, up, down };
