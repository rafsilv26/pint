const { Op } = require('sequelize');
const {
  Candidatura,
  Badge,
  BadgeStatus,
  Consultant,
  User,
  ConsultorBadge,
  CertificateDownload
} = require('../models');
const { gerarCertificado } = require('../services/pdf.service');
const { gerarExcelCandidaturas } = require('../services/excel.service');
const {
  assertBadgeInServiceLineScope,
  getServiceLineScopeForUser,
  getBadgeIdsDaServiceLine
} = require('../services/serviceLineScope.service');

const reportInclude = [
  { model: Badge },
  { model: BadgeStatus, as: 'status' },
  { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
];

// Um Service Line Leader só deve exportar/ver relatórios da sua própria
// Service Line (guião: "Relatórios de badges atribuídos na sua área/período"
// e exportações "dos pedidos/badges/consultores/aprovações" no perfil do
// Service Line). Admin e TalentManager continuam a ver tudo.
const buildCandidaturaWhereParaUtilizador = async (user) => {
  const serviceLineId = await getServiceLineScopeForUser(user);
  if (!serviceLineId) return {};
  const badgeIds = await getBadgeIdsDaServiceLine(serviceLineId);
  return { badgeId: { [Op.in]: badgeIds.length ? badgeIds : [-1] } };
};

const findAwardByPublicToken = async (publicToken) => {
  const badge = await Badge.findOne({ where: { publicToken } });
  if (!badge) return null;

  const award = await ConsultorBadge.findOne({
    where: { badgeId: badge.id, valid: true },
    include: [
      { model: Badge },
      { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
    ],
    order: [['obtainedDate', 'DESC']]
  });

  return award ? { badge, award } : { badge, award: null };
};

const sendCertificate = async (req, res, award) => {
  const consultor = award.Consultant?.User;
  const pdfBuffer = await gerarCertificado(consultor, award.Badge, award.obtainedDate);

  await CertificateDownload.create({
    consultorId: award.consultorId,
    badgeId: award.badgeId,
    originIP: req.ip,
    userAgent: req.headers['user-agent'],
    format: 'PDF'
  }).catch(() => null);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificado-${award.Badge.nome}.pdf`);
  res.send(pdfBuffer);
};

exports.exportarCandidaturasExcel = async (req, res) => {
  try {
    const where = await buildCandidaturaWhereParaUtilizador(req.user);
    const candidaturas = await Candidatura.findAll({ where, include: reportInclude });
    const workbook = await gerarExcelCandidaturas(candidaturas);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=candidaturas.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar Excel', details: erro.message });
  }
};

exports.downloadCertificado = async (req, res) => {
  try {
    const result = await findAwardByPublicToken(req.params.publicToken);
    if (!result || !result.award) {
      return res.status(404).json({ erro: 'Badge atribuída não encontrada.' });
    }

    await sendCertificate(req, res, result.award);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar certificado', details: erro.message });
  }
};

exports.downloadCertificadoGestao = async (req, res) => {
  try {
    const consultorId = Number(req.params.consultorId);
    const badgeId = Number(req.params.badgeId);
    await assertBadgeInServiceLineScope(req.user, badgeId);

    const award = await ConsultorBadge.findOne({
      where: { consultorId, badgeId },
      include: [
        { model: Badge },
        { model: Consultant, include: [{ model: User, attributes: { exclude: ['password'] } }] }
      ],
      order: [['obtainedDate', 'DESC']]
    });
    if (!award) return res.status(404).json({ erro: 'Badge atribuída não encontrada.' });

    await sendCertificate(req, res, award);
  } catch (erro) {
    res.status(erro.statusCode || 500).json({ erro: erro.message || 'Erro ao gerar certificado', details: erro.message });
  }
};

exports.verificarBadge = async (req, res) => {
  try {
    const result = await findAwardByPublicToken(req.params.publicToken);
    if (!result) {
      return res.status(404).json({ erro: 'Badge não encontrada.' });
    }

    if (!result.award) {
      return res.status(404).json({ erro: 'Badge ainda não foi atribuída.' });
    }

    const consultor = result.award.Consultant?.User;
    const expirationDate = result.award.expirationDate;

    res.json({
      badge: {
        id: result.badge.id,
        nome: result.badge.nome,
        descricao: result.badge.descricao,
        imagem: result.badge.imagem,
        fornecedor: result.badge.fornecedor,
        tipo: result.badge.tipo,
        publicToken: result.badge.publicToken
      },
      consultor: consultor ? {
        id: consultor.id,
        nome: consultor.nome
      } : null,
      dataAtribuicao: result.award.obtainedDate,
      dataExpiracao: expirationDate,
      valido: expirationDate ? new Date() < new Date(expirationDate) : true
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao verificar badge', details: erro.message });
  }
};

exports.exportarCandidaturasPDF = async (req, res) => {
  try {
    const where = await buildCandidaturaWhereParaUtilizador(req.user);
    const candidaturas = await Candidatura.findAll({ where, include: reportInclude });
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

    doc.fillColor('#003087').fontSize(20).font('Helvetica-Bold').text('SOFTINSA - Relatorio de Candidaturas', { align: 'center' });
    doc.moveDown();
    doc.fillColor('#666666').fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, { align: 'center' });
    doc.moveDown();

    const startX = 30;
    const startY = doc.y;
    const colWidths = [40, 150, 180, 90, 120, 100];
    const headers = ['ID', 'Consultor', 'Badge', 'Estado', 'Data Sub.', 'Data Aprov.'];

    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), 20).fill('#003087');

    let currentX = startX;
    headers.forEach((header, i) => {
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(header, currentX + 5, startY + 5, { width: colWidths[i] });
      currentX += colWidths[i];
    });

    let currentY = startY + 20;
    candidaturas.forEach((c, index) => {
      if (index % 2 === 0) {
        doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20).fill('#e8f0fe');
      }

      const rowData = [
        String(c.id),
        c.Consultant?.User?.nome || '-',
        c.Badge?.nome || '-',
        c.status?.code || '-',
        c.dataSubmicao ? new Date(c.dataSubmicao).toLocaleDateString('pt-PT') : '-',
        c.dataAprovacao ? new Date(c.dataAprovacao).toLocaleDateString('pt-PT') : '-'
      ];

      currentX = startX;
      rowData.forEach((data, i) => {
        doc.fillColor('#333333').fontSize(9).font('Helvetica').text(data, currentX + 5, currentY + 5, { width: colWidths[i] - 5 });
        currentX += colWidths[i];
      });

      currentY += 20;
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar PDF', details: erro.message });
  }
};
