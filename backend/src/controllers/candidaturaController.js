const { Op } = require('sequelize');
const { randomUUID } = require('crypto');
const {
  Candidatura,
  Evidencia,
  Badge,
  BadgeStatus,
  Consultant,
  User,
  HistoricoCandidatura,
  ConsultorBadge,
  Notice,
  Requirement,
  Level,
  Area
} = require('../models');
const { uploadFicheiro } = require('../services/cloudinary.service');
const {
  emailCandidaturaSubmetida,
  emailNovaSubmissao,
  emailEnviadoParaServiceLine,
  emailNovaValidacaoSLL,
  emailBadgeAprovado,
  emailBadgeRejeitado,
  emailSendBack
} = require('../services/email.service');
const {
  assertBadgeInServiceLineScope,
  getServiceLineScopeForUser,
  getBadgeIdsDaServiceLine
} = require('../services/serviceLineScope.service');
const { sendPushToUser } = require('../services/pushNotification.service');
const { notificarIntegracoes } = require('../services/webhookIntegration.service');
const { getSLAConfigForTeam } = require('../services/sla.service');

const STATUS = {
  OPEN: 'OPEN',
  SUBMITTED: 'SUBMITTED',
  IN_VALIDATION: 'IN_VALIDATION',
  VALIDATED: 'VALIDATED',
  IN_APPROVAL: 'IN_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const DIA_MS = 24 * 60 * 60 * 1000;

const slaAoEntrarNaFase = async (equipa, agora = new Date()) => {
  const config = await getSLAConfigForTeam(equipa).catch(() => null);
  if (!config) return { slaId: null, dataSlaLimite: null, slaExcedido: false };
  return {
    slaId: config.slaId ?? null,
    dataSlaLimite: new Date(agora.getTime() + config.responseDays * DIA_MS),
    slaExcedido: false
  };
};

const SLA_SEM_PRAZO_ATIVO = { dataSlaLimite: null };

const getStatus = async (code) => {
  const status = await BadgeStatus.findOne({ where: { code } });
  if (!status) {
    throw new Error(`Estado de candidatura não encontrado: ${code}`);
  }
  return status;
};

const getStatuses = async (codes) => {
  const statuses = await BadgeStatus.findAll({ where: { code: codes } });
  return statuses.reduce((acc, status) => {
    acc[status.code] = status;
    return acc;
  }, {});
};

const candidaturaInclude = [
  { model: Badge },
  { model: BadgeStatus, as: 'status' },
  { model: Evidencia, as: 'evidencias', include: [{ model: Requirement }] },
  { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] },
  {
    model: HistoricoCandidatura,
    as: 'history',
    include: [
      { model: User, as: 'responsavel', attributes: ['id', 'nome'] },
      { model: BadgeStatus, as: 'oldStatus', attributes: ['statusId', 'code', 'name'] },
      { model: BadgeStatus, as: 'newStatus', attributes: ['statusId', 'code', 'name'] }
    ]
  }
];

