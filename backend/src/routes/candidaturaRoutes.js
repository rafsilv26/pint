const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const { receberEvidencias, validarConteudoFicheiros } = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', authorize('Consultor'), receberEvidencias, validarConteudoFicheiros, candidaturaController.submeterCandidatura);
router.get('/minhas', candidaturaController.listarMinhasCandidaturas);
router.get('/rascunho', authorize('Consultor'), candidaturaController.getRascunho);
router.delete('/evidencias/:id', authorize('Consultor'), candidaturaController.apagarEvidencia);

router.get('/admin/todas', authorize('Admin'), candidaturaController.listarTodasCandidaturas);

router.get('/talent/pendentes', authorize('TalentManager', 'Admin'), candidaturaController.listarCandidaturasTalent);
router.put('/talent/:id/validar', authorize('TalentManager', 'Admin'), candidaturaController.validarTalentManager);

router.put('/evidencias/:id/validar', authorize('TalentManager', 'Admin'), candidaturaController.validarEvidencia);

router.get('/serviceline/pendentes', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.listarCandidaturasServiceLine);
router.get('/serviceline/todas', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.listarTodasCandidaturasServiceLine);
router.put('/serviceline/:id/validar', authorize('ServiceLineLeader', 'Admin'), candidaturaController.validarServiceLine);

router.get('/fechadas-semana', authorize('TalentManager', 'ServiceLineLeader', 'Admin'), candidaturaController.getFechadasPorSemana);

router.get('/badges-semana', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.getBadgesAtribuidosPorSemana);

router.get('/consultor/:id', candidaturaController.listarCandidaturasPorConsultor);

router.get('/:id', candidaturaController.detalhesCandidatura);

module.exports = router;
