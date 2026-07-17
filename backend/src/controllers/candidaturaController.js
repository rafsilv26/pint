const { Op } = require('sequelize');
const { randomUUID } = require('crypto');
const sequelize = require('../config/database');
const {
  Candidatura,
  CandidaturaSubmission,
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
const {
  normalizeClientSubmissionId,
  normalizeBadgeId,
  resolveClientEvidenceIds,
  withClientSubmissionTransaction,
  getPendingEvidenceUploads
} = require('../services/candidaturaIdempotency.service');

const STATUS = {
  OPEN: 'OPEN',
  SUBMITTED: 'SUBMITTED',
  IN_VALIDATION: 'IN_VALIDATION',
  VALIDATED: 'VALIDATED',
  IN_APPROVAL: 'IN_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

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
  {
    model: Evidencia,
    as: 'evidencias',
    attributes: { exclude: ['clientEvidenceId'] },
    include: [{ model: Requirement }]
  },
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

// Includes reduzidos para os endpoints de decisão (validar/aprovar/rejeitar):
// não precisam do histórico nem do requisito aninhado em cada evidência,
// o que torna o pedido mais rápido a responder.
const candidaturaIncludeMinimo = [
  { model: Badge },
  { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
];
const candidaturaIncludeTalentManager = [
  ...candidaturaIncludeMinimo,
  {
    model: Evidencia,
    as: 'evidencias',
    attributes: { exclude: ['clientEvidenceId'] }
  }
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
    // Empurra também para integrações externas (Teams/Slack) do utilizador.
    notificarIntegracoes(userId, { title, message }).catch((error) =>
      console.error('Erro ao notificar integrações:', error.message)
    );
    return notice;
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
    return null;
  }
};

// Encontra os Service Line Leaders responsáveis pela service line de uma
// badge (Badge -> Level -> Area -> serviceLineId), para notificar apenas
// quem realmente trata daquela área — o TM vê tudo, mas o SLL é "da área"
// (conforme o guião do projeto).
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

const submissionError = (statusCode, message, extra = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.responseBody = { erro: message, ...extra };
  return error;
};

const replayResult = (submission) => ({
  statusCode: Number(submission.responseStatus) || 200,
  body: submission.responseBody,
  notify: false
});

const legacySubmissionResult = async ({
  candidatura,
  submittedId,
  openId,
  transaction
}) => {
  const submissionHistory = candidatura.estadoId === openId
    ? await HistoricoCandidatura.findOne({
      where: { candidaturaId: candidatura.id, estadoNovo: submittedId },
      attributes: ['id'],
      transaction
    })
    : null;
  const wasSubmitted = candidatura.estadoId !== openId || Boolean(submissionHistory);
  return {
    statusCode: 200,
    body: wasSubmitted
      ? {
        mensagem: 'Candidatura submetida com sucesso.',
        candidaturaId: candidatura.id,
        idempotentReplay: true
      }
      : {
        mensagem: 'Rascunho guardado.',
        candidaturaId: candidatura.id,
        estado: STATUS.OPEN,
        idempotentReplay: true
      },
    notify: false
  };
};

const rememberClientSubmission = async ({
  consultorId,
  badgeId,
  candidatura,
  clientSubmissionId,
  result,
  transaction
}) => {
  if (!clientSubmissionId) return result;
  await CandidaturaSubmission.findOrCreate({
    where: { consultorId, clientSubmissionId },
    defaults: {
      badgeId,
      candidaturaId: candidatura.id,
      responseStatus: result.statusCode,
      responseBody: result.body
    },
    transaction
  });
  return result;
};

exports.submeterCandidatura = async (req, res) => {
  try {
    // Extrair dados da requisição
    const { requisitoIds = [], descricao } = req.body;
    const badgeId = normalizeBadgeId(req.body.badgeId);
    const clientSubmissionId = normalizeClientSubmissionId(req.body.clientSubmissionId);
    // rascunho === true -> "Guardar": fica no estado OPEN, aceita evidências
    // parciais e NÃO exige cobertura dos requisitos obrigatórios.
    const rascunho = String(req.body.rascunho) === 'true';
    const consultorId = req.user.id;
    const ficheiros = req.files || [];

    const statuses = await getStatuses([STATUS.OPEN, STATUS.SUBMITTED, STATUS.IN_VALIDATION, STATUS.VALIDATED, STATUS.IN_APPROVAL]);
    const openId = statuses[STATUS.OPEN].statusId;
    const submitted = statuses[STATUS.SUBMITTED] || await getStatus(STATUS.SUBMITTED);
    const submittedId = submitted.statusId;
    let badgeForNotification = null;

    const result = await withClientSubmissionTransaction({
      sequelize,
      consultorId,
      clientSubmissionId,
      badgeId
    }, async (transaction) => {
      // O helper já adquiriu os locks antes desta primeira leitura. Dois POST
      // concorrentes ficam serializados mesmo em processos Render diferentes.
      // Um reenvio mobile com a mesma chave nunca volta a criar candidatura,
      // evidências, histórico ou emails.
      const submission = clientSubmissionId
        ? await CandidaturaSubmission.findOne({
          where: { consultorId, clientSubmissionId },
          transaction,
          lock: transaction.LOCK.UPDATE
        })
        : null;
      if (submission && Number(submission.badgeId) !== Number(badgeId)) {
        throw submissionError(
          409,
          'A chave desta submissão já foi utilizada noutra candidatura.'
        );
      }
      if (submission) return replayResult(submission);

      // Compatibilidade com candidaturas criadas antes da existência do
      // ledger. A chave antiga é registada antes de poder ser substituída por
      // uma nova tentativa depois de SEND_BACK.
      const candidaturaIdempotente = clientSubmissionId
        ? await Candidatura.findOne({
          where: { consultorId, clientSubmissionId },
          transaction,
          lock: transaction.LOCK.UPDATE
        })
        : null;
      if (
        candidaturaIdempotente &&
        Number(candidaturaIdempotente.badgeId) !== Number(badgeId)
      ) {
        throw submissionError(
          409,
          'A chave desta submissão já foi utilizada noutra candidatura.'
        );
      }
      if (candidaturaIdempotente) {
        const result = await legacySubmissionResult({
          candidatura: candidaturaIdempotente,
          submittedId,
          openId,
          transaction
        });
        return rememberClientSubmission({
          consultorId,
          badgeId,
          candidatura: candidaturaIdempotente,
          clientSubmissionId,
          result,
          transaction
        });
      }

      // Só pedidos novos ou um rascunho OPEN ainda incompleto dependem do
      // estado atual do catálogo. Um replay já confirmado terminou acima,
      // mesmo se a candidatura tiver sido devolvida para OPEN ou a badge tiver
      // entretanto sido desativada/alterada.
      const idsRequisitos = (Array.isArray(requisitoIds) ? requisitoIds : [requisitoIds])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id));
      if (idsRequisitos.length !== ficheiros.length) {
        throw submissionError(400, 'Cada evidência tem de estar associada a um requisito.');
      }
      const clientEvidenceIds = resolveClientEvidenceIds({
        rawIds: req.body.clientEvidenceIds ?? req.body['clientEvidenceIds[]'],
        clientSubmissionId,
        fileCount: ficheiros.length
      });

      const badge = await Badge.findByPk(badgeId, { transaction });
      if (!badge || badge.ativo === false) {
        throw submissionError(404, 'Badge não encontrada ou inativa.');
      }
      badgeForNotification = badge;

      const consultant = await Consultant.findByPk(consultorId, { transaction });
      if (!consultant) {
        throw submissionError(403, 'Apenas consultores podem submeter candidaturas.');
      }

      // Uma badge válida já conquistada só pode voltar a ser pedida depois de expirar.
      const jaConquistada = await ConsultorBadge.findOne({
        where: { consultorId, badgeId, valid: true },
        transaction
      });
      if (jaConquistada) {
        throw submissionError(400, 'Já conquistaste este badge.');
      }

      const requisitosDoNivel = await Requirement.findAll({
        where: { nivelId: badge.nivelId, deletedAt: null },
        attributes: ['id', 'obrigatorio'],
        transaction
      });
      const idsValidos = new Set(requisitosDoNivel.map((requisito) => requisito.id));
      if (idsRequisitos.some((id) => !idsValidos.has(id))) {
        throw submissionError(
          400,
          'Uma das evidências está associada a um requisito que não pertence a este badge.'
        );
      }

      // A candidatura é EDITÁVEL enquanto está OPEN ou SUBMITTED. Assim que o
      // TM a valida, fica bloqueada.
      const editableIds = [openId, submittedId];
      const bloqueada = await Candidatura.findOne({
        where: {
          consultorId,
          badgeId,
          estadoId: {
            [Op.in]: Object.values(statuses)
              .map((status) => status.statusId)
              .filter((id) => !editableIds.includes(id))
          }
        },
        transaction
      });
      if (bloqueada) {
        throw submissionError(
          400,
          'Esta candidatura já está em validação e não pode ser alterada.'
        );
      }

      // O row lock também protege uma candidatura editável legada sem chave
      // quando dois pedidos tentam adotá-la ao mesmo tempo.
      let candidatura = await Candidatura.findOne({
        where: { consultorId, badgeId, estadoId: { [Op.in]: editableIds } },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      // Uma candidatura criada anteriormente pelo site pode não ter chave.
      // Atribuímo-la ANTES de uploads/histórico/estado, dentro da transação.
      if (candidatura && clientSubmissionId) {
        if (
          candidatura.clientSubmissionId &&
          candidatura.clientSubmissionId !== clientSubmissionId
        ) {
          const previousResult = await legacySubmissionResult({
            candidatura,
            submittedId,
            openId,
            transaction
          });
          await rememberClientSubmission({
            consultorId,
            badgeId,
            candidatura,
            clientSubmissionId: candidatura.clientSubmissionId,
            result: previousResult,
            transaction
          });
          await candidatura.update({ clientSubmissionId }, { transaction });
        }
        if (!candidatura.clientSubmissionId) {
          await candidatura.update({ clientSubmissionId }, { transaction });
        }
      }

      const jaSubmetida = Boolean(candidatura) && candidatura.estadoId === submittedId;

      // Evidências já existentes (pode haver várias para o mesmo requisito).
      const evidenciasExistentes = candidatura
        ? await Evidencia.findAll({
          where: { candidaturaId: candidatura.id },
          attributes: ['id', 'requisitoId', 'clientEvidenceId'],
          transaction,
          lock: transaction.LOCK.UPDATE
        })
        : [];
      const requisitosCobertos = new Set(
        evidenciasExistentes.map((evidence) => evidence.requisitoId)
      );
      idsRequisitos.forEach((id) => requisitosCobertos.add(id));

      if (jaSubmetida && ficheiros.length === 0) {
        throw submissionError(400, 'Anexa pelo menos uma evidência para adicionar.');
      }

      // Só é exigida evidência quando o nível da badge tem requisitos.
      if (requisitosDoNivel.length > 0 && requisitosCobertos.size === 0) {
        throw submissionError(400, 'Tens de anexar pelo menos uma evidência.');
      }

      // Só ao SUBMETER um rascunho: todos os requisitos obrigatórios cobertos.
      if (!rascunho && !jaSubmetida) {
        const obrigatoriosEmFalta = requisitosDoNivel.filter(
          (requisito) =>
            requisito.obrigatorio !== false && !requisitosCobertos.has(requisito.id)
        );
        if (obrigatoriosEmFalta.length > 0) {
          throw submissionError(
            400,
            'Tens de submeter evidência para todos os requisitos obrigatórios deste badge.',
            { requisitosEmFalta: obrigatoriosEmFalta.map((requisito) => requisito.id) }
          );
        }
      }

      if (!candidatura) {
        candidatura = await Candidatura.create({
          consultorId,
          badgeId,
          estadoId: openId,
          dataSubmicao: new Date(),
          clientSubmissionId
        }, { transaction });
      }

      // A deduplicação é feita pelo ID exato da evidência, nunca apenas pelo
      // requisito. Assim, duas evidências do mesmo requisito são preservadas.
      const uploads = getPendingEvidenceUploads({
        files: ficheiros,
        requirementIds: idsRequisitos,
        evidenceIds: clientEvidenceIds,
        existingEvidence: evidenciasExistentes
      });

      // Sequencial de propósito: se um upload falhar, não ficam operações DB
      // ainda em execução depois de a transação começar o rollback.
      for (const { file, requirementId, clientEvidenceId } of uploads) {
        const url = await uploadFicheiro(file);
        await Evidencia.create({
          url,
          nomeFicheiro: file.originalname,
          tipo: file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGEM',
          candidaturaId: candidatura.id,
          clientEvidenceId,
          requisitoId: requirementId,
          descricao,
          uploadedBy: consultorId
        }, { transaction });
      }

      if (jaSubmetida) {
        await HistoricoCandidatura.create({
          candidaturaId: candidatura.id,
          userId: consultorId,
          estadoAnterior: submittedId,
          estadoNovo: submittedId,
          motivo: 'Evidências adicionadas'
        }, { transaction });
        const evidenceResult = {
          statusCode: 200,
          body: {
            mensagem: 'Evidências adicionadas.',
            candidaturaId: candidatura.id,
            estado: STATUS.SUBMITTED
          },
          notify: false
        };
        return rememberClientSubmission({
          consultorId,
          badgeId,
          candidatura,
          clientSubmissionId,
          result: evidenceResult,
          transaction
        });
      }

      if (rascunho) {
        await HistoricoCandidatura.create({
          candidaturaId: candidatura.id,
          userId: consultorId,
          estadoAnterior: openId,
          estadoNovo: openId,
          motivo: 'Rascunho guardado'
        }, { transaction });
        const draftResult = {
          statusCode: 200,
          body: {
            mensagem: 'Rascunho guardado.',
            candidaturaId: candidatura.id,
            estado: STATUS.OPEN
          },
          notify: false
        };
        return rememberClientSubmission({
          consultorId,
          badgeId,
          candidatura,
          clientSubmissionId,
          result: draftResult,
          transaction
        });
      }

      const slaTalent = await getSLAConfigForTeam('talent').catch(() => null);
      await candidatura.update({
        estadoId: submittedId,
        dataSubmicao: new Date(),
        slaId: slaTalent?.slaId ?? null,
        dataSlaLimite: slaTalent
          ? new Date(Date.now() + slaTalent.responseDays * 24 * 60 * 60 * 1000)
          : null,
        slaExcedido: false
      }, { transaction });
      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        userId: consultorId,
        estadoAnterior: openId,
        estadoNovo: submittedId,
        motivo: 'Candidatura submetida'
      }, { transaction });

      const submittedResult = {
        statusCode: 201,
        body: {
          mensagem: 'Candidatura submetida com sucesso.',
          candidaturaId: candidatura.id
        },
        notify: true
      };
      return rememberClientSubmission({
        consultorId,
        badgeId,
        candidatura,
        clientSubmissionId,
        result: submittedResult,
        transaction
      });
    });

    // A resposta e as notificações só acontecem depois do COMMIT.
    res.status(result.statusCode).json(result.body);

    // Notificações por email em background (não bloqueiam a resposta)
    if (result.notify) (async () => {
      try {
        const consultor = await User.findByPk(consultorId);
        if (!consultor) return;
        await sendEmail(emailCandidaturaSubmetida, consultor, badgeForNotification);

        const talentManagers = await User.findAll({
          include: [{ association: User.associations.TalentManager, required: true }]
        }).catch(() => []);
        await Promise.all(talentManagers.map((tm) =>
          sendEmail(emailNovaSubmissao, tm, consultor, badgeForNotification)
        ));
      } catch (erroEmail) {
        console.error('Erro ao enviar notificações de submissão:', erroEmail.message);
      }
    })();
  } catch (erro) {
    if (erro.statusCode) {
      return res.status(erro.statusCode).json(
        erro.responseBody || { erro: erro.message }
      );
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao submeter candidatura.' });
  }
};

exports.listarMinhasCandidaturas = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      where: { consultorId: req.user.id },
      // Estes IDs servem apenas para idempotência de escrita. A listagem pode
      // funcionar durante o curto período em que a migration ainda reintenta.
      attributes: { exclude: ['clientSubmissionId'] },
      include: candidaturaInclude,
      order: [['createdAt', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    console.error('Erro ao listar minhas candidaturas:', erro);
    res.status(500).json({ erro: 'Erro ao listar candidaturas.' });
  }
};

// Candidatura EDITÁVEL (OPEN rascunho ou SUBMITTED à espera do TM) do consultor
// para um badge, com as evidências já anexadas — para retomar/adicionar.
exports.getRascunho = async (req, res) => {
  try {
    const consultorId = req.user.id;
    const { badgeId } = req.query;
    if (!badgeId) return res.json(null);

    const [open, submitted] = await Promise.all([getStatus(STATUS.OPEN), getStatus(STATUS.SUBMITTED)]);
    const candidatura = await Candidatura.findOne({
      where: { consultorId, badgeId, estadoId: { [Op.in]: [open.statusId, submitted.statusId] } },
      attributes: { exclude: ['clientSubmissionId'] },
      include: [{
        model: Evidencia,
        as: 'evidencias',
        attributes: { exclude: ['clientEvidenceId'] }
      }]
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

// Apaga uma evidência do consultor (para trocar/remover). Só permitido enquanto
// a candidatura está editável (OPEN ou SUBMITTED); depois do TM validar, não.
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

    // Histórico/timeline do workflow: cada transição, quem a fez e quando.
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

// Histórico completo de candidaturas de um consultor específico (usado na
// página de perfil do consultor, vista pelo TM/SLL/Admin, ou pelo próprio).
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

// Nº de candidaturas fechadas (aprovadas ou rejeitadas) por dia, nos últimos
// 7 dias (janela rolante que termina hoje), para o gráfico "Pedidos Fechados"
// do painel de controlo do TM/Admin. Usa o histórico de workflow como fonte da
// data real de fecho (a Candidatura em si não guarda uma única "data de fecho").
// Devolve sempre 7 valores, ordenados do mais antigo (índice 0 = há 6 dias)
// até hoje (índice 6).
exports.getFechadasPorSemana = async (req, res) => {
  try {
    const statuses = await getStatuses([STATUS.APPROVED, STATUS.REJECTED]);
    const idsFechados = Object.values(statuses).map((s) => s.statusId);

    // Janela dos últimos 7 dias: fim = amanhã às 00:00 (exclusivo, para incluir
    // hoje por completo); início = 7 dias antes desse fim, às 00:00.
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

    const contagem = [0, 0, 0, 0, 0, 0, 0]; // índice 0 = há 6 dias ... índice 6 = hoje
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

// Nº de badges atribuídos por dia, nos últimos 7 dias, para o gráfico
// "Badges Atribuídos" do painel de controlo do Service Line Leader —
// restrito à sua própria Service Line (Admin/TalentManager veem todas).
// Mesmo formato/janela que getFechadasPorSemana.
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
  // Listar candidaturas com estado SUBMITTED para validação do Talent Manager
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

// Vista do Admin sobre TODOS os pedidos de badges, em qualquer estado do
// workflow (ao contrário de /talent/pendentes e /serviceline/pendentes, que
// só devolvem as candidaturas ainda por validar/aprovar).
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

// Validar (ou invalidar) uma evidência específica de uma candidatura. Passo
// obrigatório antes do Talent Manager poder aprovar a candidatura completa.
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
  // Validar ou rejeitar candidatura pelo Talent Manager
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

    // Rejeitar ou devolver (Send Back) exige comentário — o consultor precisa
    // de saber o que corrigir (guião: "Retorna ao consultor com comentário").
    if (['REJEITAR', 'SEND_BACK'].includes(decisao) && !String(comentario || '').trim()) {
      return res.status(400).json({ erro: 'É obrigatório indicar um comentário para rejeitar ou devolver a candidatura.' });
    }

    // Send Back devolve ao consultor para retificação (volta a OPEN, editável);
    // Rejeitar fecha a candidatura (REJECTED); Aprovar envia ao Service Line.
    let nextStatus;
    if (decisao === 'APROVAR') nextStatus = statuses[STATUS.VALIDATED];
    else if (decisao === 'REJEITAR') nextStatus = statuses[STATUS.REJECTED];
    else if (decisao === 'SEND_BACK') nextStatus = statuses[STATUS.OPEN];
    if (!nextStatus) {
      return res.status(400).json({ erro: 'Decisão inválida. Use APROVAR, REJEITAR ou SEND_BACK.' });
    }

    // É obrigatório validar todas as evidências antes de poder aprovar a candidatura.
    if (decisao === 'APROVAR') {
      const evidencias = candidatura.evidencias || [];
      const faltaValidar = evidencias.some((e) => e.validado !== true);
      if (evidencias.length === 0 || faltaValidar) {
        return res.status(400).json({ erro: 'Tens de validar todas as evidências antes de aprovar a candidatura.' });
      }
    }

    // Atualizar candidatura com nova decisão do Talent Manager
    await candidatura.update({
      estadoId: nextStatus.statusId,
      talentManagerId: req.user.roles.includes('TalentManager') ? req.user.id : null,
      dataValidacao: new Date(),
      comentario
    });

    // Criar histórico da candidatura
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: req.user.id,
      estadoAnterior: statuses[STATUS.SUBMITTED].statusId,
      estadoNovo: nextStatus.statusId,
      motivo: comentario || decisao
    });

    // Responder já — o email de notificação ao consultor é lento (SMTP) e
    // não deve atrasar a resposta ao Talent Manager.
    const consultor = candidatura.Consultant?.User;
    if (decisao === 'APROVAR') {
      res.json({ mensagem: 'Candidatura validada e enviada para aprovação final.' });
      sendEmail(emailEnviadoParaServiceLine, consultor, candidatura.Badge);

      // Notificar o(s) Service Line Leader(s) da área do badge — conforme o
      // guião, o SLL deve receber email dos pedidos que aguardam a sua decisão.
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

    // Send Back: devolvida ao consultor para retificação (volta a editável).
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

    // Se a decisão for rejeitar, enviar email de rejeição (em background)
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
  // Listar candidaturas com estado VALIDATED para aprovação do Service Line Leader,
  // restrito à Service Line do próprio SLL (Admin/TalentManager veem tudo).
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

// Vista do Service Line Leader sobre TODOS os pedidos de badges da sua
// Service Line, em qualquer estado do workflow (ao contrário de
// /serviceline/pendentes, que só devolve as ainda por aprovar). Cobre os
// requisitos do guião de histórico/estado em tempo real da sua service
// line/área (Admin/TalentManager veem todas as service lines).
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

    // Um Service Line Leader só pode decidir sobre candidaturas da sua
    // própria Service Line (guião: "não tem acesso às áreas de outras
    // Service Lines"). Admin/TalentManager não têm esta restrição.
    await assertBadgeInServiceLineScope(req.user, candidatura.badgeId);

    if (['REJEITAR', 'SEND_BACK'].includes(decisao) && !String(comentario || '').trim()) {
      return res.status(400).json({ erro: 'É obrigatório indicar um comentário para rejeitar ou devolver a candidatura.' });
    }

    // Verificar se a candidatura está no estado correto para aprovação final
    const statuses = await getStatuses([STATUS.VALIDATED, STATUS.APPROVED, STATUS.REJECTED, STATUS.OPEN]);
    if (candidatura.estadoId !== statuses[STATUS.VALIDATED].statusId) {
      return res.status(400).json({ erro: 'Candidatura não está validada.' });
    }

    // Determinar próximo estado com base na decisão do Service Line Leader
    let nextStatus;
    if (decisao === 'APROVAR') nextStatus = statuses[STATUS.APPROVED];
    if (decisao === 'REJEITAR') nextStatus = statuses[STATUS.REJECTED];
    if (decisao === 'SEND_BACK') nextStatus = statuses[STATUS.OPEN];
    if (!nextStatus) {
      return res.status(400).json({ erro: 'Decisão inválida. Use APROVAR, REJEITAR ou SEND_BACK.' });
    }

    // Atualizar candidatura com nova decisão do Service Line Leader
    await candidatura.update({
      estadoId: nextStatus.statusId,
      serviceLineLeaderId: req.user.roles.includes('ServiceLineLeader') ? req.user.id : null,
      dataAprovacao: decisao === 'APROVAR' ? new Date() : null,
      comentario
    });

    // Criar histórico da candidatura
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: req.user.id,
      estadoAnterior: statuses[STATUS.VALIDATED].statusId,
      estadoNovo: nextStatus.statusId,
      motivo: comentario || decisao
    });

    
    const consultor = candidatura.Consultant?.User;
    if (decisao === 'APROVAR') {
      // Atribuir badge ao consultor e calcular data de expiração
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
      // Responder já — o email (SMTP) é lento e vai em background
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

    // Se a decisão for enviar de volta para o consultor, notificação em background
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

    // Se a decisão for rejeitar, notificação em background
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
