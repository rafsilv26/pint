const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/', protect, dashboardController.getDashboard);

router.get('/atividade', protect, authorize('Admin'), dashboardController.getAtividadeAdmin);

module.exports = router;