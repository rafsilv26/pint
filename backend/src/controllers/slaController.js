const { SLAConfig, Candidatura } = require('../models');
const { getSLAConfigForTeam } = require('../services/sla.service');

// Gestão dedicada de SLAs (guião — bónus Gestor 10: "Definir e gerir os SLA
// da equipa de talent e service line"). Só o Admin acede a estas rotas.

const TEAMS = ['talent', 'serviceline'];

const serialize = (c) => ({
  id: c.slaId,
  name: c.name,
  team: c.team || null,
  responseDays: c.responseDays,
  alertDaysBeforeExpiration: c.alertDaysBeforeExpiration,
  active: Boolean(c.active),
  createdAt: c.createdAt
});

const normalizarTeam = (team) => (TEAMS.includes(team) ? team : null);

// Ter mais do que um SLA ativo para a mesma equipa tornaria a resolução
// ambígua — ao ativar um, os restantes da mesma equipa são desativados.
const desativarOutrosDaEquipa = async (team) => {
  await SLAConfig.update(
    { active: false, updatedAt: new Date() },
    { where: { active: true, team: team || null } }
  );
};

// GET /sla/configs — todas as configurações + resolução efetiva por equipa.
exports.listarConfigs = async (_req, res) => {
  try {
    const configs = await SLAConfig.findAll({ order: [['createdAt', 'DESC']] });
    const [talent, serviceline] = await Promise.all([
      getSLAConfigForTeam('talent'),
      getSLAConfigForTeam('serviceline')
    ]);
    res.json({
      configs: configs.map(serialize),
      efetivo: { talent, serviceline }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar SLAs.', details: erro.message });
  }
};

// POST /sla/configs — cria uma configuração de SLA.
exports.criarConfig = async (req, res) => {
  try {
    const { name, team, responseDays, alertDaysBeforeExpiration, active } = req.body;
    if (!name) return res.status(400).json({ erro: 'O SLA precisa de um nome.' });
    const dias = Number(responseDays);
    if (!Number.isInteger(dias) || dias < 1) {
      return res.status(400).json({ erro: 'Os dias de resposta têm de ser um inteiro positivo.' });
    }

    const teamNormalizado = normalizarTeam(team);
    const ativa = active !== false;
    if (ativa) await desativarOutrosDaEquipa(teamNormalizado);

    const config = await SLAConfig.create({
      name,
      team: teamNormalizado,
      responseDays: dias,
      alertDaysBeforeExpiration: alertDaysBeforeExpiration != null && alertDaysBeforeExpiration !== ''
        ? Number(alertDaysBeforeExpiration)
        : null,
      createdBy: req.user.id,
      active: ativa
    });
    res.status(201).json(serialize(config));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar SLA.', details: erro.message });
  }
};

// PUT /sla/configs/:id — atualiza uma configuração (nome, equipa, dias, estado).
exports.atualizarConfig = async (req, res) => {
  try {
    const config = await SLAConfig.findByPk(req.params.id);
    if (!config) return res.status(404).json({ erro: 'SLA não encontrado.' });

    const { name, team, responseDays, alertDaysBeforeExpiration, active } = req.body;
    const alteracoes = { updatedAt: new Date() };

    if (name !== undefined) {
      if (!name) return res.status(400).json({ erro: 'O SLA precisa de um nome.' });
      alteracoes.name = name;
    }
    if (team !== undefined) alteracoes.team = normalizarTeam(team);
    if (responseDays !== undefined) {
      const dias = Number(responseDays);
      if (!Number.isInteger(dias) || dias < 1) {
        return res.status(400).json({ erro: 'Os dias de resposta têm de ser um inteiro positivo.' });
      }
      alteracoes.responseDays = dias;
    }
    if (alertDaysBeforeExpiration !== undefined) {
      alteracoes.alertDaysBeforeExpiration = alertDaysBeforeExpiration != null && alertDaysBeforeExpiration !== ''
        ? Number(alertDaysBeforeExpiration)
        : null;
    }
    if (active !== undefined) alteracoes.active = Boolean(active);

    const teamFinal = alteracoes.team !== undefined ? alteracoes.team : (config.team || null);
    if (alteracoes.active) await desativarOutrosDaEquipa(teamFinal);

    await config.update(alteracoes);
    res.json(serialize(config));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar SLA.', details: erro.message });
  }
};

// DELETE /sla/configs/:id — remove; se estiver associado a candidaturas
// (FK slaId), não pode ser apagado — desativa-se.
exports.apagarConfig = async (req, res) => {
  try {
    const config = await SLAConfig.findByPk(req.params.id);
    if (!config) return res.status(404).json({ erro: 'SLA não encontrado.' });

    const emUso = await Candidatura.count({ where: { slaId: config.slaId } });
    if (emUso > 0) {
      return res.status(409).json({
        erro: `Este SLA está associado a ${emUso} candidatura(s) e não pode ser removido. Desativa-o em alternativa.`
      });
    }

    await config.destroy();
    res.json({ mensagem: 'SLA removido.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover SLA.', details: erro.message });
  }
};
