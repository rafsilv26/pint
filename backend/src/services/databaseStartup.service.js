const DEFAULT_RETRY_INTERVAL_MS = 10000;

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

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

const prepararBaseDeDadosComRetry = async ({
  retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
  esperar = wait,
  ...options
}) => {
  let tentativa = 0;

  while (true) {
    tentativa += 1;
    try {
      return await prepararBaseDeDados(options);
    } catch (error) {
      console.error(
        `[startup] Preparação da base de dados falhou (tentativa ${tentativa}). `
          + `Nova tentativa em ${retryIntervalMs} ms:`,
        error.message
      );
      await esperar(retryIntervalMs);
    }
  }
};

module.exports = { prepararBaseDeDados, prepararBaseDeDadosComRetry };
