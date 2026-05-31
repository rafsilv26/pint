const ExcelJS = require('exceljs');

const gerarExcelCandidaturas = async (candidaturas) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Candidaturas');

  // Estilo do cabeçalho
  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Consultor', key: 'consultor', width: 30 },
    { header: 'Badge', key: 'badge', width: 30 },
    { header: 'Nível', key: 'nivel', width: 10 },
    { header: 'Estado', key: 'estado', width: 20 },
    { header: 'Data Submissão', key: 'dataSubmissao', width: 20 },
    { header: 'Data Aprovação', key: 'dataAprovacao', width: 20 }
  ];

  // Estilo cabeçalho
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF003087' } // azul Softinsa
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  // Dados
  candidaturas.forEach((c, index) => {
    const row = sheet.addRow({
      id: c.id,
      consultor: c.consultor?.nome || c.consultor?.email,
      badge: c.Badge?.nome,
      nivel: c.Badge?.nivel,
      estado: c.estado,
      dataSubmissao: c.createdAt 
        ? new Date(c.createdAt).toLocaleDateString('pt-PT') 
        : '-',
      dataAprovacao: c.dataValidacaoServiceLine 
        ? new Date(c.dataValidacaoServiceLine).toLocaleDateString('pt-PT') 
        : '-'
    });

    // Alternar cor das linhas
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F0FE' }
        };
      });
    }
  });

  return workbook;
};

module.exports = { gerarExcelCandidaturas };