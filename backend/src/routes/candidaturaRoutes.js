const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────
// CONSULTOR
// ─────────────────────────────────────────────

// Submeter candidatura com ficheiros
router.post('/', protect, upload.array('evidencias', 5), candidaturaController.submeterCandidatura);

// Ver as suas candidaturas
router.get('/minhas', protect, candidaturaController.listarMinhasCandidaturas);

// Ver detalhe de uma candidatura
router.get('/:id', protect, candidaturaController.detalhesCandidatura);



// ─────────────────────────────────────────────
// TALENT MANAGER
// ─────────────────────────────────────────────

// Ver todas as candidaturas submetidas
router.get('/talent/pendentes', protect, authorize('TalentManager'), candidaturaController.listarCandidaturasTalent);

// Validar candidatura (aprovar ou rejeitar)
router.put('/:id/talent', protect, authorize('TalentManager'), candidaturaController.validarTalentManager);


// ─────────────────────────────────────────────
// SERVICE LINE LEADER
// ─────────────────────────────────────────────

// Ver candidaturas em validação
router.get('/serviceline/pendentes', protect, authorize('ServiceLine'), candidaturaController.listarCandidaturasServiceLine);

// Validação final (aprovar, rejeitar ou send back)
router.put('/:id/serviceline', protect, authorize('ServiceLine'), candidaturaController.validarServiceLine);

module.exports = router;
