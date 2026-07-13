const { Op } = require('sequelize');
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

// Includes reduzidos para os endpoints de decisão (validar/aprovar/rejeitar):
// não precisam do histórico nem do requisito aninhado em cada evidência,
// o que torna o pedido mais rápido a responder.
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
    return await Notice.create({ userId, title, message, type, read: false });
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

exports.submeterCandidatura = async (req, res) => {
  try {
    // Extrair dados da requisição
    const { badgeId, requisitoIds = [], descricao } = req.body;
    // rascunho === true -> "Guardar": fica no estado OPEN, aceita evidências
    // parciais e NÃO exige cobertura dos requisitos obrigatórios.
    const rascunho = String(req.body.rascunho) === 'true';
    const consultorId = req.user.id;
    const ficheiros = req.files || [];

    // Validar badge
    const badge = await Badge.findByPk(badgeId);
    if (!badge || badge.ativo === false) {
      return res.status(404).json({ erro: 'Badge não encontrada ou inativa.' });
    }

    // Validar consultor
    const consultant = await Consultant.findByPk(consultorId);
    if (!consultant) {
      return res.status(403).json({ erro: 'Apenas consultores podem submeter candidaturas.' });
    }

    const statuses = await getStatuses([STATUS.OPEN, STATUS.SUBMITTED, STATUS.IN_VALIDATION, STATUS.VALIDATED, STATUS.IN_APPROVAL]);
    const openId = statuses[STATUS.OPEN].statusId;
    const submitted = statuses[STATUS.SUBMITTED] || await getStatus(STATUS.SUBMITTED);
    const submittedId = submitted.statusId;

    // A candidatura é EDITÁVEL enquanto está OPEN (rascunho) ou SUBMITTED (à
    // espera do Talent Manager). Assim que o TM a valida, fica bloqueada.
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

    // Reaproveita a candidatura editável existente (OPEN ou SUBMITTED).
    let candidatura = await Candidatura.findOne({
      where: { consultorId, badgeId, estadoId: { [Op.in]: editableIds } }
    });
    const jaSubmetida = Boolean(candidatura) && candidatura.estadoId === submittedId;

    // Emparelha cada NOVO ficheiro com o requisito que evidencia (mesma ordem).
    const idsRequisitos = (Array.isArray(requisitoIds) ? requisitoIds : [requisitoIds])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));
    if (idsRequisitos.length !== ficheiros.length) {
      return res.status(400).json({ erro: 'Cada evidência tem de estar associada a um requisito.' });
    }

    // Requisitos do nível deste badge.
    const requisitosDoNivel = await Requirement.findAll({
      where: { nivelId: badge.nivelId, deletedAt: null },
      attributes: ['id', 'obrigatorio']
    });
    const idsValidos = new Set(requisitosDoNivel.map((r) => r.id));
    if (idsRequisitos.some((id) => !idsValidos.has(id))) {
      return res.status(400).json({ erro: 'Uma das evidências está associada a um requisito que não pertence a este badge.' });
    }

    // Evidências já existentes (pode haver várias por requisito).
    const evidenciasExistentes = candidatura
      ? await Evidencia.findAll({ where: { candidaturaId: candidatura.id }, attributes: ['id', 'requisitoId'] })
      : [];
    const requisitosCobertos = new Set(evidenciasExistentes.map((e) => e.requisitoId));
    idsRequisitos.forEach((id) => requisitosCobertos.add(id));

    // Editar uma candidatura SUBMITTED só serve para ADICIONAR evidências.
    if (jaSubmetida && ficheiros.length === 0) {
      return res.status(400).json({ erro: 'Anexa pelo menos uma evidência para adicionar.' });
    }

    // Mínimo: pelo menos uma evidência no total.
    if (requisitosCobertos.size === 0) {
      return res.status(400).json({ erro: 'Tens de anexar pelo menos uma evidência.' });
    }

    // Só ao SUBMETER um rascunho: todos os requisitos obrigatórios cobertos.
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

    // Cria a candidatura (estado OPEN) se ainda não existir.
    if (!candidatura) {
      candidatura = await Candidatura.create({
        consultorId,
        badgeId,
        estadoId: openId,
        dataSubmicao: new Date()
      });
    }

    // Multi-evidência: os novos ficheiros são ADICIONADOS (não substituem os
    // existentes). Para trocar/remover, o consultor apaga a evidência à parte.
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

    // Adicionar evidências a uma candidatura JÁ SUBMETIDA — mantém SUBMITTED.
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

    // "Guardar": mantém OPEN e termina aqui (sem emails de submissão).
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

    // "Submeter": passa OPEN -> SUBMITTED.
    await candidatura.update({ estadoId: submittedId, dataSubmicao: new Date() });
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: consultorId,
      estadoAnterior: openId,
      estadoNovo: submittedId,
      motivo: 'Candidatura submetida'
    });

    // Responder já ao consultor — os emails de notificação são lentos (SMTP)
    // e não devem atrasar a resposta ao pedido.
    res.status(201).json({
      mensagem: 'Candidatura submetida com sucesso.',
      candidaturaId: candidatura.id
    });

    // Notificações por email em background (não bloqueiam a resposta)
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
    res.status(500).json({ erro: 'Erro ao submeter candidatura.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao listar candidaturas.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao obter rascunho.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao remover evidência.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao buscar candidatura.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao listar candidaturas do consultor.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao calcular candidaturas fechadas.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao calcular badges atribuídos.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao listar candidaturas.', details: erro.message });
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao listar candidaturas.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao validar evidência.', details: erro.message });
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

    const statuses = await getStatuses([STATUS.SUBMITTED, STATUS.VALIDATED, STATUS.REJECTED]);
    if (candidatura.estadoId !== statuses[STATUS.SUBMITTED].statusId) {
      return res.status(400).json({ erro: 'Candidatura não está submetida.' });
    }

    const nextStatus = decisao === 'APROVAR' ? statuses[STATUS.VALIDATED] : statuses[STATUS.REJECTED];
    if (!nextStatus) {
      return res.status(400).json({ erro: 'Decisão inválida. Use APROVAR ou REJEITAR.' });
    }

    // É obrigatório validar todas as evidências antes de poder aprovar a candidatura.
    if (decisao === 'APROVAR') {
      const evidencias = candidatura.evidencias || [];
      const faltaValidar = evidencias.some((e) => e.validado !== true);
      if (evidencias.length > 0 && faltaValidar) {
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
    res.status(500).json({ erro: 'Erro ao validar candidatura.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao listar candidaturas.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao listar candidaturas.', details: erro.message });
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
      await ConsultorBadge.upsert({
        consultorId: candidatura.consultorId,
        badgeId: candidatura.badgeId,
        obtainedDate: new Date(),
        expirationDate,
        durationMonths: candidatura.Badge.duracaoMeses,
        valid: true,
        pointsObtained: candidatura.Badge.ponto
      });
      // Responder já — o email (SMTP) é lento e vai em background
      res.json({ mensagem: 'Badge aprovada e atribuída ao consultor.' });
      createNotice(
        candidatura.consultorId,
        'Badge aprovada',
        `A badge ${candidatura.Badge?.nome || ''} foi aprovada e atribuída ao teu perfil.`,
        'success'
      );
      sendEmail(emailBadgeAprovado, consultor, candidatura.Badge, candidatura.Badge.publicToken);
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
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro na aprovação final.', details: erro.message });
  }
};
