const User = require('../models/User');

const DEFAULTS = { e: 1, a: 1, r: 1, n: 1, k: 0, s: 1, m: 0 };

const CAMPOS = {
  email: 'e',
  aprovado: 'a',
  rejeitado: 'r',
  novos: 'n',
  ranking: 'k',
  semanal: 's',
  mensal: 'm'
};

const parseRaw = (raw) => {
  try {
    const parsed = JSON.parse(raw || '');
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
};

const expandir = (flags) => {
  const prefs = {};
  for (const [nome, chave] of Object.entries(CAMPOS)) prefs[nome] = flags[chave] === 1;
  return prefs;
};

const getPrefs = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'notificationPreference'] });
  return expandir(parseRaw(user?.notificationPreference));
};

const savePrefs = async (userId, prefs = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Utilizador não encontrado.');

  const flags = parseRaw(user.notificationPreference);
  for (const [nome, chave] of Object.entries(CAMPOS)) {
    if (typeof prefs[nome] === 'boolean') flags[chave] = prefs[nome] ? 1 : 0;
  }

  user.notificationPreference = JSON.stringify(flags);
  await user.save();
  return expandir(flags);
};

const podeReceberEmail = async (userId, tipo = 'geral') => {
  try {
    const prefs = await getPrefs(userId);
    if (!prefs.email) return false;
    if (tipo === 'aprovado') return prefs.aprovado;
    if (tipo === 'rejeitado') return prefs.rejeitado;
    return true;
  } catch (erro) {
    console.error('Erro a ler preferências de notificação:', erro.message);
    return true;
  }
};

module.exports = { getPrefs, savePrefs, podeReceberEmail };
