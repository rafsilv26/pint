const { ConsultorTimeline } = require('../models');

// Objetivos/metas pessoais do consultor (timeline) — base dos "Lembretes":
// o consultor define uma meta com data esperada e é lembrado quando o prazo
// se aproxima (ver DashboardAlerts no frontend).

const serialize = (o) => ({
  id: o.timelineId,
  title: o.title,
  description: o.description || '',
  expectedDate: o.expectedDate,
  completionDate: o.completionDate,
  status: o.status,
  priority: o.priority,
  concluido: Boolean(o.completionDate)
});

// GET /timeline/minha — objetivos do próprio consultor, mais urgentes primeiro.
exports.listarMeusObjetivos = async (req, res) => {
  try {
    const objetivos = await ConsultorTimeline.findAll({
      where: { consultorId: req.user.id, deletedAt: null },
      order: [['expectedDate', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(objetivos.map(serialize));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar objetivos.', details: erro.message });
  }
};

// POST /timeline — cria um objetivo.
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
      priority: priority || 3
    });
    res.status(201).json(serialize(objetivo));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar objetivo.', details: erro.message });
  }
};

// PUT /timeline/:id/concluir — marca como concluído (ou reabre).
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
    res.status(500).json({ erro: 'Erro ao atualizar objetivo.', details: erro.message });
  }
};

// DELETE /timeline/:id — remove (soft delete).
exports.apagarObjetivo = async (req, res) => {
  try {
    const objetivo = await ConsultorTimeline.findOne({
      where: { timelineId: req.params.id, consultorId: req.user.id, deletedAt: null }
    });
    if (!objetivo) return res.status(404).json({ erro: 'Objetivo não encontrado.' });

    await objetivo.update({ deletedAt: new Date() });
    res.json({ mensagem: 'Objetivo removido.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover objetivo.', details: erro.message });
  }
};
