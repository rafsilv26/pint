const PDFDocument = require('pdfkit');

const NAVY = '#003087';
const GOLD = '#C8A24B';
const INK = '#2B2B2B';
const GRAY = '#6B7280';
const SOFT = '#FBFAF6';

// Estrela de 5 pontas centrada em (cx, cy).
const drawStar = (doc, cx, cy, outer, inner, color) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  doc.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => doc.lineTo(x, y));
  doc.closePath().fill(color);
};

// Losango decorativo (usado nos separadores e cantos).
const drawDiamond = (doc, cx, cy, size, color) => {
  doc.moveTo(cx, cy - size)
     .lineTo(cx + size, cy)
     .lineTo(cx, cy + size)
     .lineTo(cx - size, cy)
     .closePath()
     .fill(color);
};

// Selo/medalha desenhado no rodapé do certificado.
const drawSeal = (doc, cx, cy) => {
  doc.circle(cx, cy, 40).lineWidth(2).stroke(NAVY);
  doc.circle(cx, cy, 34).fill(NAVY);
  doc.circle(cx, cy, 30).lineWidth(1).stroke(GOLD);
  drawStar(doc, cx, cy - 4, 13, 5.5, GOLD);
  doc.fillColor(GOLD)
     .font('Helvetica-Bold')
     .fontSize(6.5)
     .text('SOFTINSA', cx - 40, cy + 14, { width: 80, align: 'center', characterSpacing: 1 });
};

const gerarCertificado = (consultor, badge, dataAprovacao) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const centerText = (text, y, options = {}) =>
      doc.text(text, 0, y, { width: W, align: 'center', ...options });

    // Fundo
    doc.rect(0, 0, W, H).fill(SOFT);

    // Moldura dupla
    doc.rect(22, 22, W - 44, H - 44).lineWidth(2.5).stroke(NAVY);
    doc.rect(32, 32, W - 64, H - 64).lineWidth(1).stroke(GOLD);

    // Ornamentos de canto
    [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]].forEach(([x, y]) => {
      drawDiamond(doc, x, y, 6, GOLD);
    });

    // Cabeçalho — empresa
    doc.fillColor(NAVY)
       .font('Helvetica-Bold')
       .fontSize(34);
    centerText('SOFTINSA', 66, { characterSpacing: 4 });

    doc.fillColor(GRAY)
       .font('Helvetica')
       .fontSize(10.5);
    centerText('AN IBM GROUP COMPANY', 108, { characterSpacing: 3 });

    // Separador com losango central
    doc.moveTo(W / 2 - 150, 134).lineTo(W / 2 - 12, 134).lineWidth(1).stroke(GOLD);
    doc.moveTo(W / 2 + 12, 134).lineTo(W / 2 + 150, 134).lineWidth(1).stroke(GOLD);
    drawDiamond(doc, W / 2, 134, 4, GOLD);

    // Título do certificado
    doc.fillColor(INK)
       .font('Helvetica')
       .fontSize(16);
    centerText('CERTIFICADO DE COMPETÊNCIA DIGITAL', 154, { characterSpacing: 3 });

    // Fórmula
    doc.fillColor(GRAY)
       .font('Helvetica-Oblique')
       .fontSize(13);
    centerText('Certifica-se que', 200);

    // Nome do consultor
    doc.fillColor(NAVY)
       .font('Times-Bold')
       .fontSize(34);
    centerText(consultor.nome || consultor.email, 222);

    // Floreado dourado sob o nome
    doc.moveTo(W / 2 - 90, 272).lineTo(W / 2 + 90, 272).lineWidth(1.2).stroke(GOLD);

    doc.fillColor(GRAY)
       .font('Helvetica')
       .fontSize(13);
    centerText('obteve com sucesso o badge', 288);

    // Nome do badge
    doc.fillColor(NAVY)
       .font('Helvetica-Bold')
       .fontSize(22);
    centerText(badge.nome, 312);

    // Área
    if (badge.area) {
      doc.fillColor(GOLD)
         .font('Helvetica-Bold')
         .fontSize(12);
      centerText(`ÁREA: ${String(badge.area).toUpperCase()}`, 348, { characterSpacing: 2 });
    }

    // Selo
    drawSeal(doc, W / 2, 420);

    // Data
    doc.fillColor(INK)
       .font('Helvetica')
       .fontSize(12);
    centerText(
      `Data de atribuição: ${new Date(dataAprovacao).toLocaleDateString('pt-PT')}`,
      478
    );

    // Link de verificação
    const verifyUrl = `${(process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/$/, '')}/badge/${badge.publicToken}`;
    doc.fillColor(NAVY)
       .font('Helvetica')
       .fontSize(9.5);
    centerText(`Verificar autenticidade em: ${verifyUrl}`, 500, { characterSpacing: 0.3 });

    doc.end();
  });
};

module.exports = { gerarCertificado };
