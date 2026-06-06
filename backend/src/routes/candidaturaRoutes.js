const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.post('/', authorize('Consultor'), upload.array('evidencias', 5), candidaturaController.submeterCandidatura);
router.get('/minhas', candidaturaController.listarMinhasCandidaturas);

// TALENT MANAGER
router.get('/talent/pendentes', authorize('TalentManager'), candidaturaController.listarCandidaturasTalent);
router.put('/talent/:id/validar', authorize('TalentManager'), candidaturaController.validarTalentManager);

// SERVICE LINE LEADER
router.get('/serviceline/pendentes', authorize('ServiceLineLeader'), candidaturaController.listarCandidaturasServiceLine);
router.put('/serviceline/:id/validar', authorize('ServiceLineLeader'), candidaturaController.validarServiceLine);

router.get('/:id', candidaturaController.detalhesCandidatura);

module.exports = router;
