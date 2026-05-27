const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Exportar Excel (só TalentManager e ServiceLine)
router.get('/excel', protect, authorize('TalentManager', 'ServiceLine', 'Admin'), relatorioController.exportarCandidaturasExcel);

// Download certificado (consultor dono ou admin)
router.get('/certificado/:id', protect, relatorioController.downloadCertificado);

// Verificação pública do badge (sem auth — qualquer pessoa pode ver)
router.get('/verificar/:uuid', relatorioController.verificarBadge);

module.exports = router;