const candidaturaIncludeMinimo = [
  { model: Badge },
  { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
];
const candidaturaIncludeTalentManager = [
  ...candidaturaIncludeMinimo,
  { model: Evidencia, as: 'evidencias' }
];

const sendEmail = async (fn, ...args) => {
  try {
    await fn(...args);
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
  }
};

const createNotice = async (userId, title, message, type = 'info') => {
  if (!userId) return null;
  try {
    const notice = await Notice.create({ userId, title, message, type, read: false });
    sendPushToUser(userId, { title, body: message, type }).catch((error) =>
      console.error('Erro ao enviar push:', error.message)
    );
    notificarIntegracoes(userId, { title, message }).catch((error) =>
      console.error('Erro ao notificar integrações:', error.message)
    );
    return notice;
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
    return null;
  }
};

const getServiceLineLeadersDaBadge = async (badgeId) => {
  const badge = await Badge.findByPk(badgeId, {
    include: [{ model: Level, include: [{ model: Area }] }]
  });
  const serviceLineId = badge?.Level?.Area?.serviceLineId;
  if (!serviceLineId) return [];

  return User.findAll({
    include: [
      {
        association: User.associations.ServiceLineLeader,
        required: true,
        where: { serviceLineId }
      }
    ]
  }).catch(() => []);
};

const calcularExpiracao = (badge) => {
  if (badge.expiracao) {
    return badge.expiracao;
  }

  if (!badge.duracaoMeses) {
    return null;
  }

  const data = new Date();
  data.setMonth(data.getMonth() + badge.duracaoMeses);
  return data;
};

exports.submeterCandidatura = async (req, res) => {
  try {
    const { badgeId, requisitoIds = [], descricao } = req.body;
    const rascunho = String(req.body.rascunho) === 'true';
    const consultorId = req.user.id;
    const ficheiros = req.files || [];

    const badge = await Badge.findByPk(badgeId);
    if (!badge || badge.ativo === false) {
      return res.status(404).json({ erro: 'Badge não encontrada ou inativa.' });
    }

    const consultant = await Consultant.findByPk(consultorId);
    if (!consultant) {
      return res.status(403).json({ erro: 'Apenas consultores podem submeter candidaturas.' });
    }

    const jaConquistada = await ConsultorBadge.findOne({
      where: { consultorId, badgeId, valid: true }
    });
    if (jaConquistada) {
      return res.status(400).json({ erro: 'Já conquistaste este badge.' });
    }

    const statuses = await getStatuses([STATUS.OPEN, STATUS.SUBMITTED, STATUS.IN_VALIDATION, STATUS.VALIDATED, STATUS.IN_APPROVAL]);
    const openId = statuses[STATUS.OPEN].statusId;
    const submitted = statuses[STATUS.SUBMITTED] || await getStatus(STATUS.SUBMITTED);
    const submittedId = submitted.statusId;

    const editableIds = [openId, submittedId];
    const bloqueada = await Candidatura.findOne({
      where: {
        consultorId,
        badgeId,
        estadoId: { [Op.in]: Object.values(statuses).map((s) => s.statusId).filter((id) => !editableIds.includes(id)) }
      }
    });
    if (bloqueada) {
      return res.status(400).json({ erro: 'Esta candidatura já está em validação e não pode ser alterada.' });
    }

    let candidatura = await Candidatura.findOne({
      where: { consultorId, badgeId, estadoId: { [Op.in]: editableIds } }
    });
    const jaSubmetida = Boolean(candidatura) && candidatura.estadoId === submittedId;

    const idsRequisitos = (Array.isArray(requisitoIds) ? requisitoIds : [requisitoIds])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));
    if (idsRequisitos.length !== ficheiros.length) {
      return res.status(400).json({ erro: 'Cada evidência tem de estar associada a um requisito.' });
    }

    const requisitosDoNivel = await Requirement.findAll({
      where: { nivelId: badge.nivelId, deletedAt: null },
      attributes: ['id', 'obrigatorio']
    });
    const idsValidos = new Set(requisitosDoNivel.map((r) => r.id));
    if (idsRequisitos.some((id) => !idsValidos.has(id))) {
      return res.status(400).json({ erro: 'Uma das evidências está associada a um requisito que não pertence a este badge.' });
    }

    const evidenciasExistentes = candidatura
      ? await Evidencia.findAll({ where: { candidaturaId: candidatura.id }, attributes: ['id', 'requisitoId'] })
      : [];
    const requisitosCobertos = new Set(evidenciasExistentes.map((e) => e.requisitoId));
    idsRequisitos.forEach((id) => requisitosCobertos.add(id));

    if (jaSubmetida && ficheiros.length === 0) {
      return res.status(400).json({ erro: 'Anexa pelo menos uma evidência para adicionar.' });
    }

    if (requisitosCobertos.size === 0) {
      return res.status(400).json({ erro: 'Tens de anexar pelo menos uma evidência.' });
    }

    if (!rascunho && !jaSubmetida) {
      const obrigatoriosEmFalta = requisitosDoNivel.filter(
        (r) => r.obrigatorio !== false && !requisitosCobertos.has(r.id)
      );
      if (obrigatoriosEmFalta.length > 0) {
        return res.status(400).json({
          erro: 'Tens de submeter evidência para todos os requisitos obrigatórios deste badge.',
          requisitosEmFalta: obrigatoriosEmFalta.map((r) => r.id)
        });
      }
    }

    if (!candidatura) {
      candidatura = await Candidatura.create({
        consultorId,
        badgeId,
        estadoId: openId,
        dataSubmicao: new Date()
      });
    }

    await Promise.all(
      ficheiros.map(async (ficheiro, index) => {
        const url = await uploadFicheiro(ficheiro);
        return Evidencia.create({
          url,
          nomeFicheiro: ficheiro.originalname,
          tipo: ficheiro.mimetype === 'application/pdf' ? 'PDF' : 'IMAGEM',
          candidaturaId: candidatura.id,
          requisitoId: idsRequisitos[index],
          descricao,
          uploadedBy: consultorId
        });
      })
    );

    if (jaSubmetida) {
      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        userId: consultorId,
        estadoAnterior: submittedId,
        estadoNovo: submittedId,
        motivo: 'Evidências adicionadas'
      });
      return res.status(200).json({ mensagem: 'Evidências adicionadas.', candidaturaId: candidatura.id, estado: STATUS.SUBMITTED });
    }

    if (rascunho) {
      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        userId: consultorId,
        estadoAnterior: openId,
        estadoNovo: openId,
        motivo: 'Rascunho guardado'
      });
      return res.status(200).json({ mensagem: 'Rascunho guardado.', candidaturaId: candidatura.id, estado: STATUS.OPEN });
    }

    const agoraSubmissao = new Date();
    await candidatura.update({
      estadoId: submittedId,
      dataSubmicao: agoraSubmissao,
      ...(await slaAoEntrarNaFase('talent', agoraSubmissao))
    });
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: consultorId,
      estadoAnterior: openId,
      estadoNovo: submittedId,
      motivo: 'Candidatura submetida'
    });

    res.status(201).json({
      mensagem: 'Candidatura submetida com sucesso.',
      candidaturaId: candidatura.id
    });

    (async () => {
      try {
        const consultor = await User.findByPk(consultorId);
        if (!consultor) return;
        await sendEmail(emailCandidaturaSubmetida, consultor, badge);

        const talentManagers = await User.findAll({
          include: [{ association: User.associations.TalentManager, required: true }]
        }).catch(() => []);
        await Promise.all(talentManagers.map((tm) => sendEmail(emailNovaSubmissao, tm, consultor, badge)));
      } catch (erroEmail) {
        console.error('Erro ao enviar notificações de submissão:', erroEmail.message);
      }
    })();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao submeter candidatura.' });
  }
};

