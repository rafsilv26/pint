const prepararBaseDeDados = async ({
  sequelize,
  executarMigrations,
  tarefasDepoisDasMigrations = []
}) => {
  await sequelize.authenticate();
  await executarMigrations(sequelize);

  for (const tarefa of tarefasDepoisDasMigrations) {
    await tarefa();
  }
};

module.exports = { prepararBaseDeDados };
