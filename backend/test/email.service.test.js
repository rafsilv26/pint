const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const {
  enviarEmail,
  emailBadgeAprovado
} = require('../src/services/email.service');

const originalEnvironment = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER,
  APP_URL: process.env.APP_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_TIMEOUT_MS: process.env.EMAIL_TIMEOUT_MS
};
const originalFetch = globalThis.fetch;

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body)
});

beforeEach(() => {
  process.env.BREVO_API_KEY = 'xkeysib-test';
  process.env.EMAIL_USER = 'badges@example.com';
  process.env.APP_URL = 'https://api.example.com/';
  process.env.FRONTEND_URL = 'https://app.example.com/';
  process.env.EMAIL_TIMEOUT_MS = '1000';
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
});

test('envia pelo Brevo e devolve o ID aceite pelo fornecedor', async () => {
  let request;
  const result = await enviarEmail(
    'consultor@example.com',
    'Assunto',
    '<p>Mensagem</p>',
    {
      fetchImplementation: async (url, options) => {
        request = { url, options };
        return response(201, { messageId: 'email-123' });
      }
    }
  );

  assert.deepEqual(result, { id: 'email-123', to: 'consultor@example.com' });
  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(request.options.headers['api-key'], 'xkeysib-test');
  assert.deepEqual(JSON.parse(request.options.body), {
    sender: { name: 'Softinsa Badges', email: 'badges@example.com' },
    to: [{ email: 'consultor@example.com' }],
    subject: 'Assunto',
    htmlContent: '<p>Mensagem</p>'
  });
});

test('recusa iniciar sem chave ou remetente configurados', async () => {
  delete process.env.BREVO_API_KEY;
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>'),
    (error) => error.message.includes('BREVO_API_KEY')
  );

  process.env.BREVO_API_KEY = 'xkeysib-test';
  delete process.env.EMAIL_USER;
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>'),
    (error) => error.message.includes('EMAIL_USER')
  );
});

test('propaga uma rejeição do Brevo com o estado e resposta', async () => {
  await assert.rejects(
    enviarEmail('consultor@example.com', 'Assunto', '<p>Mensagem</p>', {
      fetchImplementation: async () =>
        response(403, { message: 'sender not allowed' })
    }),
    (error) =>
      error.message.includes('Brevo respondeu 403') &&
      error.message.includes('sender not allowed')
  );
});

test('template aprovado usa os campos reais de nível e pontos', async () => {
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return response(201, { messageId: 'email-template-1' });
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
  assert.match(payload.htmlContent, /Nível:<\/strong> Júnior/);
  assert.match(payload.htmlContent, /Pontos:<\/strong> 100/);
  assert.match(payload.htmlContent, /https:\/\/app\.example\.com\/badge\/public-token/);
});
