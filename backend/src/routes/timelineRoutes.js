const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authMiddleware');
const timelineController = require('../controllers/timelineController');

// Objetivos/metas pessoais do consultor (protect aplicado no index.js)
router.get('/minha', authorize('Consultor'), timelineController.listarMeusObjetivos);
router.post('/', authorize('Consultor'), timelineController.criarObjetivo);
router.put('/:id/concluir', authorize('Consultor'), timelineController.concluirObjetivo);

// Gestão da timeline de um consultor específico (Talent Manager / Admin) —
// os objetivos criados aqui aparecem na zona de timeline do consultor.
router.get('/consultor/:consultorId', authorize('TalentManager', 'Admin'), timelineController.listarObjetivosConsultor);
router.post('/consultor/:consultorId', authorize('TalentManager', 'Admin'), timelineController.criarObjetivoConsultor);
router.delete('/consultor/:consultorId/:id', authorize('TalentManager', 'Admin'), timelineController.apagarObjetivoConsultor);

router.delete('/:id', authorize('Consultor'), timelineController.apagarObjetivo);

module.exports = router;
