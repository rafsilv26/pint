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
const { sendPushToUser } = require('./pushNotification.service');

const RESPONSE_DAYS_DEFAULT = 5;

const getSLAConfigForTeam = async (team) => {
  const configs = await SLAConfig.findAll({
    where: { active: true },
    order: [['createdAt', 'DESC']]
  });
  const daEquipa = configs.find((c) => c.team === team);
  const global = configs.find((c) => !c.team);
  const escolhida = daEquipa || global;
  return {
    slaId: escolhida?.slaId ?? null,
    responseDays: escolhida?.responseDays ?? RESPONSE_DAYS_DEFAULT,
    alertDaysBeforeExpiration: escolhida?.alertDaysBeforeExpiration ?? null
  };
};

const getSLAConfig = async () => {
  const [talent, serviceline] = await Promise.all([
    getSLAConfigForTeam('talent'),
    getSLAConfigForTeam('serviceline')
  ]);
  return { talent, serviceline };
};

const diasDesde = (data) => Math.floor((Date.now() - new Date(data).getTime()) / (24 * 60 * 60 * 1000));

const inicioDeHoje = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

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

  const pushTitle = `SLA ultrapassado: ${atrasadas.length} candidatura(s) em atraso`;
  const pushMessage = atrasadas.map((c) => `${c.badgeNome} — ${c.consultorNome} (${c.diasEmEspera} dias)`).join('\n');
  await Notice.create({
    userId: user.id,
    title: pushTitle,
    message: pushMessage,
    type: 'warning',
    emailSent
  });
  await sendPushToUser(user.id, {
    title: pushTitle,
    body: pushMessage,
    type: 'sla',
    action: 'fetch_api'
  }).catch((erro) => console.error('Erro ao enviar push SLA:', erro.message));
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

const marcarSlaExcedido = async (candidaturas) => {
  const ids = candidaturas.filter((c) => !c.slaExcedido).map((c) => c.id);
  if (ids.length === 0) return;
  await Candidatura.update({ slaExcedido: true, updatedAt: new Date() }, { where: { id: ids } });
};

const verificarSLA = async () => {
  const { talent, serviceline } = await getSLAConfig();
  const limiteTalent = new Date(Date.now() - talent.responseDays * 24 * 60 * 60 * 1000);
  const limiteServiceLine = new Date(Date.now() - serviceline.responseDays * 24 * 60 * 60 * 1000);

  const statuses = await BadgeStatus.findAll({ where: { code: ['SUBMITTED', 'VALIDATED'] } });
  const porCodigo = Object.fromEntries(statuses.map((s) => [s.code, s.statusId]));

  const submetidasAtrasadas = await Candidatura.findAll({
    where: { estadoId: porCodigo.SUBMITTED, createdAt: { [Op.lt]: limiteTalent } },
    include: candidaturaIncludeSLA
  });
  await marcarSlaExcedido(submetidasAtrasadas);
  const atrasadasTM = submetidasAtrasadas.map((c) => resumoCandidatura(c, c.createdAt));

  let emailsEnviados = 0;
  if (atrasadasTM.length > 0) {
    const talentManagers = await User.findAll({
      include: [{ association: User.associations.TalentManager, required: true }]
    });
    for (const tm of talentManagers) {
      if (await alertarUser(tm, atrasadasTM, talent.responseDays)) emailsEnviados++;
    }
  }

  const validadasAtrasadas = await Candidatura.findAll({
    where: { estadoId: porCodigo.VALIDATED, dataValidacao: { [Op.lt]: limiteServiceLine } },
    include: candidaturaIncludeSLA
  });
  await marcarSlaExcedido(validadasAtrasadas);
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
      if (daSuaLinha.length > 0 && (await alertarUser(sll, daSuaLinha, serviceline.responseDays))) emailsEnviados++;
    }
  }

  const resumo = {
    responseDays: talent.responseDays,
    responseDaysTalent: talent.responseDays,
    responseDaysServiceLine: serviceline.responseDays,
    pendentesTalentManager: atrasadasTM.length,
    pendentesServiceLine: atrasadasSLL.length,
    emailsEnviados
  };
  console.log('🕒 Verificação de SLA:', resumo);
  return resumo;
};

const iniciarJobSLA = () => {
  if (process.env.DISABLE_SLA_JOB === 'true') return;
  const executar = () => verificarSLA().catch((erro) => console.error('Erro na verificação de SLA:', erro.message));
  setTimeout(executar, 60 * 1000);
  setInterval(executar, 12 * 60 * 60 * 1000);
};

module.exports = { verificarSLA, iniciarJobSLA, getSLAConfigForTeam };
