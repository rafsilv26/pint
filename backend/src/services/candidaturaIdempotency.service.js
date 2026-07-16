const MAX_CLIENT_SUBMISSION_ID_LENGTH = 120;
const MAX_CLIENT_EVIDENCE_ID_LENGTH = 160;

const normalizeString = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength) || null;
};

const normalizeClientSubmissionId = (value) =>
  normalizeString(value, MAX_CLIENT_SUBMISSION_ID_LENGTH);

const normalizeBadgeId = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : value;
  const isIntegerString = typeof normalized === 'string' && /^\d+$/.test(normalized);
  const number = isIntegerString ? Number(normalized) : normalized;

  if (!Number.isSafeInteger(number) || number <= 0) {
    const error = new Error('O identificador da badge tem de ser um inteiro válido.');
    error.statusCode = 400;
    throw error;
  }

  return number;
};

const toArray = (value) => {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Normaliza os identificadores das evidências enviados pelo cliente.
 *
 * Clientes móveis novos enviam um `clientEvidenceIds` por ficheiro. Para
 * manter compatibilidade com a primeira versão da fila offline, quando existe
 * `clientSubmissionId` mas ainda não existem IDs explícitos, é gerado um ID
 * estável a partir da posição do ficheiro no pedido. A fila preserva a ordem
 * dos ficheiros nos reenvios.
 */
const resolveClientEvidenceIds = ({ rawIds, clientSubmissionId, fileCount }) => {
  const supplied = toArray(rawIds).map((value) =>
    normalizeString(value, MAX_CLIENT_EVIDENCE_ID_LENGTH)
  );

  if (supplied.some((value) => value === null)) {
    const error = new Error('Cada identificador de evidência tem de ser válido.');
    error.statusCode = 400;
    throw error;
  }

  if (supplied.length > 0 && supplied.length !== fileCount) {
    const error = new Error('Cada evidência tem de ter um identificador de cliente.');
    error.statusCode = 400;
    throw error;
  }

  const ids = supplied.length > 0
    ? supplied
    : clientSubmissionId
      ? Array.from({ length: fileCount }, (_, index) =>
        `${clientSubmissionId}:${index}`.slice(0, MAX_CLIENT_EVIDENCE_ID_LENGTH)
      )
      : Array.from({ length: fileCount }, () => null);

  const nonNullIds = ids.filter(Boolean);
  if (new Set(nonNullIds).size !== nonNullIds.length) {
    const error = new Error('Os identificadores das evidências não podem ser repetidos.');
    error.statusCode = 400;
    throw error;
  }

  return ids;
};

/**
 * Adquire locks mantidos até ao fim da transação. A versão de dois inteiros
 * de pg_advisory_xact_lock permite separar namespaces de chave e badge.
 * Funciona entre processos/instâncias, ao contrário de um mutex em memória.
 */
const acquireClientSubmissionLock = async ({
  sequelize,
  transaction,
  consultorId,
  clientSubmissionId,
  badgeId
}) => {
  // Ordem fixa em todos os pedidos: primeiro chave global da submissão,
  // depois consultor+badge. Isto evita deadlocks e cobre simultaneamente:
  // - a mesma chave usada (até por engano) em badges diferentes;
  // - chaves diferentes que tentam criar a mesma candidatura de badge.
  if (clientSubmissionId) {
    await sequelize.query(
      'SELECT pg_advisory_xact_lock(hashtext(:scope), hashtext(:resource))',
      {
        replacements: {
          scope: `candidatura-chave:${consultorId}`,
          resource: clientSubmissionId
        },
        transaction
      }
    );
  }

  await sequelize.query(
    'SELECT pg_advisory_xact_lock(hashtext(:scope), hashtext(:resource))',
    {
      replacements: {
        scope: `candidatura-badge:${consultorId}`,
        resource: String(badgeId)
      },
      transaction
    }
  );
};

const withClientSubmissionTransaction = async ({
  sequelize,
  consultorId,
  clientSubmissionId,
  badgeId
}, work) => sequelize.transaction(async (transaction) => {
  await acquireClientSubmissionLock({
    sequelize,
    transaction,
    consultorId,
    clientSubmissionId,
    badgeId
  });
  return work(transaction);
});

/**
 * Remove apenas evidências que já foram persistidas com o mesmo ID exato.
 * O requisito não é usado como chave porque uma candidatura pode conter mais
 * do que uma evidência para o mesmo requisito.
 */
const getPendingEvidenceUploads = ({ files, requirementIds, evidenceIds, existingEvidence }) => {
  const existingByClientId = new Map(
    existingEvidence
      .filter((evidence) => evidence.clientEvidenceId)
      .map((evidence) => [evidence.clientEvidenceId, evidence])
  );

  return files.map((file, index) => {
    const clientEvidenceId = evidenceIds[index] || null;
    const requirementId = requirementIds[index];
    const existing = clientEvidenceId ? existingByClientId.get(clientEvidenceId) : null;

    if (existing && Number(existing.requisitoId) !== Number(requirementId)) {
      const error = new Error(
        'O identificador desta evidência já foi utilizado noutro requisito.'
      );
      error.statusCode = 409;
      throw error;
    }

    return { file, requirementId, clientEvidenceId, existing };
  }).filter((item) => !item.existing);
};

module.exports = {
  MAX_CLIENT_SUBMISSION_ID_LENGTH,
  MAX_CLIENT_EVIDENCE_ID_LENGTH,
  normalizeClientSubmissionId,
  normalizeBadgeId,
  resolveClientEvidenceIds,
  acquireClientSubmissionLock,
  withClientSubmissionTransaction,
  getPendingEvidenceUploads
};
