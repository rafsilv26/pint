const express = require('express');
const router = express.Router();
// IMPORTA O MIDDLEWARE DE SEGURANÇA
const { protect } = require('../middlewares/authMiddleware'); 
const dashboardController = require('../controllers/dashboardController');

// ADICIONA O 'protect' AQUI NO MEIO:
router.get('/', protect, dashboardController.getDashboard);

module.exports = router;