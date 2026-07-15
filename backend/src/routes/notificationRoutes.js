const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authorize } = require('../middlewares/authMiddleware');

// Diagnóstico do envio de emails (config em produção) — só Admin
router.get('/email-status', authorize('Admin'), notificationController.emailStatus);

// Definições globais de notificações (Admin)
router.get('/config', authorize('Admin'), notificationController.getConfigGlobal);
router.put('/config', authorize('Admin'), notificationController.saveConfigGlobal);
// Difusão de aviso a todos os consultores (Admin)
router.post('/broadcast', authorize('Admin'), notificationController.broadcastAviso);
// Verificação de SLA a pedido — só Admin
router.post('/sla-check', authorize('Admin'), notificationController.runSlaCheck);

// Preferências de notificação por email do próprio utilizador
router.get('/preferences', notificationController.getMyNotificationPrefs);
router.put('/preferences', notificationController.saveMyNotificationPrefs);
router.get('/push-status', notificationController.getMyPushStatus);
router.post('/push-token', notificationController.registerPushToken);
router.delete('/push-token', notificationController.unregisterPushToken);

router.get('/', notificationController.listNotifications);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.put('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;
