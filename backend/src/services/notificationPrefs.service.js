const User = require('../models/User');

// =============================================================
// Preferências de notificação por email, POR UTILIZADOR.
//
// Guardadas em User.notificationPreference (STRING(50) já existente na BD,
// sem alterações de esquema) como JSON compacto de flags 0/1:
//   {"e":1,"a":1,"r":1,"n":1,"k":0,"s":1,"m":0}
//     e = email (interruptor geral)   a = badge aprovado
//     r = rejeitado/devolvido         n = novos badges
//     k = ranking                     s = resumo semanal
//     m = relatório mensal
// "n", "k", "s" e "m" são guardados para o ecrã de preferências, mas ainda
// não têm envio implementado no backend.
// =============================================================

const DEFAULTS = { e: 1, a: 1, r: 1, n: 1, k: 0, s: 1, m: 0 };

// Nomes expostos na API <-> chave compacta na BD
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
    // valor vazio ou formato antigo/desconhecido -> tudo por omissão
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

  user.notificationPreference = JSON.stringify(flags); // ~33 chars, cabe nos 50
  await user.save();
  return expandir(flags);
};

// Usado pelo workflow antes de enviar email ao consultor.
//   tipo: 'geral' (só interruptor geral) | 'aprovado' | 'rejeitado'
// Em caso de erro devolve true — uma falha na leitura das preferências
// nunca deve suprimir um email.
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
