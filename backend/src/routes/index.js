const router = require('express').Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

// protect = o user tem de estar logado (token válido)
// authorize = o user tem de ter um role específico (Admin, TalentManager, etc)

router.use('/auth', require('./authRoutes'));
router.use('/users', protect, authorize('Admin'), require('./userRoutes'));
router.use('/relatorios', protect, authorize('Admin', 'TalentManager', 'ServiceLineLeader'), require('./relatorioRoutes'));

module.exports = router;