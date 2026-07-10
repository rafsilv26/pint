const express = require('express');
const router = express.Router();
// IMPORTA O MIDDLEWARE DE SEGURANÇA
const { protect, authorize } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// ADICIONA O 'protect' AQUI NO MEIO:
router.get('/', protect, dashboardController.getDashboard);

// Atividade recente do sistema, para o painel de controlo do Admin.
router.get('/atividade', protect, authorize('Admin'), dashboardController.getAtividadeAdmin);

module.exports = router;