const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Consultor pode descarregar o seu certificado
router.get('/certificado/:id', relatorioController.downloadCertificado);

// Só Admin, TalentManager e ServiceLine podem ver Excel
router.get('/excel', protect, authorize('Admin', 'TalentManager', 'ServiceLine'), relatorioController.exportarCandidaturasExcel);

// Público — sem restrições
router.get('/verificar/:uuid', relatorioController.verificarBadge);

module.exports = router;