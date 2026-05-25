const { Candidatura, Evidencia, Badge, User, HistoricoCandidatura } = require('../models/index');
const { uploadFicheiro } = require('../services/cloudinary.service');
const {
  emailCandidaturaSubmetida,
  emailNovaSubmissao,
  emailEnviadoParaServiceLine,
  emailBadgeAprovado,
  emailBadgeRejeitado,
  emailSendBack
} = require('../services/email.service');

// ─────────────────────────────────────────────
// CONSULTOR — Submeter candidatura a um badge
// ─────────────────────────────────────────────
exports.submeterCandidatura = async (req, res) => {
  try {
    const { badgeId } = req.body;
    const consultorId = req.user.id; // vem do middleware de auth da Pessoa 1
    const ficheiros = req.files;

    // 1. Verifica se o badge existe
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return res.status(404).json({ erro: 'Badge não encontrado' });
    }

    // 2. Verifica se já tem candidatura pendente para este badge
    const candidaturaExistente = await Candidatura.findOne({
      where: {
        consultorId,
        badgeId,
        estado: ['OPEN', 'SUBMITTED', 'EM_VALIDACAO']
      }
    });
    if (candidaturaExistente) {
      return res.status(400).json({ erro: 'Já tens uma candidatura pendente para este badge' });
    }

    // 3. Faz upload das evidências para o Cloudinary
    const evidencias = await Promise.all(
      ficheiros.map(async (ficheiro) => {
        const url = await uploadFicheiro(ficheiro);
        return {
          url,
          nomeFicheiro: ficheiro.originalname,
          tipo: ficheiro.mimetype === 'application/pdf' ? 'PDF' : 'IMAGEM'
        };
      })
    );

    // 4. Cria a candidatura na BD
    const candidatura = await Candidatura.create({
      consultorId,
      badgeId,
      estado: 'SUBMITTED'
    });

    // 5. Guarda as evidências associadas à candidatura
    await Promise.all(
      evidencias.map(ev =>
        Evidencia.create({ ...ev, candidaturaId: candidatura.id })
      )
    );

    // 6. Regista no histórico
    await HistoricoCandidatura.create({
      candidaturaId: candidatura.id,
      estadoAnterior: 'OPEN',
      estadoNovo: 'SUBMITTED',
      acao: 'SUBMETIDO',
      userId: consultorId
    });

    // 7. Envia emails
    const consultor = await User.findByPk(consultorId);
    await emailCandidaturaSubmetida(consultor, badge);

    // Notifica todos os Talent Managers
    const talentManagers = await User.findAll({
      where: { role: 'TalentManager' }
    });
    await Promise.all(
      talentManagers.map(tm => emailNovaSubmissao(tm, consultor, badge))
    );

    // 8. Responde ao frontend
    res.status(201).json({
      mensagem: 'Candidatura submetida com sucesso!',
      candidaturaId: candidatura.id
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao submeter candidatura' });
  }
};

// ─────────────────────────────────────────────
// CONSULTOR — Ver as suas candidaturas
// ─────────────────────────────────────────────
exports.listarMinhasCandidaturas = async (req, res) => {
  try {
    const consultorId = req.user.id;

    const candidaturas = await Candidatura.findAll({
      where: { consultorId },
      include: [
        { model: Badge },
        { model: Evidencia }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas' });
  }
};

// ─────────────────────────────────────────────
// CONSULTOR — Ver detalhe de uma candidatura
// ─────────────────────────────────────────────
exports.detalhesCandidatura = async (req, res) => {
  try {
    const { id } = req.params;

    const candidatura = await Candidatura.findByPk(id, {
      include: [
        { model: Badge },
        { model: Evidencia },
        { model: HistoricoCandidatura, include: [{ model: User, as: 'responsavel' }] }
      ]
    });

    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada' });
    }

    res.json(candidatura);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar candidatura' });
  }
};

// ─────────────────────────────────────────────
// TALENT MANAGER — Ver todas as candidaturas submetidas
// ─────────────────────────────────────────────
exports.listarCandidaturasTalent = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      where: { estado: 'SUBMITTED' },
      include: [
        { model: Badge },
        { model: Evidencia },
        { model: User, as: 'consultor' }
      ],
      order: [['createdAt', 'ASC']] // mais antigas primeiro
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas' });
  }
};

// ─────────────────────────────────────────────
// TALENT MANAGER — Validar candidatura
// ─────────────────────────────────────────────
exports.validarTalentManager = async (req, res) => {
  try {
    const { id } = req.params; // id da candidatura
    const { decisao, comentario } = req.body;
    // decisao: 'APROVAR' ou 'REJEITAR'
    const talentManagerId = req.user.id;

    const candidatura = await Candidatura.findByPk(id, {
      include: [Badge, { model: User, as: 'consultor' }]
    });

    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada' });
    }

    if (candidatura.estado !== 'SUBMITTED') {
      return res.status(400).json({ erro: 'Candidatura não está em estado SUBMITTED' });
    }

    if (decisao === 'APROVAR') {
      // Muda estado para EM_VALIDACAO
      await candidatura.update({
        estado: 'EM_VALIDACAO',
        talentManagerId,
        dataValidacaoTalent: new Date()
      });

      // Regista no histórico
      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        estadoAnterior: 'SUBMITTED',
        estadoNovo: 'EM_VALIDACAO',
        acao: 'APROVADO_TALENT',
        comentario,
        userId: talentManagerId
      });

      // Notifica o consultor
      await emailEnviadoParaServiceLine(candidatura.consultor, candidatura.Badge);

      // Notifica o Service Line Leader da área do badge
      const serviceLineLeaders = await User.findAll({
        where: { role: 'ServiceLine' }
      });
      await Promise.all(
        serviceLineLeaders.map(sl =>
          emailNovaSubmissao(sl, candidatura.consultor, candidatura.Badge)
        )
      );

      res.json({ mensagem: 'Candidatura enviada para o Service Line Leader' });

    } else if (decisao === 'REJEITAR') {
      // Volta ao estado OPEN
      await candidatura.update({
        estado: 'OPEN',
        talentManagerId,
        dataValidacaoTalent: new Date(),
        comentario
      });

      // Regista no histórico
      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        estadoAnterior: 'SUBMITTED',
        estadoNovo: 'OPEN',
        acao: 'REJEITADO_TALENT',
        comentario,
        userId: talentManagerId
      });

      // Notifica o consultor
      await emailBadgeRejeitado(candidatura.consultor, candidatura.Badge, comentario);

      res.json({ mensagem: 'Candidatura devolvida ao consultor' });

    } else {
      res.status(400).json({ erro: 'Decisão inválida. Use APROVAR ou REJEITAR' });
    }

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao validar candidatura' });
  }
};

