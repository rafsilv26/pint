const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const {
  enviarEmail,
  emailBadgeAprovado
} = require('../src/services/email.service');

const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  APP_URL: process.env.APP_URL,
  EMAIL_TIMEOUT_MS: process.env.EMAIL_TIMEOUT_MS
};
const originalFetch = globalThis.fetch;

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body)
});

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM = 'Softinsa Badges <badges@example.com>';
  process.env.APP_URL = 'https://api.example.com/';
  process.env.EMAIL_TIMEOUT_MS = '1000';
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
});

test('envia pelo Resend e devolve o ID aceite pelo fornecedor', async () => {
  let request;
  const result = await enviarEmail(
    'consultor@example.com',
    'Assunto',
    '<p>Mensagem</p>',
    {
      fetchImplementation: async (url, options) => {
        request = { url, options };
        return response(200, { id: 'email-123' });
      }
    }
  );

  assert.deepEqual(result, { id: 'email-123', to: 'consultor@example.com' });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.headers.Authorization, 'Bearer re_test_key');
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'Softinsa Badges <badges@example.com>',
    to: ['consultor@example.com'],
    subject: 'Assunto',
    html: '<p>Mensagem</p>'
  });
});

test('recusa iniciar sem chave ou remetente configurados', async () => {
  delete process.env.RESEND_API_KEY;
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>'),
    (error) => error.code === 'EMAIL_CONFIG_API_KEY_MISSING'
  );

  process.env.RESEND_API_KEY = 're_test_key';
  delete process.env.RESEND_FROM;
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>'),
    (error) => error.code === 'EMAIL_CONFIG_FROM_MISSING'
  );
});

test('propaga de forma estruturada uma rejeição do Resend', async () => {
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>', {
      fetchImplementation: async () =>
        response(403, { message: 'The resend.dev domain is for testing only' })
    }),
    (error) =>
      error.code === 'EMAIL_PROVIDER_REJECTED' &&
      error.status === 403 &&
      error.message.includes('testing only')
  );
});

test('template aprovado usa os campos reais de nível e pontos', async () => {
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return response(200, { id: 'email-template-1' });
  };

  const result = await emailBadgeAprovado(
    { nome: 'Rafael', email: 'rafael@example.com' },
    {
      nome: 'Azure Fundamentals',
      ponto: 100,
      Level: { nome: 'Júnior' }
    },
    'public-token'
  );

  assert.equal(result.id, 'email-template-1');
  assert.match(payload.html, /Nível:<\/strong> Júnior/);
  assert.match(payload.html, /Pontos:<\/strong> 100/);
  assert.match(
    payload.html,
    /https:\/\/api\.example\.com\/api\/relatorios\/verificar\/public-token/
  );
});
