const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');

// ─────────────────────────────────────────────
// CONSULTOR
// ─────────────────────────────────────────────

// Submeter candidatura com ficheiros
router.post('/', upload.array('evidencias', 5), candidaturaController.submeterCandidatura);

// Ver as suas candidaturas
router.get('/minhas', candidaturaController.listarMinhasCandidaturas);

// Ver detalhe de uma candidatura
router.get('/:id', candidaturaController.detalhesCandidatura);

// ─────────────────────────────────────────────
// TALENT MANAGER
// ─────────────────────────────────────────────

// Ver todas as candidaturas submetidas
router.get('/talent/pendentes', candidaturaController.listarCandidaturasTalent);

// Validar candidatura (aprovar ou rejeitar)
router.put('/:id/talent', candidaturaController.validarTalentManager);

// ─────────────────────────────────────────────
// SERVICE LINE LEADER
// ─────────────────────────────────────────────

// Ver candidaturas em validação
router.get('/serviceline/pendentes', candidaturaController.listarCandidaturasServiceLine);

// Validação final (aprovar, rejeitar ou send back)
router.put('/:id/serviceline', candidaturaController.validarServiceLine);

module.exports = router;