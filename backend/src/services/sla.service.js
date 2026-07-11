const { Op } = require('sequelize');
const {
  Candidatura,
  Badge,
  BadgeStatus,
  Consultant,
  User,
  Level,
  Area,
  SLAConfig,
  Notice
} = require('../models');
const { emailAlertaSLA } = require('./email.service');

// =============================================================
// Verificação de SLA (guião: emails automáticos quando o SLA é ultrapassado).
//
// - Candidaturas SUBMITTED há mais de `responseDays` -> alerta aos Talent Managers
// - Candidaturas VALIDATED há mais de `responseDays` -> alerta aos SLL da Service Line
//
// Deduplicação: antes de enviar, é criado um aviso in-app (tabela AVISOS)
// com título "SLA" para o destinatário; se já existir um aviso desses criado
// hoje, não volta a enviar — correr o job várias vezes no mesmo dia não spamma.
// =============================================================

const RESPONSE_DAYS_DEFAULT = 5;

const getSLAConfig = async () => {
  const config = await SLAConfig.findOne({
    where: { active: true },
    order: [['createdAt', 'DESC']]
  });
  return { responseDays: config?.responseDays ?? RESPONSE_DAYS_DEFAULT };
};

const diasDesde = (data) => Math.floor((Date.now() - new Date(data).getTime()) / (24 * 60 * 60 * 1000));

const inicioDeHoje = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Envia o alerta a um utilizador se ainda não recebeu nenhum hoje.
// Devolve true se enviou.
const alertarUser = async (user, atrasadas, responseDays) => {
  const jaAvisadoHoje = await Notice.findOne({
    where: { userId: user.id, title: { [Op.like]: 'SLA%' }, createdAt: { [Op.gte]: inicioDeHoje() } }
  });
  if (jaAvisadoHoje) return false;

  let emailSent = false;
  try {
    await emailAlertaSLA(user, atrasadas, responseDays);
    emailSent = true;
  } catch (erro) {
    console.error(`Erro ao enviar alerta SLA a ${user.email}:`, erro.message);
  }

  // O aviso in-app é criado mesmo que o email falhe: serve de registo e
  // impede reenvios em ciclo no mesmo dia.
  await Notice.create({
    userId: user.id,
    title: `SLA ultrapassado: ${atrasadas.length} candidatura(s) em atraso`,
    message: atrasadas.map((c) => `${c.badgeNome} — ${c.consultorNome} (${c.diasEmEspera} dias)`).join('\n'),
    type: 'warning',
    emailSent
  });
  return emailSent;
};

const resumoCandidatura = (candidatura, dataReferencia) => ({
  badgeNome: candidatura.Badge?.nome || `Badge #${candidatura.badgeId}`,
  consultorNome: candidatura.Consultant?.User?.nome || `Consultor #${candidatura.consultorId}`,
  diasEmEspera: diasDesde(dataReferencia),
  serviceLineId: candidatura.Badge?.Level?.Area?.serviceLineId || null
});

const candidaturaIncludeSLA = [
  { model: Badge, include: [{ model: Level, include: [{ model: Area }] }] },
  { model: Consultant, include: [{ model: User, attributes: ['id', 'nome'] }] }
];

// Corre a verificação completa. Devolve um resumo (usado pelo endpoint).
const verificarSLA = async () => {
  const { responseDays } = await getSLAConfig();
  const limite = new Date(Date.now() - responseDays * 24 * 60 * 60 * 1000);

  const statuses = await BadgeStatus.findAll({ where: { code: ['SUBMITTED', 'VALIDATED'] } });
  const porCodigo = Object.fromEntries(statuses.map((s) => [s.code, s.statusId]));

  // --- Talent Managers: SUBMITTED em atraso (globais, o TM vê tudo) ---
  const submetidasAtrasadas = await Candidatura.findAll({
    where: { estadoId: porCodigo.SUBMITTED, createdAt: { [Op.lt]: limite } },
    include: candidaturaIncludeSLA
  });
  const atrasadasTM = submetidasAtrasadas.map((c) => resumoCandidatura(c, c.createdAt));

  let emailsEnviados = 0;
  if (atrasadasTM.length > 0) {
    const talentManagers = await User.findAll({
      include: [{ association: User.associations.TalentManager, required: true }]
    });
    for (const tm of talentManagers) {
      if (await alertarUser(tm, atrasadasTM, responseDays)) emailsEnviados++;
    }
  }

  // --- Service Line Leaders: VALIDATED em atraso, filtradas pela sua SL ---
  const validadasAtrasadas = await Candidatura.findAll({
    where: { estadoId: porCodigo.VALIDATED, dataValidacao: { [Op.lt]: limite } },
    include: candidaturaIncludeSLA
  });
  const atrasadasSLL = validadasAtrasadas.map((c) => resumoCandidatura(c, c.dataValidacao));

  if (atrasadasSLL.length > 0) {
    const serviceLineIds = [...new Set(atrasadasSLL.map((c) => c.serviceLineId).filter(Boolean))];
    const leaders = await User.findAll({
      include: [{
        association: User.associations.ServiceLineLeader,
        required: true,
        where: { serviceLineId: serviceLineIds }
      }]
    });
    for (const sll of leaders) {
      const daSuaLinha = atrasadasSLL.filter(
        (c) => c.serviceLineId === sll.ServiceLineLeader?.serviceLineId
      );
      if (daSuaLinha.length > 0 && (await alertarUser(sll, daSuaLinha, responseDays))) emailsEnviados++;
    }
  }

  const resumo = {
    responseDays,
    pendentesTalentManager: atrasadasTM.length,
    pendentesServiceLine: atrasadasSLL.length,
    emailsEnviados
  };
  console.log('🕒 Verificação de SLA:', resumo);
  return resumo;
};

// Job periódico: corre pouco depois do arranque e depois a cada 12 horas.
// (Nota: no Render free o serviço adormece sem tráfego; para garantir a
// verificação diária, aponta um cron externo ao endpoint /api/sla-check.)
const iniciarJobSLA = () => {
  if (process.env.DISABLE_SLA_JOB === 'true') return;
  const executar = () => verificarSLA().catch((erro) => console.error('Erro na verificação de SLA:', erro.message));
  setTimeout(executar, 60 * 1000);
  setInterval(executar, 12 * 60 * 60 * 1000);
};

module.exports = { verificarSLA, iniciarJobSLA };
