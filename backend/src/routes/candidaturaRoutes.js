const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use((req, res, next) => {
  console.log('🔵 Candidatura route chamada:', req.method, req.path);
  next();
});

// CONSULTOR
router.post('/', protect, upload.array('evidencias', 5), candidaturaController.submeterCandidatura);
router.get('/minhas', protect, candidaturaController.listarMinhasCandidaturas);

// TALENT MANAGER
router.get('/talent/pendentes', protect, authorize('TalentManager'), candidaturaController.listarCandidaturasTalent);
router.put('/talent/:id/validar', protect, authorize('TalentManager'), candidaturaController.validarTalentManager);

// SERVICE LINE LEADER
router.get('/serviceline/pendentes', protect, authorize('ServiceLine'), candidaturaController.listarCandidaturasServiceLine);
router.put('/serviceline/:id/validar', protect, authorize('ServiceLine'), candidaturaController.validarServiceLine);

router.use((req, res, next) => {
  console.log('Rota chamada:', req.method, req.path);
  next();
});

// ⚠️ Esta tem de ficar SEMPRE no fim — apanha qualquer /:id
router.get('/:id', protect, candidaturaController.detalhesCandidatura);

module.exports = router;