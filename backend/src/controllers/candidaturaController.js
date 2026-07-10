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
  Requirement
} = require('../models');
const { uploadFicheiro } = require('../services/cloudinary.service');
const {
  emailCandidaturaSubmetida,
  emailNovaSubmissao,
  emailEnviadoParaServiceLine,
  emailBadgeAprovado,
  emailBadgeRejeitado,
  emailSendBack
} = require('../services/email.service');

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
  { model: HistoricoCandidatura, as: 'history' }
];

const sendEmail = async (fn, ...args) => {
  try {
    await fn(...args);
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
  }
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
    const estadoIdsPendentes = Object.values(statuses).map((status) => status.statusId);

    // Verificar se já existe uma candidatura pendente para esta badge
    const candidaturaExistente = await Candidatura.findOne({
      where: {
        consultorId,
        badgeId,
        estadoId: { [Op.in]: estadoIdsPendentes }
      }
    });

    if (candidaturaExistente) {
      return res.status(400).json({ erro: 'Já existe uma candidatura pendente para esta badge.' });
    }

    // Criar candidatura
    const submitted = statuses[STATUS.SUBMITTED] || await getStatus(STATUS.SUBMITTED);
    const candidatura = await Candidatura.create({
      consultorId,
      badgeId,
      estadoId: submitted.statusId,
      dataSubmicao: new Date()
    });

    // Validar requisitoIds e associar evidências
    const idsRequisitos = Array.isArray(requisitoIds) ? requisitoIds : [requisitoIds].filter(Boolean);
    if (ficheiros.length > 0 && idsRequisitos.length === 0) {
      return res.status(400).json({ erro: 'É obrigatório indicar requisitoIds para associar as evidências.' });
    }

    // Fazer upload dos ficheiros e criar evidências associadas
    await Promise.all(
      ficheiros.map(async (ficheiro, index) => {
        const url = await uploadFicheiro(ficheiro);
        return Evidencia.create({
          url,
          nomeFicheiro: ficheiro.originalname,
          tipo: ficheiro.mimetype === 'application/pdf' ? 'PDF' : 'IMAGEM',
          candidaturaId: candidatura.id,
          requisitoId: idsRequisitos[index] || idsRequisitos[0],
          descricao,
          uploadedBy: consultorId
        });
      })
    );

    // Criar histórico da candidatura
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      userId: consultorId,
      estadoAnterior: submitted.statusId,
      estadoNovo: submitted.statusId,
      motivo: 'Candidatura submetida'
    });

    // Enviar email de notificação
    const consultor = await User.findByPk(consultorId);
    await sendEmail(emailCandidaturaSubmetida, consultor, badge);

    // Notificar Talent Managers sobre nova candidatura
    const talentManagers = await User.findAll({
      include: [{ association: User.associations.TalentManager, required: true }]
    }).catch(() => []);
    await Promise.all(talentManagers.map((tm) => sendEmail(emailNovaSubmissao, tm, consultor, badge)));

    res.status(201).json({
      mensagem: 'Candidatura submetida com sucesso.',
      candidaturaId: candidatura.id
    });
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

    res.json(candidatura);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar candidatura.', details: erro.message });
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

    const candidaturas = await Candidatura.findAll({
      where: { consultorId },
      include: candidaturaInclude,
      order: [['dataSubmicao', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas do consultor.', details: erro.message });
  }
};

// Nº de candidaturas fechadas (aprovadas ou rejeitadas) por dia da semana
// corrente (Segunda a Domingo), para o gráfico "Pedidos Fechados" do painel
// de controlo do TM/Admin. Usa o histórico de workflow como fonte da data
// real de fecho (a Candidatura em si não guarda uma única "data de fecho").
exports.getFechadasPorSemana = async (_req, res) => {
  try {
    const statuses = await getStatuses([STATUS.APPROVED, STATUS.REJECTED]);
    const idsFechados = Object.values(statuses).map((s) => s.statusId);

    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = Domingo ... 6 = Sábado
    const offsetSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    const inicioSemana = new Date(hoje);
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(hoje.getDate() - offsetSegunda);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    const logs = await HistoricoCandidatura.findAll({
      where: {
        estadoNovo: { [Op.in]: idsFechados },
        createdAt: { [Op.gte]: inicioSemana, [Op.lt]: fimSemana }
      },
      attributes: ['createdAt']
    });

    const contagem = [0, 0, 0, 0, 0, 0, 0]; // Segunda .. Domingo
    logs.forEach((log) => {
      const dias = Math.floor((new Date(log.createdAt) - inicioSemana) / 86400000);
      if (dias >= 0 && dias < 7) contagem[dias] += 1;
    });

    res.json(contagem);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao calcular candidaturas fechadas.', details: erro.message });
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
    res.status(500).json({ erro: 'Erro ao listar candidaturas.', details: erro.message });
  }
};

exports.validarTalentManager = async (req, res) => {
  // Validar ou rejeitar candidatura pelo Talent Manager
  try {
    const { decisao, comentario } = req.body;
    const candidatura = await Candidatura.findByPk(req.params.id, { include: candidaturaInclude });
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
    
    // Atualizar candidatura com nova decisão do Talent Manager
    await candidatura.update({
      estadoId: nextStatus.statusId,
      talentManagerId: req.user.id,
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

    // Enviar email de notificação ao consultor sobre decisão do Talent Manager
    const consultor = candidatura.Consultant?.User;
    if (decisao === 'APROVAR') {
      await sendEmail(emailEnviadoParaServiceLine, consultor, candidatura.Badge);
      return res.json({ mensagem: 'Candidatura validada e enviada para aprovação final.' });
    }

    // Se a decisão for rejeitar, enviar email de rejeição
    await sendEmail(emailBadgeRejeitado, consultor, candidatura.Badge, comentario);
    return res.json({ mensagem: 'Candidatura rejeitada pelo Talent Manager.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao validar candidatura.', details: erro.message });
  }
};

exports.listarCandidaturasServiceLine = async (_req, res) => {
  // Listar candidaturas com estado VALIDATED para aprovação do Service Line Leader
  try {
    const validated = await getStatus(STATUS.VALIDATED);
    const candidaturas = await Candidatura.findAll({
      where: { estadoId: validated.statusId },
      include: candidaturaInclude,
      order: [['createdAt', 'ASC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas.', details: erro.message });
  }
};

exports.validarServiceLine = async (req, res) => {
  try {
    const { decisao, comentario } = req.body;
    const candidatura = await Candidatura.findByPk(req.params.id, { include: candidaturaInclude });
    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada.' });
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
      serviceLineLeaderId: req.user.id,
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
      // Enviar email de notificação ao consultor sobre decisão do Service Line Leader
      await sendEmail(emailBadgeAprovado, consultor, candidatura.Badge, candidatura.Badge.publicToken);
      return res.json({ mensagem: 'Badge aprovada e atribuída ao consultor.' });
    }

    // Se a decisão for enviar de volta para o consultor, enviar email de notificação para o consultor corrigir a candidatura
    if (decisao === 'SEND_BACK') {
      await sendEmail(emailSendBack, consultor, candidatura.Badge, comentario);
      return res.json({ mensagem: 'Candidatura devolvida ao consultor.' });
    }

    // Se a decisão for rejeitar, enviar email de rejeição para o consultor
    await sendEmail(emailBadgeRejeitado, consultor, candidatura.Badge, comentario);
    return res.json({ mensagem: 'Candidatura rejeitada.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro na aprovação final.', details: erro.message });
  }
};
