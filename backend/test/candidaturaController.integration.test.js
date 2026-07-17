const test = require('node:test');
const assert = require('node:assert/strict');

const STATUS_IDS = {
  OPEN: 1,
  SUBMITTED: 2,
  VALIDATED: 3,
  APPROVED: 4,
  REJECTED: 5
};

let candidaturaAtual;
let requirements = [];
let scopeError = null;
let historyPayload;
let awardPayload;

const statusRows = (codes) => codes.map((code) => ({ code, statusId: STATUS_IDS[code] }));
const models = {
  BadgeStatus: {
    findAll: async ({ where }) => statusRows(where.code),
    findOne: async ({ where }) => ({ code: where.code, statusId: STATUS_IDS[where.code] })
  },
  Badge: { findByPk: async () => ({ id: 7, ativo: true, nivelId: 9 }) },
  Consultant: { findByPk: async () => ({ consultorId: 10 }) },
  Candidatura: {
    findOne: async () => null,
    findByPk: async () => candidaturaAtual,
    create: async () => { throw new Error('não deve criar candidatura neste teste'); }
  },
  Requirement: { findAll: async () => requirements },
  Evidencia: { findAll: async () => [], create: async () => ({}) },
  HistoricoCandidatura: {
    create: async (payload) => { historyPayload = payload; return payload; }
  },
  ConsultorBadge: {
    findOne: async () => null,
    upsert: async (payload) => { awardPayload = payload; return payload; }
  },
  Notice: { create: async (payload) => ({ ...payload, noticeId: 1 }) },
  ExternalIntegration: { findAll: async () => [] },
  User: { associations: { TalentManager: {}, ServiceLineLeader: {} }, findAll: async () => [], findByPk: async () => null },
  EvidenciaModelUnused: {},
  Level: {},
  Area: {}
};

const mockModule = (relativePath, exports) => {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

mockModule('../src/config/database', {
  query: async () => [[], null],
  transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })
});
mockModule('../src/models', models);
mockModule('../src/services/cloudinary.service', { uploadFicheiro: async () => 'https://files.example/evidence' });
mockModule('../src/services/email.service', {
  emailCandidaturaSubmetida: async () => {}, emailNovaSubmissao: async () => {},
  emailEnviadoParaServiceLine: async () => {}, emailNovaValidacaoSLL: async () => {},
  emailBadgeAprovado: async () => {}, emailBadgeRejeitado: async () => {}, emailSendBack: async () => {}
});
mockModule('../src/services/serviceLineScope.service', {
  assertBadgeInServiceLineScope: async () => { if (scopeError) throw scopeError; },
  getServiceLineScopeForUser: async () => null,
  getBadgeIdsDaServiceLine: async () => [7]
});
mockModule('../src/services/pushNotification.service', { sendPushToUser: async () => {} });
mockModule('../src/services/sla.service', { getSLAConfigForTeam: async () => null });

const controller = require('../src/controllers/candidaturaController');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test.beforeEach(() => {
  candidaturaAtual = null;
  requirements = [];
  scopeError = null;
  historyPayload = null;
  awardPayload = null;
});

test('consultor não submete sem cobrir todos os requisitos obrigatórios', async () => {
  requirements = [{ id: 1, obrigatorio: true }, { id: 2, obrigatorio: true }];
  const res = response();
  await controller.submeterCandidatura({
    user: { id: 10 },
    body: { badgeId: 7, requisitoIds: ['1'], rascunho: 'false' },
    files: [{ originalname: 'proof.pdf', mimetype: 'application/pdf' }]
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.requisitosEmFalta, [2]);
});

test('TM não aprova uma candidatura com evidências por validar', async () => {
  candidaturaAtual = {
    id: 20,
    estadoId: STATUS_IDS.SUBMITTED,
    evidencias: [{ validado: false }],
    update: async () => { throw new Error('não deve atualizar'); }
  };
  const res = response();
  await controller.validarTalentManager({
    user: { id: 30, roles: ['TalentManager'] },
    params: { id: '20' },
    body: { decisao: 'APROVAR' }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.erro, /validar todas as evidências/i);
});

test('SLL não decide uma candidatura fora da sua Service Line', async () => {
  candidaturaAtual = { id: 20, badgeId: 7 };
  scopeError = Object.assign(new Error('Fora da Service Line.'), { statusCode: 403 });
  const res = response();
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await controller.validarServiceLine({
      user: { id: 40, roles: ['ServiceLineLeader'] },
      params: { id: '20' },
      body: { decisao: 'APROVAR' }
    }, res);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.erro, 'Fora da Service Line.');
  assert.equal(awardPayload, null);
});

test('aprovação do SLL cria badge com pontos e histórico', async () => {
  candidaturaAtual = {
    id: 20,
    badgeId: 7,
    consultorId: 10,
    estadoId: STATUS_IDS.VALIDATED,
    Badge: { id: 7, nome: 'Azure', duracaoMeses: 12, ponto: 150 },
    Consultant: { User: { id: 10, nome: 'Ana' } },
    update: async (payload) => { candidaturaAtual.estadoId = payload.estadoId; }
  };
  const res = response();
  await controller.validarServiceLine({
    user: { id: 40, roles: ['ServiceLineLeader'] },
    params: { id: '20' },
    body: { decisao: 'APROVAR', comentario: 'Tudo certo' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(candidaturaAtual.estadoId, STATUS_IDS.APPROVED);
  assert.equal(historyPayload.estadoAnterior, STATUS_IDS.VALIDATED);
  assert.equal(historyPayload.estadoNovo, STATUS_IDS.APPROVED);
  assert.equal(awardPayload.consultorId, 10);
  assert.equal(awardPayload.badgeId, 7);
  assert.equal(awardPayload.pointsObtained, 150);
  assert.equal(typeof awardPayload.publicToken, 'string');
});
