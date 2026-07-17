// Prepara a base de dados antes de o Express começar a aceitar pedidos.
// O esquema é atualizado por migrations versionadas, nunca por sync alter.
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
