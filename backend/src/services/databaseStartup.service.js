// Prepara a base de dados antes de o Express começar a aceitar pedidos.
// O esquema é atualizado por migrations versionadas, nunca por sync alter.
const prepararBaseDeDados = async ({
  sequelize,
  executarMigrations,
  tarefasDepoisDasMigrations = []
}) => {
  console.log('[startup] A autenticar na base de dados...');
  await sequelize.authenticate();
  console.log('[startup] Autenticado. A correr migrations...');
  const executadas = await executarMigrations(sequelize);
  console.log(`[startup] Migrations OK (${Array.isArray(executadas) ? executadas.length : 0} aplicadas).`);

  for (const tarefa of tarefasDepoisDasMigrations) {
    console.log(`[startup] Tarefa pós-migration: ${tarefa.name || 'anónima'}...`);
    await tarefa();
  }
  console.log('[startup] Preparação da base de dados concluída.');
};

module.exports = { prepararBaseDeDados };
