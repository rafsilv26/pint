const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const tiposPermitidos = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (tiposPermitidos[file.mimetype]?.includes(extension)) {
    cb(null, true);
  } else {
    const error = new Error('Tipo ou extensão de ficheiro não permitido. Apenas PDF, JPG e PNG.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter
});

const hasPrefix = (buffer, prefix) =>
  Buffer.isBuffer(buffer) && buffer.length >= prefix.length && prefix.every((byte, index) => buffer[index] === byte);

const assinaturaValida = (file) => {
  if (file.mimetype === 'application/pdf') {
    return Buffer.isBuffer(file.buffer) && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (file.mimetype === 'image/jpeg') return hasPrefix(file.buffer, [0xff, 0xd8, 0xff]);
  if (file.mimetype === 'image/png') return hasPrefix(file.buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return false;
};

const validarConteudoFicheiros = (req, res, next) => {
  const files = req.files || [];
  const invalid = files.find((file) => !assinaturaValida(file));
  if (invalid) {
    return res.status(400).json({ erro: 'O conteúdo de um ficheiro não corresponde ao tipo PDF, JPG ou PNG declarado.' });
  }

  files.forEach((file) => {
    const normalizedName = String(file.originalname || '').replace(/\\/g, '/');
    file.originalname = path.posix.basename(normalizedName).slice(0, 255);
  });
  return next();
};

const receberEvidencias = (req, res, next) => {
  upload.array('evidencias', 10)(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Cada ficheiro pode ter no máximo 10 MB.'
      : error.code === 'LIMIT_FILE_COUNT'
        ? 'Podes enviar no máximo 10 ficheiros.'
        : error.message;
    return res.status(400).json({ erro: message || 'Ficheiro inválido.' });
  });
};

module.exports = {
  assinaturaValida,
  fileFilter,
  receberEvidencias,
  validarConteudoFicheiros
};
