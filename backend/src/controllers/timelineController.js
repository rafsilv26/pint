const { ConsultorTimeline, User } = require('../models');

const serialize = (o) => ({
  id: o.timelineId,
  title: o.title,
  description: o.description || '',
  expectedDate: o.expectedDate,
  completionDate: o.completionDate,
  type: o.type,
  status: o.status,
  priority: o.priority,
  concluido: Boolean(o.completionDate),
  atribuido: Boolean(o.createdBy && o.createdBy !== o.consultorId)
});

exports.listarMeusObjetivos = async (req, res) => {
  try {
    const objetivos = await ConsultorTimeline.findAll({
      where: { consultorId: req.user.id, deletedAt: null },
      order: [['expectedDate', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(objetivos.map(serialize));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar objetivos.' });
  }
};

exports.criarObjetivo = async (req, res) => {
  try {
    const { title, description, expectedDate, priority } = req.body;
    if (!title) return res.status(400).json({ erro: 'O objetivo precisa de um título.' });

    const objetivo = await ConsultorTimeline.create({
      consultorId: req.user.id,
      title,
      description: description || null,
      startDate: new Date(),
      expectedDate: expectedDate || null,
      type: 'Meta',
      status: 'Pendente',
      priority: priority || 3,
      createdBy: req.user.id
    });
    res.status(201).json(serialize(objetivo));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar objetivo.' });
  }
};

exports.concluirObjetivo = async (req, res) => {
  try {
    const objetivo = await ConsultorTimeline.findOne({
      where: { timelineId: req.params.id, consultorId: req.user.id, deletedAt: null }
    });
    if (!objetivo) return res.status(404).json({ erro: 'Objetivo não encontrado.' });

    const concluir = req.body.concluido !== false;
    await objetivo.update({
      completionDate: concluir ? new Date() : null,
      status: concluir ? 'Concluído' : 'Pendente',
      updatedAt: new Date()
    });
    res.json(serialize(objetivo));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar objetivo.' });
  }
};

exports.listarObjetivosConsultor = async (req, res) => {
  try {
    const consultor = await User.findByPk(req.params.consultorId);
    if (!consultor) return res.status(404).json({ erro: 'Consultor não encontrado.' });

    const objetivos = await ConsultorTimeline.findAll({
      where: { consultorId: consultor.id, deletedAt: null },
      order: [['expectedDate', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(objetivos.map(serialize));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar objetivos do consultor.' });
  }
};

exports.criarObjetivoConsultor = async (req, res) => {
  try {
    const consultor = await User.findByPk(req.params.consultorId);
    if (!consultor) return res.status(404).json({ erro: 'Consultor não encontrado.' });

    const { title, description, expectedDate, priority, type } = req.body;
    if (!title) return res.status(400).json({ erro: 'O objetivo precisa de um título.' });

    const objetivo = await ConsultorTimeline.create({
      consultorId: consultor.id,
      title,
      description: description || null,
      startDate: new Date(),
      expectedDate: expectedDate || null,
      type: ['Meta', 'Milestone', 'Evento'].includes(type) ? type : 'Meta',
      status: 'Pendente',
      priority: priority || 3,
      createdBy: req.user.id
    });
    res.status(201).json(serialize(objetivo));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar objetivo para o consultor.' });
  }
};

exports.apagarObjetivoConsultor = async (req, res) => {
  try {
    const objetivo = await ConsultorTimeline.findOne({
      where: { timelineId: req.params.id, consultorId: req.params.consultorId, deletedAt: null }
    });
    if (!objetivo) return res.status(404).json({ erro: 'Objetivo não encontrado.' });

    await objetivo.update({ deletedAt: new Date() });
    res.json({ mensagem: 'Objetivo removido.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover objetivo do consultor.' });
  }
};

exports.apagarObjetivo = async (req, res) => {
  try {
    const objetivo = await ConsultorTimeline.findOne({
      where: { timelineId: req.params.id, consultorId: req.user.id, deletedAt: null }
    });
    if (!objetivo) return res.status(404).json({ erro: 'Objetivo não encontrado.' });

    if (objetivo.createdBy && Number(objetivo.createdBy) !== Number(req.user.id)) {
      return res.status(403).json({ erro: 'Este objetivo foi atribuído pela gestão e não pode ser removido.' });
    }

    await objetivo.update({ deletedAt: new Date() });
    res.json({ mensagem: 'Objetivo removido.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover objetivo.' });
  }
};
