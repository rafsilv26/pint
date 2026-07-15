const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// O registo de utilizadores é feito por um administrador autenticado.
router.post('/register', protect, authorize('Admin'), authController.register);
// Auto-registo público de consultor + lista de áreas para o formulário.
router.post('/signup', authController.signup);
router.post('/resend-confirmation', authController.resendConfirmation);
router.get('/areas', authController.listarAreasPublicas);
router.post('/login', authController.login);
// Recuperação de password (fluxo público: pedir link por email + repor)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// Confirmação do endereço de email (link do email de boas-vindas)
router.post('/confirm-email', authController.confirmEmail);
router.get('/me', protect, authController.me);
router.put('/change-password', protect, authController.changePassword);
router.post('/accept-policy', protect, authController.acceptPolicy);

module.exports = router;
