const { SLAConfig, Candidatura } = require('../models');
const { getSLAConfigForTeam, reaplicarSlaEquipas } = require('../services/sla.service');

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

const desativarOutrosDaEquipa = async (team) => {
  await SLAConfig.update(
    { active: false, updatedAt: new Date() },
    { where: { active: true, team: team || null } }
  );
};

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
    res.status(500).json({ erro: 'Erro ao listar SLAs.' });
  }
};

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
    if (ativa) await reaplicarSlaEquipas(teamNormalizado);
    res.status(201).json(serialize(config));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar SLA.' });
  }
};

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
    await reaplicarSlaEquipas(teamFinal);
    res.json(serialize(config));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar SLA.' });
  }
};

exports.definirEquipa = async (req, res) => {
  try {
    const team = normalizarTeam(req.params.team);
    if (!team) return res.status(400).json({ erro: 'Equipa inválida (usa "talent" ou "serviceline").' });

    const dias = Number(req.body.responseDays);
    if (!Number.isInteger(dias) || dias < 1) {
      return res.status(400).json({ erro: 'Os dias de resposta têm de ser um inteiro positivo.' });
    }

    await desativarOutrosDaEquipa(team);

    const existente = await SLAConfig.findOne({ where: { team }, order: [['createdAt', 'DESC']] });
    let config;
    if (existente) {
      await existente.update({ responseDays: dias, active: true, updatedAt: new Date() });
      config = existente;
    } else {
      config = await SLAConfig.create({
        name: team === 'talent' ? 'SLA Talent' : 'SLA Service Line',
        team,
        responseDays: dias,
        createdBy: req.user.id,
        active: true
      });
    }
    await reaplicarSlaEquipas(team);
    res.json(serialize(config));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao definir SLA.' });
  }
};

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
    res.status(500).json({ erro: 'Erro ao remover SLA.' });
  }
};
