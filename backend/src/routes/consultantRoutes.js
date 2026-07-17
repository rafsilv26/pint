const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/', consultantController.listConsultants);
router.get('/:id', consultantController.getConsultant);
router.put('/:id', authorize('Consultor'), consultantController.updateConsultant);

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
