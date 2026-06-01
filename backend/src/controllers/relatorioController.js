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

// Exportar candidaturas para PDF
exports.exportarCandidaturasPDF = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      include: [Badge, { model: User, as: 'consultor' }]
    });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-candidaturas.pdf');
      res.send(pdfBuffer);
    });

    // Título
    doc.fillColor('#003087')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('SOFTINSA — Relatório de Candidaturas', { align: 'center' });

    doc.moveDown();

    // Data do relatório
    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica')
       .text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, { align: 'center' });

    doc.moveDown();

    // Cabeçalho da tabela
    const startX = 30;
    const startY = doc.y;
    const colWidths = [40, 150, 180, 60, 120, 100];
    const headers = ['ID', 'Consultor', 'Badge', 'Nível', 'Estado', 'Data'];

    // Fundo cabeçalho
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), 20)
       .fill('#003087');

    // Texto cabeçalho
    let currentX = startX;
    headers.forEach((header, i) => {
      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(header, currentX + 5, startY + 5, { width: colWidths[i], align: 'left' });
      currentX += colWidths[i];
    });

    // Linhas de dados
    let currentY = startY + 20;
    candidaturas.forEach((c, index) => {
      // Cor alternada
      if (index % 2 === 0) {
        doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20)
           .fill('#e8f0fe');
      }

      const rowData = [
        String(c.id),
        c.consultor?.nome || c.consultor?.email || '-',
        c.Badge?.nome || '-',
        c.Badge?.nivel || '-',
        c.estado,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-PT') : '-'
      ];

      currentX = startX;
      rowData.forEach((data, i) => {
        doc.fillColor('#333333')
           .fontSize(9)
           .font('Helvetica')
           .text(data, currentX + 5, currentY + 5, { width: colWidths[i] - 5, align: 'left' });
        currentX += colWidths[i];
      });

      currentY += 20;

      // Nova página se necessário
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar PDF' });
  }
};