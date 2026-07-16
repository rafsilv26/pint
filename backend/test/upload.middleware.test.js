const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assinaturaValida,
  fileFilter,
  validarConteudoFicheiros
} = require('../src/middlewares/upload.middleware');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('valida MIME, extensão e assinatura real de PDF, JPG e PNG', () => {
  const files = [
    { mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.7') },
    { mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]) },
    { mimetype: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }
  ];
  files.forEach((file) => assert.equal(assinaturaValida(file), true));

  let accepted;
  fileFilter({}, { mimetype: 'application/pdf', originalname: 'evidencia.pdf' }, (error, value) => {
    assert.equal(error, null);
    accepted = value;
  });
  assert.equal(accepted, true);
});

test('rejeita extensão enganadora e conteúdo que não corresponde ao MIME', () => {
  fileFilter({}, { mimetype: 'application/pdf', originalname: 'evidencia.exe' }, (error) => {
    assert.equal(error.statusCode, 400);
  });

  const res = response();
  let nextCalled = false;
  validarConteudoFicheiros(
    { files: [{ mimetype: 'application/pdf', originalname: '../malware.pdf', buffer: Buffer.from('not a pdf') }] },
    res,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.erro, /conteúdo/i);
});

test('normaliza o nome apenas depois de validar o conteúdo', () => {
  const req = {
    files: [
      { mimetype: 'application/pdf', originalname: '../pasta/evidencia.pdf', buffer: Buffer.from('%PDF-1.7') },
      { mimetype: 'application/pdf', originalname: '..\\pasta\\outra.pdf', buffer: Buffer.from('%PDF-1.7') }
    ]
  };
  let nextCalled = false;
  validarConteudoFicheiros(req, response(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.files[0].originalname, 'evidencia.pdf');
  assert.equal(req.files[1].originalname, 'outra.pdf');
});
