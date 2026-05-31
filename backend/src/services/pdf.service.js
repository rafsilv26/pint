const PDFDocument = require('pdfkit');

const gerarCertificado = (consultor, badge, dataAprovacao) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 72, right: 72 }
    });
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Fundo
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');

    // Borda decorativa
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke('#003087'); // azul Softinsa

    // Título empresa
    doc.fillColor('#003087')
       .fontSize(36)
       .font('Helvetica-Bold')
       .text('SOFTINSA', 0, 60, { align: 'center' });

    // Subtítulo
    doc.fillColor('#666666')
       .fontSize(14)
       .font('Helvetica')
       .text('AN IBM GROUP COMPANY', 0, 105, { align: 'center' });

    // Linha separadora
    doc.moveTo(100, 130)
       .lineTo(doc.page.width - 100, 130)
       .lineWidth(1)
       .stroke('#003087');

    // Título certificado
    doc.fillColor('#333333')
       .fontSize(22)
       .font('Helvetica')
       .text('CERTIFICADO DE COMPETÊNCIA DIGITAL', 0, 150, { align: 'center' });

    // Texto certifica
    doc.fillColor('#555555')
       .fontSize(14)
       .text('Certifica-se que', 0, 200, { align: 'center' });

    // Nome do consultor
    doc.fillColor('#003087')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(consultor.nome || consultor.email, 0, 225, { align: 'center' });

    // Texto obteve
    doc.fillColor('#555555')
       .fontSize(14)
       .font('Helvetica')
       .text('obteve com sucesso o badge', 0, 270, { align: 'center' });

    // Nome do badge
    doc.fillColor('#003087')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(badge.nome, 0, 295, { align: 'center' });

    // Nível
    doc.fillColor('#666666')
       .fontSize(14)
       .font('Helvetica')
       .text(`Nível: ${badge.nivel}`, 0, 330, { align: 'center' });

    // Linha separadora
    doc.moveTo(100, 360)
       .lineTo(doc.page.width - 100, 360)
       .lineWidth(1)
       .stroke('#cccccc');

    // Data
    doc.fillColor('#555555')
       .fontSize(12)
       .text(
         `Data de atribuição: ${new Date(dataAprovacao).toLocaleDateString('pt-PT')}`,
         0, 375, { align: 'center' }
       );

    // Link verificação
    doc.fillColor('#003087')
       .fontSize(10)
       .text(
         `Verificar autenticidade em: ${process.env.APP_URL}/api/relatorios/verificar/${badge.uuid}`,
         0, 395, { align: 'center' }
       );

    doc.end();
  });
};

module.exports = { gerarCertificado };