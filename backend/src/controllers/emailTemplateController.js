const { EmailTemplate } = require('../models');
const { TEMPLATE_DEFS, render, layoutEmail } = require('../services/emailTemplate.service');
const { enviarEmail } = require('../services/email.service');

const juntarComOverride = (code, override) => {
  const def = TEMPLATE_DEFS[code];
  return {
    code,
    nome: def.nome,
    descricao: def.descricao,
    variaveis: def.variaveis,
    assuntoDefault: def.assunto,
    corpoDefault: def.corpo,
    assunto: override?.subject || def.assunto,
    corpo: override?.body || def.corpo,
    personalizado: Boolean(override),
    atualizadoEm: override?.updatedAt || override?.createdAt || null
  };
};

exports.listarTemplates = async (_req, res) => {
  try {
    const overrides = await EmailTemplate.findAll({ where: { active: true } });
    const porCode = Object.fromEntries(overrides.map((o) => [o.code, o]));
    res.json(Object.keys(TEMPLATE_DEFS).map((code) => juntarComOverride(code, porCode[code])));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar templates de email.' });
  }
};

exports.guardarTemplate = async (req, res) => {
  try {
    const { code } = req.params;
    if (!TEMPLATE_DEFS[code]) return res.status(404).json({ erro: 'Template desconhecido.' });

    const subject = String(req.body.assunto || '').trim();
    const body = String(req.body.corpo || '').trim();
    if (!subject || !body) {
      return res.status(400).json({ erro: 'O template precisa de assunto e corpo.' });
    }

    const [template] = await EmailTemplate.findOrCreate({
      where: { code },
      defaults: { code, subject, body, updatedBy: req.user.id }
    });
    await template.update({ subject, body, active: true, updatedBy: req.user.id, updatedAt: new Date() });
    res.json(juntarComOverride(code, template));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao guardar template.' });
  }
};

exports.reporTemplate = async (req, res) => {
  try {
    const { code } = req.params;
    if (!TEMPLATE_DEFS[code]) return res.status(404).json({ erro: 'Template desconhecido.' });

    await EmailTemplate.destroy({ where: { code } });
    res.json(juntarComOverride(code, null));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao repor template.' });
  }
};

exports.previewTemplate = async (req, res) => {
  try {
    const { code } = req.params;
    const def = TEMPLATE_DEFS[code];
    if (!def) return res.status(404).json({ erro: 'Template desconhecido.' });

    const assunto = req.body.assunto || def.assunto;
    const corpo = req.body.corpo || def.corpo;
    res.json({
      assunto: render(assunto, def.exemplo),
      html: layoutEmail(render(corpo, def.exemplo))
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao pré-visualizar template.' });
  }
};

exports.enviarTeste = async (req, res) => {
  try {
    const { code } = req.params;
    const def = TEMPLATE_DEFS[code];
    if (!def) return res.status(404).json({ erro: 'Template desconhecido.' });

    const override = await EmailTemplate.findOne({ where: { code, active: true } });
    const assunto = render(override?.subject || def.assunto, def.exemplo);
    const html = layoutEmail(render(override?.body || def.corpo, def.exemplo));

    const destino = req.user.data.email;
    await enviarEmail(destino, `[TESTE] ${assunto}`, html);
    res.json({ mensagem: 'Email de teste enviado.', para: destino });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao enviar email de teste.' });
  }
};
