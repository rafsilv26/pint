const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// O registo de utilizadores é feito por um administrador autenticado.
router.post('/register', protect, authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.me);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
