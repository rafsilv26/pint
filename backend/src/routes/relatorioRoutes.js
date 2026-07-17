const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/certificado/:publicToken', relatorioController.downloadCertificado);

router.get(
  '/certificado-gestao/:consultorId/:badgeId',
  protect,
  authorize('Admin', 'TalentManager', 'ServiceLineLeader'),
  relatorioController.downloadCertificadoGestao
);

router.get('/excel', protect, authorize('Admin', 'TalentManager', 'ServiceLineLeader'), relatorioController.exportarCandidaturasExcel);

router.get('/pdf', protect, authorize('Admin', 'TalentManager', 'ServiceLineLeader'), relatorioController.exportarCandidaturasPDF);

router.get('/verificar/:publicToken', relatorioController.verificarBadge);

module.exports = router;
