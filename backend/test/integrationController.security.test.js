const test = require('node:test');
const assert = require('node:assert/strict');

process.env.INTEGRATION_ENCRYPTION_KEY = 'integration-controller-test-key';

let rows = [];
let nextId = 1;
let lastFindAllWhere = null;

const buildRow = (payload) => {
  const row = {
    integrationId: payload.integrationId || nextId++,
    ...payload,
    async update(changes) { Object.assign(this, changes); return this; },
    async destroy() { rows = rows.filter((item) => item !== this); }
  };
  return row;
};

const ExternalIntegration = {
  async findAll({ where }) {
    lastFindAllWhere = where;
    return rows.filter((row) => row.userId === where.userId);
  },
  async findOne({ where }) {
    return rows.find((row) =>
      String(row.integrationId) === String(where.integrationId) && row.userId === where.userId
    ) || null;
  },
  async create(payload) {
    const row = buildRow(payload);
    rows.push(row);
    return row;
  }
};

const mockModule = (relativePath, exports) => {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

mockModule('../src/models', { ExternalIntegration });
mockModule('../src/services/webhookIntegration.service', {
  construirPayload: (_platform, message) => message,
  enviarParaWebhook: async () => ({ ok: true, status: 200 })
});

const controller = require('../src/controllers/integrationController');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test.beforeEach(() => {
  rows = [];
  nextId = 1;
  lastFindAllWhere = null;
});

test('guarda a integração para o utilizador autenticado e não expõe o segredo', async () => {
  const res = response();
  await controller.saveMyIntegration({
    user: { id: 10 },
    body: {
      userId: 999,
      platform: 'slack',
      label: 'Certificações',
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/secret-value'
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(rows[0].userId, 10);
  assert.equal(rows[0].webhookUrl, null);
  assert.match(rows[0].accessToken, /^enc:v1:/);
  assert.equal(JSON.stringify(res.body).includes('secret-value'), false);
  assert.equal(Object.hasOwn(res.body, 'accessToken'), false);
  assert.equal(Object.hasOwn(res.body, 'webhookUrl'), false);
});

test('lista apenas as integrações do próprio utilizador com URL mascarado', async () => {
  const secretService = require('../src/services/integrationSecurity.service');
  rows = [
    buildRow({
      integrationId: 1,
      userId: 10,
      platform: 'teams',
      externalUserId: 'Equipa',
      accessToken: secretService.encryptWebhookUrl(
        'https://prod-01.westeurope.logic.azure.com/workflows/abc?sig=very-secret'
      ),
      active: true
    }),
    buildRow({ integrationId: 2, userId: 20, platform: 'slack', externalUserId: 'Outro' })
  ];
  const res = response();

  await controller.listMyIntegrations({ user: { id: 10 } }, res);

  assert.deepEqual(lastFindAllWhere, { userId: 10 });
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].id, 1);
  assert.equal(JSON.stringify(res.body).includes('very-secret'), false);
});

test('não permite alterar uma integração de outro utilizador', async () => {
  rows = [buildRow({ integrationId: 4, userId: 20, platform: 'slack', externalUserId: 'Outro' })];
  const res = response();

  await controller.updateMyIntegration({
    user: { id: 10 },
    params: { id: '4' },
    body: { active: false }
  }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(rows[0].active, undefined);
});

test('atualizar o webhook não reativa uma integração desativada', async () => {
  const row = buildRow({
    integrationId: 5,
    userId: 10,
    platform: 'slack',
    externalUserId: 'Canal',
    active: false
  });
  rows = [row];
  const res = response();

  await controller.saveMyIntegration({
    user: { id: 10 },
    body: {
      platform: 'slack',
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/new-secret'
    }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(row.active, false);
});
