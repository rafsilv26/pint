const express = require('express');
const controller = require('../controllers/integrationController');

const router = express.Router();

router.get('/', controller.listMyIntegrations);
router.post('/', controller.saveMyIntegration);
router.post('/:id/test', controller.testMyIntegration);
router.patch('/:id', controller.updateMyIntegration);
router.delete('/:id', controller.deleteMyIntegration);

module.exports = router;