// ─────────────────────────────────────────────
// SERVICE LINE LEADER — Ver candidaturas em validação
// ─────────────────────────────────────────────
exports.listarCandidaturasServiceLine = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      where: { estado: 'EM_VALIDACAO' },
      include: [
        { model: Badge },
        { model: Evidencia },
        { model: User, as: 'consultor' },
        { model: HistoricoCandidatura }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(candidaturas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar candidaturas' });
  }
};

// ─────────────────────────────────────────────
// SERVICE LINE LEADER — Validação final
// ─────────────────────────────────────────────
exports.validarServiceLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisao, comentario } = req.body;
    // decisao: 'APROVAR', 'REJEITAR', 'SEND_BACK'
    const serviceLineId = req.user.id;

    const candidatura = await Candidatura.findByPk(id, {
      include: [Badge, { model: User, as: 'consultor' }]
    });

    if (!candidatura) {
      return res.status(404).json({ erro: 'Candidatura não encontrada' });
    }

    if (candidatura.estado !== 'EM_VALIDACAO') {
      return res.status(400).json({ erro: 'Candidatura não está em validação' });
    }

    if (decisao === 'APROVAR') {
      // Calcula data de expiração se o badge tiver duração definida
      let dataExpiracao = null;
      if (candidatura.Badge.temExpiracao && candidatura.Badge.duracaoMeses) {
        dataExpiracao = new Date();
        dataExpiracao.setMonth(dataExpiracao.getMonth() + candidatura.Badge.duracaoMeses);
      }

      await candidatura.update({
        estado: 'FECHADO_APROVADO',
        serviceLineLeaderId: serviceLineId,
        dataValidacaoServiceLine: new Date(),
        dataExpiracao
      });

      // Adiciona pontos ao consultor
      const consultor = candidatura.consultor;
      await consultor.update({
        // o colega precisa de adicionar campo "pontos" ao modelo User
        // pontos: consultor.pontos + candidatura.Badge.pontos
      });

      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        estadoAnterior: 'EM_VALIDACAO',
        estadoNovo: 'FECHADO_APROVADO',
        acao: 'APROVADO_SERVICELINE',
        comentario,
        userId: serviceLineId
      });

      await emailBadgeAprovado(
        candidatura.consultor,
        candidatura.Badge,
        candidatura.Badge.uuid
      );

      res.json({ mensagem: 'Badge aprovado e publicado!' });

    } else if (decisao === 'REJEITAR') {
      await candidatura.update({
        estado: 'FECHADO_REJEITADO',
        serviceLineLeaderId: serviceLineId,
        dataValidacaoServiceLine: new Date(),
        comentario
      });

      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        estadoAnterior: 'EM_VALIDACAO',
        estadoNovo: 'FECHADO_REJEITADO',
        acao: 'REJEITADO_SERVICELINE',
        comentario,
        userId: serviceLineId
      });

      await emailBadgeRejeitado(candidatura.consultor, candidatura.Badge, comentario);

      res.json({ mensagem: 'Candidatura rejeitada' });

    } else if (decisao === 'SEND_BACK') {
      await candidatura.update({
        estado: 'OPEN',
        serviceLineLeaderId: serviceLineId,
        dataValidacaoServiceLine: new Date(),
        comentario
      });

      await HistoricoCandidatura.create({
        candidaturaId: candidatura.id,
        estadoAnterior: 'EM_VALIDACAO',
        estadoNovo: 'OPEN',
        acao: 'SEND_BACK',
        comentario,
        userId: serviceLineId
      });

      await emailSendBack(candidatura.consultor, candidatura.Badge, comentario);

      res.json({ mensagem: 'Candidatura devolvida ao consultor para correção' });

    } else {
      res.status(400).json({ erro: 'Decisão inválida. Use APROVAR, REJEITAR ou SEND_BACK' });
    }

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro na validação final' });
  }
};