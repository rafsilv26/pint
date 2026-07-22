const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/register', protect, authorize('Admin'), authController.register); 
router.post('/signup', authController.signup);
router.post('/resend-confirmation', authController.resendConfirmation);
router.get('/areas', authController.listarAreasPublicas);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/confirm-email', authController.confirmEmail);
router.get('/me', protect, authController.me);
router.put('/change-password', protect, authController.changePassword);
router.put('/idioma', protect, authController.updateIdioma);
router.post('/accept-policy', protect, authController.acceptPolicy);

module.exports = router;
