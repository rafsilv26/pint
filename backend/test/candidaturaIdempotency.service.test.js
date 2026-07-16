const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const {
  normalizeClientSubmissionId,
  normalizeBadgeId,
  resolveClientEvidenceIds,
  acquireClientSubmissionLock,
  withClientSubmissionTransaction,
  getPendingEvidenceUploads
} = require('../src/services/candidaturaIdempotency.service');

test('normaliza e limita a chave idempotente da candidatura', () => {
  assert.equal(normalizeClientSubmissionId('  pedido-42  '), 'pedido-42');
  assert.equal(normalizeClientSubmissionId('   '), null);
  assert.equal(normalizeClientSubmissionId('x'.repeat(140)).length, 120);
});

test('normaliza representações equivalentes da badge antes dos locks', () => {
  assert.equal(normalizeBadgeId(7), 7);
  assert.equal(normalizeBadgeId('7'), 7);
  assert.equal(normalizeBadgeId('07'), 7);
  assert.equal(normalizeBadgeId(' 7 '), 7);
  assert.throws(
    () => normalizeBadgeId('7.5'),
    (error) => error.statusCode === 400 && /inteiro válido/.test(error.message)
  );
});

test('controller decide o replay antes de validar badge e requisitos mutáveis', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/controllers/candidaturaController.js'),
    'utf8'
  );
  const transactionStart = source.indexOf(
    'const result = await withClientSubmissionTransaction'
  );
  const badgeNormalization = source.indexOf(
    'const badgeId = normalizeBadgeId(req.body.badgeId)'
  );
  const ledgerLookup = source.indexOf(
    'const submission = clientSubmissionId',
    transactionStart
  );
  const ledgerReplay = source.indexOf(
    'if (submission) return replayResult(submission);',
    ledgerLookup
  );
  const legacyLookup = source.indexOf(
    'const candidaturaIdempotente = clientSubmissionId',
    ledgerReplay
  );
  const legacyReplay = source.indexOf(
    'if (candidaturaIdempotente)',
    legacyLookup
  );
  const evidenceValidation = source.indexOf('const idsRequisitos =', transactionStart);
  const badgeValidation = source.indexOf(
    'const badge = await Badge.findByPk(badgeId, { transaction });',
    transactionStart
  );
  const requirementValidation = source.indexOf(
    'const requisitosDoNivel = await Requirement.findAll',
    transactionStart
  );

  assert.ok(transactionStart >= 0);
  assert.ok(badgeNormalization >= 0 && badgeNormalization < transactionStart);
  assert.ok(ledgerLookup > transactionStart);
  assert.ok(ledgerReplay > ledgerLookup);
  assert.ok(legacyLookup > ledgerReplay);
  assert.ok(legacyReplay > legacyLookup && legacyReplay < evidenceValidation);
  assert.ok(evidenceValidation > ledgerReplay);
  assert.ok(badgeValidation > ledgerReplay);
  assert.ok(requirementValidation > ledgerReplay);
});

test('ledger preserva a chave anterior antes de uma correção pós-SEND_BACK', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/controllers/candidaturaController.js'),
    'utf8'
  );
  const previousKey = source.indexOf(
    'clientSubmissionId: candidatura.clientSubmissionId'
  );
  const replaceKey = source.indexOf(
    'await candidatura.update({ clientSubmissionId }, { transaction });',
    previousKey
  );
  const ledgerReplay = source.indexOf(
    'if (submission) return replayResult(submission);'
  );

  assert.ok(ledgerReplay >= 0);
  assert.ok(previousKey > ledgerReplay);
  assert.ok(replaceKey > previousKey);
});

test('modelo do ledger tem chave única por consultor e clientSubmissionId', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/models/CandidaturaSubmission.js'),
    'utf8'
  );

  assert.match(source, /tableName: 'CANDIDATURA_CLIENT_SUBMISSION'/);
  assert.match(source, /unique: true/);
  assert.match(source, /fields: \['consultorId', 'clientSubmissionId'\]/);
});

test('gera IDs de evidência estáveis para clientes mobile antigos', () => {
  const first = resolveClientEvidenceIds({
    rawIds: undefined,
    clientSubmissionId: 'pedido-42',
    fileCount: 3
  });
  const retry = resolveClientEvidenceIds({
    rawIds: undefined,
    clientSubmissionId: 'pedido-42',
    fileCount: 3
  });

  assert.deepEqual(first, ['pedido-42:0', 'pedido-42:1', 'pedido-42:2']);
  assert.deepEqual(retry, first);
});

