const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Mapeamento dos endpoints de autenticação
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;