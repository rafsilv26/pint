const ExcelJS = require('exceljs');

exports.exportarXlsx = async (req, res) => {
  try {
    const { filename = 'export', columns = [], rows = [] } = req.body || {};

    if (!Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ erro: 'É necessário indicar as colunas a exportar.' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dados');

    sheet.columns = columns.map((c) => ({
      header: String(c.label ?? c.key ?? ''),
      key: String(c.key ?? ''),
      width: 24
    }));

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003087' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      const linha = sheet.addRow(
        columns.reduce((acc, c) => {
          const valor = row[c.key];
          acc[c.key] = valor == null ? '' : valor;
          return acc;
        }, {})
      );
      if (index % 2 === 0) {
        linha.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
        });
      }
    });

    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_') || 'export';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (erro) {
    console.error('Erro ao exportar Excel:', erro.message);
    res.status(500).json({ erro: 'Erro ao gerar o ficheiro Excel.' });
  }
};
