const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/', consultantController.listConsultants);
router.get('/:id', consultantController.getConsultant);
// Apenas um Consultor pode alterar um perfil de consultor; o controller
// confirma adicionalmente que :id corresponde ao utilizador autenticado.
router.put('/:id', authorize('Consultor'), consultantController.updateConsultant);

module.exports = router;
