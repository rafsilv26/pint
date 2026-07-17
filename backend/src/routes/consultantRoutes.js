const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/', consultantController.listConsultants);
router.get('/:id', consultantController.getConsultant);
// Apenas um Consultor pode alterar um perfil de consultor; o controller
// confirma adicionalmente que :id corresponde ao utilizador autenticado.
router.put('/:id', authorize('Consultor'), consultantController.updateConsultant);

// Atribuição de badges especiais (BadgePremium). SLL fica restrito aos
// consultores da sua Service Line (validado no controller).
router.post(
  '/:id/premium-badges',
  authorize('Admin', 'TalentManager', 'ServiceLineLeader'),
  consultantController.atribuirBadgePremium
);
router.delete(
  '/:id/premium-badges/:badgePremiumId',
  authorize('Admin', 'TalentManager', 'ServiceLineLeader'),
  consultantController.revogarBadgePremium
);

module.exports = router;
