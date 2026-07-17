const test = require('node:test');
const assert = require('node:assert/strict');

process.env.INTEGRATION_ENCRYPTION_KEY = 'integration-test-key-that-is-not-used-in-production';

const {
  decryptWebhookUrl,
  encryptWebhookUrl,
  maskWebhookUrl,
  validateWebhookUrl
} = require('../src/services/integrationSecurity.service');

test('aceita apenas webhooks oficiais da plataforma escolhida', () => {
  const slack = 'https://hooks.slack.com/services/T000/B000/secret';
  const teams = 'https://prod-01.westeurope.logic.azure.com/workflows/abc/triggers/manual/paths/invoke?sig=secret';

  assert.equal(validateWebhookUrl('slack', slack), slack);
  assert.equal(validateWebhookUrl('teams', teams), teams);
  assert.throws(
    () => validateWebhookUrl('slack', 'https://example.com/internal-hook'),
    /Incoming Webhook oficial do Slack/
  );
  assert.throws(
    () => validateWebhookUrl('teams', 'http://localhost:3000/hook'),
    /HTTPS/
  );
});

test('cifra a credencial e nunca a inclui na versão mascarada', () => {
  const original = 'https://hooks.slack.com/services/T000/B000/super-secret';
  const encrypted = encryptWebhookUrl(original);

  assert.match(encrypted, /^enc:v1:/);
  assert.equal(encrypted.includes('super-secret'), false);
  assert.equal(decryptWebhookUrl(encrypted), original);
  assert.equal(maskWebhookUrl(original).includes('super-secret'), false);
});
