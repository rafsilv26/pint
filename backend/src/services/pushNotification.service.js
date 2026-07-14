const admin = require('firebase-admin');
const { DevicePushToken, NotificationConfig } = require('../models');

let firebaseApp;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw);
    firebaseApp = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return firebaseApp;
  } catch (error) {
    console.error('Configuração Firebase inválida:', error.message);
    return null;
  }
}

async function registerDeviceToken({ userId, token, platform }) {
  const [row] = await DevicePushToken.findOrCreate({
    where: { token },
    defaults: { userId, token, platform, active: true }
  });
  await row.update({ userId, platform, active: true, updatedAt: new Date() });
  return row;
}

async function unregisterDeviceToken({ userId, token }) {
  await DevicePushToken.update(
    { active: false, updatedAt: new Date() },
    { where: { userId, token } }
  );
}

async function sendPushToUser(userId, { title, body, type = 'info', action = 'fetch_api' }) {
  const config = await NotificationConfig.findOne({ where: { type: 'global' } });
  if (config && config.pushEnabled === false) {
    return { sent: 0, configured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON), enabled: false };
  }
  const app = getFirebaseApp();
  if (!app) return { sent: 0, configured: false };
  const rows = await DevicePushToken.findAll({ where: { userId, active: true } });
  if (rows.length === 0) return { sent: 0, configured: true };

  const response = await admin.messaging().sendEachForMulticast({
    tokens: rows.map((row) => row.token),
    notification: { title, body: body || '' },
    data: { type: String(type), action, comando: 'atualizar' },
    android: { priority: 'high' },
    apns: { payload: { aps: { contentAvailable: true } } }
  });

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    const code = result.error?.code || '';
    if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
      invalidTokens.push(rows[index].token);
    }
  });
  if (invalidTokens.length > 0) {
    await DevicePushToken.update(
      { active: false, updatedAt: new Date() },
      { where: { token: invalidTokens } }
    );
  }
  return { sent: response.successCount, failed: response.failureCount, configured: true };
}

module.exports = { registerDeviceToken, unregisterDeviceToken, sendPushToUser };
