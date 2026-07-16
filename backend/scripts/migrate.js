require('dotenv').config();
const sequelize = require('../src/config/database');
require('../src/models');
const { rollbackLastMigration, runMigrations } = require('../src/services/migrationRunner.service');

const main = async () => {
  try {
    await sequelize.authenticate();
    if (process.argv[2] === 'down') {
      const name = await rollbackLastMigration(sequelize);
      console.log(name ? `Migration revertida: ${name}` : 'Não existem migrations para reverter.');
    } else {
      const executed = await runMigrations(sequelize);
      console.log(executed.length ? `Migrations aplicadas: ${executed.join(', ')}` : 'Base de dados atualizada.');
    }
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('Erro ao executar migrations:', error);
  process.exitCode = 1;
});
