const test = require('node:test');
const assert = require('node:assert/strict');

const { createCorsOptions, getAllowedOrigins } = require('../src/config/cors');

const checkOrigin = (options, origin) => new Promise((resolve) => {
  options.origin(origin, (error, allowed) => resolve({ error, allowed }));
});

test('CORS permite apenas origens configuradas em produção', async () => {
  const env = {
    NODE_ENV: 'production',
    FRONTEND_URL: 'https://app.example.com/',
    CORS_ORIGINS: 'https://admin.example.com, https://preview.example.com'
  };
  const options = createCorsOptions(env);

  assert.deepEqual([...getAllowedOrigins(env)].sort(), [
    'https://admin.example.com',
    'https://app.example.com',
    'https://preview.example.com'
  ]);
  assert.deepEqual(await checkOrigin(options, 'https://app.example.com'), { error: null, allowed: true });
  const denied = await checkOrigin(options, 'https://evil.example.com');
  assert.equal(denied.allowed, undefined);
  assert.equal(denied.error.code, 'CORS_ORIGIN_DENIED');
});

test('CORS permite pedidos sem Origin para clientes móveis e servidor-servidor', async () => {
  const result = await checkOrigin(createCorsOptions({ NODE_ENV: 'production' }), undefined);
  assert.deepEqual(result, { error: null, allowed: true });
});
