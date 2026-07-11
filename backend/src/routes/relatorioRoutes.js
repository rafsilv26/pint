const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Certificado publico por token publico da badge
router.get('/certificado/:publicToken', relatorioController.downloadCertificado);

// Certificado personalizado de uma conquista concreta. A rota autenticada
// evita a ambiguidade do token partilhado pela definição da badge.
router.get(
  '/certificado-gestao/:consultorId/:badgeId',
  protect,
  authorize('Admin', 'TalentManager', 'ServiceLineLeader'),
  relatorioController.downloadCertificadoGestao
);

// Só Admin, TalentManager e ServiceLineLeader podem ver Excel
router.get('/excel', protect, authorize('Admin', 'TalentManager', 'ServiceLineLeader'), relatorioController.exportarCandidaturasExcel);

// Relatório PDF de todas as candidaturas
router.get('/pdf', protect, authorize('Admin', 'TalentManager', 'ServiceLineLeader'), relatorioController.exportarCandidaturasPDF);

// Público — sem restrições
router.get('/verificar/:publicToken', relatorioController.verificarBadge);

module.exports = router;
