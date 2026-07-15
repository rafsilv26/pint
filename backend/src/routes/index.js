const router = require('express').Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

// protect = o user tem de estar logado (token válido)
// authorize = o user tem de ter um role específico (Admin, TalentManager, etc)

router.use('/auth', require('./authRoutes'));
router.use('/users', protect, require('./userRoutes'));
router.use('/candidaturas', protect, require('./candidaturaRoutes'));
router.use('/relatorios', require('./relatorioRoutes'));
router.use('/catalog', protect, require('./catalogRoutes'));
router.use('/badges', protect, require('./badgeRoutes'));
router.use('/dashboard', protect, require('./dashboardRoutes'));
router.use('/consultants', protect, require('./consultantRoutes'));
router.use('/notifications', protect, require('./notificationRoutes'));
router.use('/gamification', protect, require('./gamificationRoutes'));
router.use('/email-signature', protect, require('./emailSignatureRoutes'));
router.use('/timeline', protect, require('./timelineRoutes'));
router.use('/sla', protect, require('./slaRoutes'));
router.use('/mobile-sync', protect, require('./mobileSyncRoutes'));

module.exports = router;
