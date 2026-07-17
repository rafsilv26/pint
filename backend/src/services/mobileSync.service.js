const crypto = require('crypto');
const models = require('../models');

const mobileModels = [
  models.User,
  models.Badge,
  models.Candidatura,
  models.Evidencia,
  models.HistoricoCandidatura,
  models.LearningPath,
  models.ServiceLine,
  models.Area,
  models.Level,
  models.Requirement,
  models.Consultant,
  models.ConsultorBadge,
  models.BadgePremium,
  models.ConsultorBadgePremium,
  models.ConsultorTimeline,
  models.RankingSnapshot,
  models.Notice,
  models.EmailSignature
];

async function modelSignature(model) {
  const attributes = model.rawAttributes || {};
  const dateField = attributes.updatedAt
    ? 'updatedAt'
    : attributes.createdAt
      ? 'createdAt'
      : null;

  const [count, latest] = await Promise.all([
    model.count(),
    dateField ? model.max(dateField) : Promise.resolve(null)
  ]);

  const result = {
    model: model.name,
    count,
    latest: latest instanceof Date ? latest.toISOString() : latest || null
  };

  if (model === models.Notice) {
    const [read, emailSent, pushSent, lastReadAt] = await Promise.all([
      model.count({ where: { read: true } }),
      model.count({ where: { emailSent: true } }),
      model.count({ where: { pushSent: true } }),
      model.max('readAt')
    ]);
    result.state = {
      read,
      emailSent,
      pushSent,
      lastReadAt: lastReadAt instanceof Date ? lastReadAt.toISOString() : lastReadAt || null
    };
  }

  return result;
}

async function getMobileDataVersion() {
  const signature = await Promise.all(mobileModels.map(modelSignature));
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(signature))
    .digest('hex');
}

module.exports = { getMobileDataVersion };