exports.listarMinhasCandidaturas = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      where: { consultorId: req.user.id },
      include: candidaturaInclude,
      order: [['createdAt', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas.' });
  }
};

exports.getRascunho = async (req, res) => {
  try {
    const consultorId = req.user.id;
    const { badgeId } = req.query;
    if (!badgeId) return res.json(null);

    const [open, submitted] = await Promise.all([getStatus(STATUS.OPEN), getStatus(STATUS.SUBMITTED)]);
    const candidatura = await Candidatura.findOne({
      where: { consultorId, badgeId, estadoId: { [Op.in]: [open.statusId, submitted.statusId] } },
      include: [{ model: Evidencia, as: 'evidencias' }]
    });
    if (!candidatura) return res.json(null);

    res.json({
      id: candidatura.id,
      estado: candidatura.estadoId === submitted.statusId ? STATUS.SUBMITTED : STATUS.OPEN,
      evidencias: (candidatura.evidencias || []).map((e) => ({
        id: e.id,
        requisitoId: e.requisitoId,
        nomeFicheiro: e.nomeFicheiro,
        url: e.url
      }))
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao obter rascunho.' });
  }
};

exports.apagarEvidencia = async (req, res) => {
  try {
    const consultorId = req.user.id;
    const evidencia = await Evidencia.findByPk(req.params.id, {
      include: [{ model: Candidatura, attributes: ['id', 'consultorId', 'estadoId'] }]
    });
    if (!evidencia || evidencia.Candidatura?.consultorId !== consultorId) {
      return res.status(404).json({ erro: 'Evidência não encontrada.' });
    }

    const [open, submitted] = await Promise.all([getStatus(STATUS.OPEN), getStatus(STATUS.SUBMITTED)]);
    if (![open.statusId, submitted.statusId].includes(evidencia.Candidatura.estadoId)) {
      return res.status(400).json({ erro: 'Esta candidatura já está em validação e não pode ser alterada.' });
    }

    await evidencia.destroy();
    res.json({ mensagem: 'Evidência removida.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover evidência.' });
  }
};

exports.detalhesCandidatura = async (req, res) => {
  try {
    const candidatura = await Candidatura.findByPk(req.params.id, {
      include: candidaturaInclude
    });

    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada.' });
    }

    const isOwner = candidatura.consultorId === req.user.id;
    const canReview = req.user.roles.some((role) => ['Admin', 'TalentManager', 'ServiceLineLeader'].includes(role));
    if (!isOwner && !canReview) {
      return res.status(403).json({ erro: 'Sem permissões para consultar esta candidatura.' });
    }
    await assertBadgeInServiceLineScope(req.user, candidatura.badgeId);

    const historico = await HistoricoCandidatura.findAll({
      where: { candidaturaId: candidatura.id },
      include: [
        { model: User, as: 'responsavel', attributes: ['id', 'nome'] },
        { model: BadgeStatus, as: 'oldStatus', attributes: ['code', 'name'] },
        { model: BadgeStatus, as: 'newStatus', attributes: ['code', 'name'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const timeline = historico.map((h) => ({
      id: h.id,
      data: h.createdAt,
      motivo: h.motivo || '',
      responsavel: h.responsavel?.nome || null,
      responsavelId: h.responsavel?.id || null,
      estadoAnteriorCode: h.oldStatus?.code || null,
      estadoAnterior: h.oldStatus?.name || h.oldStatus?.code || null,
      estadoNovoCode: h.newStatus?.code || null,
      estadoNovo: h.newStatus?.name || h.newStatus?.code || null
    }));

    res.json({ ...candidatura.toJSON(), timeline });
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao buscar candidatura.' : erro.message });
  }
};

exports.listarCandidaturasPorConsultor = async (req, res) => {
  try {
    const consultorId = Number(req.params.id);
    const isOwner = consultorId === req.user.id;
    const canReview = req.user.roles.some((role) => ['Admin', 'TalentManager', 'ServiceLineLeader'].includes(role));
    if (!isOwner && !canReview) {
      return res.status(403).json({ erro: 'Sem permissões para consultar candidaturas deste consultor.' });
    }

    const where = { consultorId };
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    if (serviceLineId) {
      const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
      where.badgeId = { [Op.in]: badgeIds.length ? badgeIds : [-1] };
    }

    const candidaturas = await Candidatura.findAll({
      where,
      include: candidaturaInclude,
      order: [['dataSubmicao', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao listar candidaturas do consultor.' : erro.message });
  }
};

exports.getFechadasPorSemana = async (req, res) => {
  try {
    const statuses = await getStatuses([STATUS.APPROVED, STATUS.REJECTED]);
    const idsFechados = Object.values(statuses).map((s) => s.statusId);

    const fim = new Date();
    fim.setHours(0, 0, 0, 0);
    fim.setDate(fim.getDate() + 1);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 7);

    const whereLogs = {
      estadoNovo: { [Op.in]: idsFechados.length ? idsFechados : [-1] },
      createdAt: { [Op.gte]: inicio, [Op.lt]: fim }
    };
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    if (serviceLineId) {
      const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
      const candidaturas = await Candidatura.findAll({
        where: { badgeId: { [Op.in]: badgeIds.length ? badgeIds : [-1] } },
        attributes: ['id']
      });
      whereLogs.candidaturaId = { [Op.in]: candidaturas.map((row) => row.id).length ? candidaturas.map((row) => row.id) : [-1] };
    }

    const logs = await HistoricoCandidatura.findAll({
      where: {
        ...whereLogs
      },
      attributes: ['createdAt']
    });

    const contagem = [0, 0, 0, 0, 0, 0, 0];
    logs.forEach((log) => {
      const dias = Math.floor((new Date(log.createdAt) - inicio) / 86400000);
      if (dias >= 0 && dias < 7) contagem[dias] += 1;
    });

    res.json(contagem);
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao calcular candidaturas fechadas.' : erro.message });
  }
};

exports.getBadgesAtribuidosPorSemana = async (req, res) => {
  try {
    const fim = new Date();
    fim.setHours(0, 0, 0, 0);
    fim.setDate(fim.getDate() + 1);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 7);

    const where = { obtainedDate: { [Op.gte]: inicio, [Op.lt]: fim } };
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    if (serviceLineId) {
      const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
      where.badgeId = { [Op.in]: badgeIds.length ? badgeIds : [-1] };
    }

    const awards = await ConsultorBadge.findAll({ where, attributes: ['obtainedDate'] });

    const contagem = [0, 0, 0, 0, 0, 0, 0];
    awards.forEach((award) => {
      const dias = Math.floor((new Date(award.obtainedDate) - inicio) / 86400000);
      if (dias >= 0 && dias < 7) contagem[dias] += 1;
    });

    res.json(contagem);
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao calcular badges atribuídos.' : erro.message });
  }
};

exports.listarCandidaturasTalent = async (_req, res) => {
  try {
    const submitted = await getStatus(STATUS.SUBMITTED);
    const candidaturas = await Candidatura.findAll({
      where: { estadoId: submitted.statusId },
      include: candidaturaInclude,
      order: [['createdAt', 'ASC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao listar candidaturas.' : erro.message });
  }
};

exports.listarTodasCandidaturas = async (_req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      include: candidaturaInclude,
      order: [['createdAt', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro ao listar candidaturas.' : erro.message });
  }
};

exports.validarEvidencia = async (req, res) => {
  try {
    const { validado } = req.body;
    if (typeof validado !== 'boolean') {
      return res.status(400).json({ erro: 'Campo "validado" é obrigatório e deve ser um booleano.' });
    }

    const evidencia = await Evidencia.findByPk(req.params.id);
    if (!evidencia) {
      return res.status(404).json({ erro: 'Evidência não encontrada.' });
    }

    await evidencia.update({
      validado,
      validadoPor: req.user.id,
      validadoEm: new Date()
    });

    res.json({ mensagem: 'Evidência atualizada.', evidencia });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao validar evidência.' });
  }
};

exports.validarTalentManager = async (req, res) => {
  try {
    const { decisao, comentario } = req.body;
    const candidatura = await Candidatura.findByPk(req.params.id, { include: candidaturaIncludeTalentManager });
    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada.' });
    }

    const statuses = await getStatuses([STATUS.SUBMITTED, STATUS.VALIDATED, STATUS.REJECTED, STATUS.OPEN]);
    if (candidatura.estadoId !== statuses[STATUS.SUBMITTED].statusId) {
      return res.status(400).json({ erro: 'Candidatura não está submetida.' });
    }

    if (['REJEITAR', 'SEND_BACK'].includes(decisao) && !String(comentario || '').trim()) {
      return res.status(400).json({ erro: 'É obrigatório indicar um comentário para rejeitar ou devolver a candidatura.' });
    }

    let nextStatus;
    if (decisao === 'APROVAR') nextStatus = statuses[STATUS.VALIDATED];
    else if (decisao === 'REJEITAR') nextStatus = statuses[STATUS.REJECTED];
    else if (decisao === 'SEND_BACK') nextStatus = statuses[STATUS.OPEN];
    if (!nextStatus) {
      return res.status(400).json({ erro: 'Decisão inválida. Use APROVAR, REJEITAR ou SEND_BACK.' });
    }

    if (decisao === 'APROVAR') {
      const evidencias = candidatura.evidencias || [];
      const faltaValidar = evidencias.some((e) => e.validado !== true);
      if (evidencias.length === 0 || faltaValidar) {
        return res.status(400).json({ erro: 'Tens de validar todas as evidências antes de aprovar a candidatura.' });
      }
    }

    const agoraValidacao = new Date();
    await candidatura.update({
      estadoId: nextStatus.statusId,
      talentManagerId: req.user.roles.includes('TalentManager') ? req.user.id : null,
      dataValidacao: agoraValidacao,
      comentario,
      ...(decisao === 'APROVAR'
        ? await slaAoEntrarNaFase('serviceline', agoraValidacao)
        : SLA_SEM_PRAZO_ATIVO)
    });

    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: req.user.id,
      estadoAnterior: statuses[STATUS.SUBMITTED].statusId,
      estadoNovo: nextStatus.statusId,
      motivo: comentario || decisao
    });

    const consultor = candidatura.Consultant?.User;
    if (decisao === 'APROVAR') {
      res.json({ mensagem: 'Candidatura validada e enviada para aprovação final.' });
      sendEmail(emailEnviadoParaServiceLine, consultor, candidatura.Badge);

      (async () => {
        try {
          const serviceLineLeaders = await getServiceLineLeadersDaBadge(candidatura.badgeId);
          await Promise.all(serviceLineLeaders.map((sll) => createNotice(
            sll.id,
            'Badge pronta para aprovação final',
            `${consultor?.nome || 'Um consultor'} aguarda a decisão final para ${candidatura.Badge?.nome || 'uma badge'}.`,
            'warning'
          )));
          await Promise.all(
            serviceLineLeaders.map((sll) => sendEmail(emailNovaValidacaoSLL, sll, consultor, candidatura.Badge))
          );
        } catch (erroEmail) {
          console.error('Erro ao notificar Service Line Leaders:', erroEmail.message);
        }
      })();
      return;
    }

    if (decisao === 'SEND_BACK') {
      res.json({ mensagem: 'Candidatura devolvida ao consultor para retificação.' });
      createNotice(
        candidatura.consultorId,
        'Candidatura devolvida para retificação',
        `${candidatura.Badge?.nome || 'Badge'}: ${comentario}`,
        'warning'
      );
      sendEmail(emailSendBack, consultor, candidatura.Badge, comentario);
      return;
    }

    res.json({ mensagem: 'Candidatura rejeitada pelo Talent Manager.' });
    createNotice(
      candidatura.consultorId,
      'Candidatura rejeitada pelo Talent Manager',
      `${candidatura.Badge?.nome || 'Badge'}: ${comentario || 'Consulta o processo para mais detalhes.'}`,
      'error'
    );
    sendEmail(emailBadgeRejeitado, consultor, candidatura.Badge, comentario);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao validar candidatura.' });
  }
};

exports.listarCandidaturasServiceLine = async (req, res) => {
  try {
    const validated = await getStatus(STATUS.VALIDATED);
    const where = { estadoId: validated.statusId };

    const serviceLineId = await getServiceLineScopeForUser(req.user);
    if (serviceLineId) {
      const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
      where.badgeId = { [Op.in]: badgeIds.length ? badgeIds : [-1] };
    }

    const candidaturas = await Candidatura.findAll({
      where,
      include: candidaturaInclude,
      order: [['createdAt', 'ASC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas.' });
  }
};

exports.listarTodasCandidaturasServiceLine = async (req, res) => {
  try {
    const where = {};
    const serviceLineId = await getServiceLineScopeForUser(req.user);
    if (serviceLineId) {
      const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
      where.badgeId = { [Op.in]: badgeIds.length ? badgeIds : [-1] };
    }

    const candidaturas = await Candidatura.findAll({
      where,
      include: candidaturaInclude,
      order: [['createdAt', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas.' });
  }
};

exports.validarServiceLine = async (req, res) => {
  try {
    const { decisao, comentario } = req.body;
    const candidatura = await Candidatura.findByPk(req.params.id, { include: candidaturaIncludeMinimo });
    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada.' });
    }

    await assertBadgeInServiceLineScope(req.user, candidatura.badgeId);

    if (['REJEITAR', 'SEND_BACK'].includes(decisao) && !String(comentario || '').trim()) {
      return res.status(400).json({ erro: 'É obrigatório indicar um comentário para rejeitar ou devolver a candidatura.' });
    }

    const statuses = await getStatuses([STATUS.VALIDATED, STATUS.APPROVED, STATUS.REJECTED, STATUS.OPEN]);
    if (candidatura.estadoId !== statuses[STATUS.VALIDATED].statusId) {
      return res.status(400).json({ erro: 'Candidatura não está validada.' });
    }

    let nextStatus;
    if (decisao === 'APROVAR') nextStatus = statuses[STATUS.APPROVED];
    if (decisao === 'REJEITAR') nextStatus = statuses[STATUS.REJECTED];
    if (decisao === 'SEND_BACK') nextStatus = statuses[STATUS.OPEN];
    if (!nextStatus) {
      return res.status(400).json({ erro: 'Decisão inválida. Use APROVAR, REJEITAR ou SEND_BACK.' });
    }

    await candidatura.update({
      estadoId: nextStatus.statusId,
      serviceLineLeaderId: req.user.roles.includes('ServiceLineLeader') ? req.user.id : null,
      dataAprovacao: decisao === 'APROVAR' ? new Date() : null,
      comentario,
      ...SLA_SEM_PRAZO_ATIVO
    });

    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: req.user.id,
      estadoAnterior: statuses[STATUS.VALIDATED].statusId,
      estadoNovo: nextStatus.statusId,
      motivo: comentario || decisao
    });

    const consultor = candidatura.Consultant?.User;
    if (decisao === 'APROVAR') {
      const expirationDate = calcularExpiracao(candidatura.Badge);
      const existingAward = await ConsultorBadge.findOne({
        where: { consultorId: candidatura.consultorId, badgeId: candidatura.badgeId }
      });
      const publicToken = existingAward?.publicToken || randomUUID();
      await ConsultorBadge.upsert({
        consultorId: candidatura.consultorId,
        badgeId: candidatura.badgeId,
        obtainedDate: new Date(),
        expirationDate,
        durationMonths: candidatura.Badge.duracaoMeses,
        valid: true,
        pointsObtained: candidatura.Badge.ponto,
        publicToken
      });
      res.json({ mensagem: 'Badge aprovada e atribuída ao consultor.' });
      createNotice(
        candidatura.consultorId,
        'Badge aprovada',
        `A badge ${candidatura.Badge?.nome || ''} foi aprovada e atribuída ao teu perfil.`,
        'success'
      );
      sendEmail(emailBadgeAprovado, consultor, candidatura.Badge, publicToken);
      return;
    }

    if (decisao === 'SEND_BACK') {
      res.json({ mensagem: 'Candidatura devolvida ao consultor.' });
      createNotice(
        candidatura.consultorId,
        'Candidatura devolvida para correção',
        `${candidatura.Badge?.nome || 'Badge'}: ${comentario}`,
        'warning'
      );
      sendEmail(emailSendBack, consultor, candidatura.Badge, comentario);
      return;
    }

    res.json({ mensagem: 'Candidatura rejeitada.' });
    createNotice(
      candidatura.consultorId,
      'Candidatura rejeitada',
      `${candidatura.Badge?.nome || 'Badge'}: ${comentario}`,
      'error'
    );
    sendEmail(emailBadgeRejeitado, consultor, candidatura.Badge, comentario);
  } catch (erro) {
    console.error(erro);
    const status = erro.statusCode || 500;
    res.status(status).json({ erro: status >= 500 ? 'Erro na aprovação final.' : erro.message });
  }
};
