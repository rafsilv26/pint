const { Candidatura, Badge, User } = require('../models/index');
const { gerarCertificado } = require('../services/pdf.service');
const { gerarExcelCandidaturas } = require('../services/excel.service');

// Exportar candidaturas para Excel
exports.exportarCandidaturasExcel = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      include: [Badge, { model: User, as: 'consultor' }]
    });

    const workbook = await gerarExcelCandidaturas(candidaturas);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=candidaturas.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar Excel' });
  }
};

// Download de certificado PDF
exports.downloadCertificado = async (req, res) => {
  try {
    const { id } = req.params;

    const candidatura = await Candidatura.findByPk(id, {
      include: [Badge, { model: User, as: 'consultor' }]
    });

    if (!candidatura || candidatura.estado !== 'FECHADO_APROVADO') {
      return res.status(404).json({ erro: 'Badge não aprovado ou não encontrado' });
    }

    const pdfBuffer = await gerarCertificado(
      candidatura.consultor,
      candidatura.Badge,
      candidatura.dataValidacaoServiceLine
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado-${candidatura.Badge.nome}.pdf`);
    res.send(pdfBuffer);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar certificado' });
  }
};

// Verificação pública do badge
exports.verificarBadge = async (req, res) => {
  try {
    const { uuid } = req.params;

    const badge = await Badge.findOne({ where: { uuid } });
    if (!badge) {
      return res.status(404).json({ erro: 'Badge não encontrado' });
    }

    const candidatura = await Candidatura.findOne({
      where: { badgeId: badge.id, estado: 'FECHADO_APROVADO' },
      include: [{ model: User, as: 'consultor' }]
    });

    if (!candidatura) {
      return res.status(404).json({ erro: 'Badge não foi atribuído' });
    }

    res.json({
      badge: {
        nome: badge.nome,
        descricao: badge.descricao,
        nivel: badge.nivel,
        imagem: badge.imagem
      },
      consultor: {
        nome: candidatura.consultor.nome
      },
      dataAtribuicao: candidatura.dataValidacaoServiceLine,
      dataExpiracao: candidatura.dataExpiracao,
      valido: candidatura.dataExpiracao
        ? new Date() < new Date(candidatura.dataExpiracao)
        : true
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao verificar badge' });
  }
};