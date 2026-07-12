const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/authMiddleware');
const timelineController = require('../controllers/timelineController');

// Objetivos/metas pessoais do consultor (protect aplicado no index.js)
router.get('/minha', authorize('Consultor'), timelineController.listarMeusObjetivos);
router.post('/', authorize('Consultor'), timelineController.criarObjetivo);
router.put('/:id/concluir', authorize('Consultor'), timelineController.concluirObjetivo);
router.delete('/:id', authorize('Consultor'), timelineController.apagarObjetivo);

module.exports = router;
