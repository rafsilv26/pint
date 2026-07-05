const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');

router.get('/', consultantController.listConsultants);
router.get('/:id', consultantController.getConsultant);
router.put('/:id', consultantController.updateConsultant);

module.exports = router;