test('rejeita IDs de evidência repetidos ou em quantidade diferente', () => {
  assert.throws(
    () => resolveClientEvidenceIds({
      rawIds: ['evidencia-a', 'evidencia-a'],
      clientSubmissionId: 'pedido-42',
      fileCount: 2
    }),
    (error) => error.statusCode === 400 && /repetidos/.test(error.message)
  );

  assert.throws(
    () => resolveClientEvidenceIds({
      rawIds: ['evidencia-a'],
      clientSubmissionId: 'pedido-42',
      fileCount: 2
    }),
    (error) => error.statusCode === 400 && /identificador/.test(error.message)
  );
});

test('deduplica pela evidência exata e preserva duas do mesmo requisito', () => {
  const files = [{ name: 'primeira.pdf' }, { name: 'segunda.pdf' }];
  const pending = getPendingEvidenceUploads({
    files,
    requirementIds: [7, 7],
    evidenceIds: ['ev-1', 'ev-2'],
    existingEvidence: [{ clientEvidenceId: 'ev-1', requisitoId: 7 }]
  });

  assert.deepEqual(pending, [{
    file: files[1],
    requirementId: 7,
    clientEvidenceId: 'ev-2',
    existing: undefined
  }]);
});

test('impede reutilizar um ID de evidência noutro requisito', () => {
  assert.throws(
    () => getPendingEvidenceUploads({
      files: [{ name: 'prova.pdf' }],
      requirementIds: [8],
      evidenceIds: ['ev-1'],
      existingEvidence: [{ clientEvidenceId: 'ev-1', requisitoId: 7 }]
    }),
    (error) => error.statusCode === 409 && /outro requisito/.test(error.message)
  );
});

test('bloqueia chave e consultor+badge, por ordem fixa, dentro da transação', async () => {
  const calls = [];
  const transaction = { id: 'tx-1' };
  const sequelize = {
    async query(sql, options) {
      calls.push({ sql, options });
    }
  };

  await acquireClientSubmissionLock({
    sequelize,
    transaction,
    consultorId: 30,
    clientSubmissionId: 'pedido-42',
    badgeId: 7
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /pg_advisory_xact_lock/);
  assert.deepEqual(calls[0].options.replacements, {
    scope: 'candidatura-chave:30',
    resource: 'pedido-42'
  });
  assert.equal(calls[0].options.transaction, transaction);
  assert.deepEqual(calls[1].options.replacements, {
    scope: 'candidatura-badge:30',
    resource: '7'
  });
  assert.equal(calls[1].options.transaction, transaction);
});

test('serializa duas chaves diferentes do mesmo consultor e badge', async () => {
  const lockTails = new Map();
  const fakeSequelize = {
    async transaction(work) {
      const transaction = { releases: [] };
      try {
        return await work(transaction);
      } finally {
        for (const release of transaction.releases.reverse()) release();
      }
    },
    async query(_sql, options) {
      const { scope, resource } = options.replacements;
      const key = `${scope}|${resource}`;
      const previous = lockTails.get(key) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      lockTails.set(key, current);
      await previous;
      options.transaction.releases.push(() => {
        release();
        if (lockTails.get(key) === current) lockTails.delete(key);
      });
    }
  };

  let releaseFirst;
  const holdFirst = new Promise((resolve) => { releaseFirst = resolve; });
  let firstEntered;
  const firstStarted = new Promise((resolve) => { firstEntered = resolve; });
  const events = [];

  const first = withClientSubmissionTransaction({
    sequelize: fakeSequelize,
    consultorId: 30,
    clientSubmissionId: 'pedido-a',
    badgeId: 7
  }, async () => {
    events.push('primeiro-inicio');
    firstEntered();
    await holdFirst;
    events.push('primeiro-fim');
  });

  await firstStarted;
  const second = withClientSubmissionTransaction({
    sequelize: fakeSequelize,
    consultorId: 30,
    clientSubmissionId: 'pedido-b',
    badgeId: 7
  }, async () => {
    events.push('segundo-inicio');
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['primeiro-inicio']);

  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ['primeiro-inicio', 'primeiro-fim', 'segundo-inicio']);
});
