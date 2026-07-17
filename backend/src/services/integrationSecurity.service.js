const crypto = require('crypto');

const ENCRYPTED_PREFIX = 'enc:v1:';
const SUPPORTED_PLATFORMS = new Set(['slack', 'teams']);
const TEAMS_HOST_SUFFIXES = [
  'logic.azure.com',
  'environment.api.powerplatform.com',
  'webhook.office.com'
];

const normalizePlatform = (value) => String(value || '').trim().toLowerCase();

const assertSupportedPlatform = (value) => {
  const platform = normalizePlatform(value);
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    const error = new Error('Seleciona Slack ou Microsoft Teams.');
    error.statusCode = 400;
    throw error;
  }
  return platform;
};

const hasHostSuffix = (hostname, suffix) =>
  hostname === suffix || hostname.endsWith(`.${suffix}`);

const validateWebhookUrl = (platformValue, value) => {
  const platform = assertSupportedPlatform(platformValue);
  const raw = String(value || '').trim();
  if (!raw || raw.length > 4000) {
    const error = new Error('Indica um URL de webhook válido.');
    error.statusCode = 400;
    throw error;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    const error = new Error('O URL do webhook não é válido.');
    error.statusCode = 400;
    throw error;
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    const error = new Error('O webhook tem de usar HTTPS e não pode incluir credenciais no URL.');
    error.statusCode = 400;
    throw error;
  }

  const hostname = parsed.hostname.toLowerCase();
  const isSlack = ['hooks.slack.com', 'hooks.slack-gov.com'].includes(hostname) &&
    parsed.pathname.startsWith('/services/');
  const isTeams = TEAMS_HOST_SUFFIXES.some((suffix) => hasHostSuffix(hostname, suffix));

  if ((platform === 'slack' && !isSlack) || (platform === 'teams' && !isTeams)) {
    const error = new Error(
      platform === 'slack'
        ? 'Utiliza um Incoming Webhook oficial do Slack.'
        : 'Utiliza um webhook criado pela aplicação Workflows do Microsoft Teams.'
    );
    error.statusCode = 400;
    throw error;
  }

  return parsed.toString();
};

const encryptionKey = () => {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('A cifra das integrações não está configurada.');
    error.statusCode = 503;
    throw error;
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptWebhookUrl = (webhookUrl) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(webhookUrl, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
};

const isEncryptedWebhookUrl = (value) => String(value || '').startsWith(ENCRYPTED_PREFIX);

const decryptWebhookUrl = (value) => {
  if (!isEncryptedWebhookUrl(value)) return null;
  const parts = String(value).split(':');
  if (parts.length !== 5) throw new Error('Credencial de integração inválida.');
  const iv = Buffer.from(parts[2], 'base64url');
  const tag = Buffer.from(parts[3], 'base64url');
  const encrypted = Buffer.from(parts[4], 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

const getIntegrationWebhookUrl = (integration) => {
  const encrypted = integration?.accessToken;
  if (isEncryptedWebhookUrl(encrypted)) return decryptWebhookUrl(encrypted);
  return integration?.webhookUrl || null;
};

const maskWebhookUrl = (value) => {
  try {
    const parsed = new URL(value);
    const firstPathPart = parsed.pathname.split('/').filter(Boolean)[0];
    return `${parsed.origin}/${firstPathPart ? `${firstPathPart}/` : ''}••••••••`;
  } catch {
    return '••••••••';
  }
};

module.exports = {
  assertSupportedPlatform,
  decryptWebhookUrl,
  encryptWebhookUrl,
  getIntegrationWebhookUrl,
  isEncryptedWebhookUrl,
  maskWebhookUrl,
  normalizePlatform,
  validateWebhookUrl
};
