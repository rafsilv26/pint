const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Exportar candidaturas para Excel
router.get('/excel', relatorioController.exportarCandidaturasExcel);

// Download de certificado PDF
router.get('/certificado/:id', relatorioController.downloadCertificado);

// Página pública de verificação do badge (não precisa de auth)
router.get('/verificar/:uuid', relatorioController.verificarBadge);

module.exports = router;