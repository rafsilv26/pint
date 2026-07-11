const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authorize } = require('../middlewares/authMiddleware');

// Diagnóstico do envio de emails (config SMTP em produção) — só Admin
router.get('/email-status', authorize('Admin'), notificationController.emailStatus);

router.get('/', notificationController.listNotifications);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.put('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;
