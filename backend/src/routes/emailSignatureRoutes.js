const express = require('express');
const router = express.Router();
const emailSignatureController = require('../controllers/emailSignatureController');

router.get('/', emailSignatureController.getMyEmailSignature);
router.put('/', emailSignatureController.saveMyEmailSignature);

module.exports = router;
