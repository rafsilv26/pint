// src/services/pdf.service.js
const PDFDocument = require('pdfkit');

const gerarCertificado = (consultor, badge, dataAprovacao) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Design do certificado
    doc
      .fontSize(30)
      .text('SOFTINSA', { align: 'center' })
      .moveDown()
      .fontSize(20)
      .text('Certificado de Competência', { align: 'center' })
      .moveDown()
      .fontSize(16)
      .text(`Certifica-se que`, { align: 'center' })
      .moveDown()
      .fontSize(24)
      .text(consultor.nome, { align: 'center' })
      .moveDown()
      .fontSize(16)
      .text(`obteve o badge`, { align: 'center' })
      .moveDown()
      .fontSize(22)
      .text(badge.nome, { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Data: ${new Date(dataAprovacao).toLocaleDateString('pt-PT')}`, { align: 'center' })
      .moveDown()
      .text(`Verificar em: ${process.env.APP_URL}/badge/verify/${badge.uuid}`, { align: 'center' });

    doc.end();
  });
};

module.exports = { gerarCertificado };