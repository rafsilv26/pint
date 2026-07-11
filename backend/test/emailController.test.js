const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const emailController = require('../src/controllers/emailController');

const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  APP_URL: process.env.APP_URL,
  EMAIL_TEST_TO: process.env.EMAIL_TEST_TO
};
const originalFetch = globalThis.fetch;

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM = 'Softinsa Badges <badges@example.com>';
  process.env.APP_URL = 'https://api.example.com';
  delete process.env.EMAIL_TEST_TO;
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
});

test('status de email não expõe a chave da API', () => {
  const res = createResponse();
  emailController.status({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.configured, true);
  assert.equal(res.body.provider, 'resend');
  assert.equal(res.body.from, 'Softinsa Badges <badges@example.com>');
  assert.equal(JSON.stringify(res.body).includes('re_test_key'), false);
});

test('status identifica configuração incompleta', () => {
  delete process.env.RESEND_FROM;
  const res = createResponse();
  emailController.status({}, res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.configured, false);
  assert.equal(res.body.code, 'EMAIL_CONFIG_FROM_MISSING');
});

test('teste envia apenas para o administrador autenticado', async () => {
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'email-admin-test' })
    };
  };
  const req = { user: { data: { email: 'admin@example.com' } } };
  const res = createResponse();

  await emailController.sendTest(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(payload.to, ['admin@example.com']);
  assert.equal(res.body.email.id, 'email-admin-test');
  assert.equal(res.body.email.destinatario, 'admin@example.com');
});

test('teste pode usar o destinatário técnico configurado', async () => {
  process.env.EMAIL_TEST_TO = 'resend-account@example.com';
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'email-technical-test' })
    };
  };
  const req = { user: { data: { email: 'admin@example.com' } } };
  const res = createResponse();

  await emailController.sendTest(req, res);

  assert.deepEqual(payload.to, ['resend-account@example.com']);
  assert.equal(res.body.email.destinatario, 'resend-account@example.com');
});
