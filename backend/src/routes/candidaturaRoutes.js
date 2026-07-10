const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.post('/', authorize('Consultor'), upload.array('evidencias', 5), candidaturaController.submeterCandidatura);
router.get('/minhas', candidaturaController.listarMinhasCandidaturas);

// TALENT MANAGER (Admin também pode consultar/gerir, ex: página de Pedidos do admin)
router.get('/talent/pendentes', authorize('TalentManager', 'Admin'), candidaturaController.listarCandidaturasTalent);
router.put('/talent/:id/validar', authorize('TalentManager', 'Admin'), candidaturaController.validarTalentManager);

// SERVICE LINE LEADER (Admin também pode consultar/gerir; TalentManager pode
// consultar em modo leitura as candidaturas que já validou, ex: tab "Validadas")
router.get('/serviceline/pendentes', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.listarCandidaturasServiceLine);
router.put('/serviceline/:id/validar', authorize('ServiceLineLeader', 'Admin'), candidaturaController.validarServiceLine);

router.get('/:id', candidaturaController.detalhesCandidatura);

module.exports = router;
